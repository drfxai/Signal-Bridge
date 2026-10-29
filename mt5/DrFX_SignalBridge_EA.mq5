//+------------------------------------------------------------------+
//|                DrFX SignalBridge direct EA / licensed build        |
//| Direct Cloudflare WebSocket, replay-safe, DEMO-only execution    |
//+------------------------------------------------------------------+
#property copyright "DrFXAi"
#property link      "https://github.com/drfxai/Signal-Bridge"
#property strict
#property version   "0.290"
#property description "SignalBridge EA v0.29.0: animated command-center panel, live telemetry and account-bound connection tests."
#property description "Signals remain DEMO-only. Explicitly confirmed, opt-in account-bound LIVE tests are supported."
#property description "Enter your private activation code in the first EA input. No compilation required for EX5 users."

#include <Trade\Trade.mqh>

input group "=== 01 | PERSONAL ACTIVATION ==="
input string InpActivationCode=""; // Private one-user license key (enter after attaching to a chart)

input group "=== 02 | SignalBridge Cloud ==="
input string InpCloudHost="signalbridge.drfx.online";
input int InpCloudPort=443;
input string InpCloudPath="/v1/ea/ws";
input int InpTimerMs=50;
input int InpReconnectMs=1000;

input group "=== DEMO signals / confirmed connection tests ==="
input bool InpEnableDemoExecution=true;
input bool InpEnableLiveConnectionTest=true; // Separate opt-in for confirmed LIVE position tests only
input int InpTestEmergencySLPoints=2000; // Broker-side emergency stop for timed tests
input bool InpAnimations=true;
input int InpUiRefreshMs=40; // UI animation frame interval, clamped to 33-1000 ms
input bool InpEnableConnectionTest=true; // Enable configured BUY position test / local 5-second exit
input long InpMagic=770425;
input double InpMaxLot=0.10;
input double InpMaxRiskPercent=1.00;
input double InpMaxPriceDeviationPct=0.75;
input int InpMaxOpenTrades=4;
input int InpMaxSpreadPoints=80;
input int InpSlippagePoints=20;
input group "=== Broker Symbol Settings | XAUUSD.p / GOLD ==="
input string InpGoldSymbol=""; // Exact broker gold symbol for XAUUSD signals AND tests, e.g. XAUUSD.p
input string InpTestSymbol="XAUUSD"; // Test instrument; change to EURUSD, GBPUSD or exact broker symbol
input double InpDefaultLots=0.01; // Default test lots; explicit signal volume is preserved
input string InpSymbolPrefix=""; // Prefix for other signal symbols, e.g. m
input string InpSymbolSuffix=""; // Suffix for other signal symbols, e.g. .p

input group "=== Daily Account Drawdown | closes ALL account positions ==="
input double InpDailyDrawdownPercent=10.0; // Equity loss limit; manual restart required after HIT

enum ENUM_SB_EXIT { SB_EXIT_OFF=0,SB_EXIT_BE=1,SB_EXIT_CLOSE=2,SB_EXIT_PARTIAL=3 };
input group "=== Target management | new positions only ==="
input ENUM_SB_EXIT InpTP1Action=SB_EXIT_BE;
input ENUM_SB_EXIT InpTP2Action=SB_EXIT_CLOSE;
input ENUM_SB_EXIT InpTP3Action=SB_EXIT_OFF;
input double InpPartialPercent=50;
input int InpBreakEvenBufferPoints=0;

input group "=== Live Panel ==="
input bool InpShowPanel=true;
input bool InpCompact=false;
input ENUM_BASE_CORNER InpCorner=CORNER_LEFT_UPPER;
input int InpPanelX=16;
input int InpPanelY=22;
input int InpPanelWidth=420; // 380-560 px; drag the header to move the panel

#define SBP "SB290_"
#define MAX_PENDING 32
#define MAX_RECEIPTS 64
CTrade trade;
int g_socket=INVALID_HANDLE;
bool g_wsReady=false;
bool g_licenseActive=false;
string g_licenseExpires="";
uchar g_frameBuf[];
string g_lastSignal="WAITING",g_lastExecution="NO COMMAND",g_lastTicket="-";
ulong g_lastConnectTry=0,g_lastHb=0,g_lastReconcile=0,g_lastPing=0,g_pingStarted=0,g_lastUiUpdate=0;
double g_cloudRttMs=0;
bool g_compact=false;
long g_serverMs=0,g_licenseExpiryMs=0;
ulong g_licenseVerifiedTick=0;
string g_testId="",g_testTag="",g_testPhase="",g_testDetail="";
long g_testDue=0;
ulong g_testDeadlineTick=0,g_testRetryTick=0;
string g_testAccountMode="",g_testLogin="",g_testServer="";
ulong g_activityTick=0;
bool g_testCorrupt=false;
int g_testLock=INVALID_HANDLE;

string g_lastSource="WAITING",g_lastStrategy="";
string g_connStage="ACTIVATION CODE REQUIRED";
string g_pendingTag[MAX_PENDING],g_pendingId[MAX_PENDING];
string g_receiptId[MAX_RECEIPTS],g_receiptStatus[MAX_RECEIPTS],g_receiptTicket[MAX_RECEIPTS],g_receiptRetcode[MAX_RECEIPTS],g_receiptDetail[MAX_RECEIPTS];
color C_BG=C'0,0,0',C_BG2=C'6,26,45',C_BORDER=C'23,68,109',C_TEXT=C'234,245,255',C_MUTED=C'139,160,184',C_CYAN=C'82,215,255',C_GREEN=C'69,213,161',C_AMBER=C'243,189,98',C_RED=C'255,111,125';

string N64(long v){return IntegerToString(v);}
string F2(double v){return DoubleToString(v,2);}
string Safe(string s){StringReplace(s,"|","/");StringReplace(s,"\r"," ");StringReplace(s,"\n"," ");return s;}
string GVVol(string tag){return "SBV_"+tag;}
string GVTicket(string tag){return "SBT_"+tag;}
string GVPosId(string tag){return "SBP_"+tag;}
void FlushTradeIdentity(){GlobalVariablesFlush();}

int CountMyPositions(){int n=0;for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t>0&&PositionSelectByTicket(t)&&PositionGetInteger(POSITION_MAGIC)==InpMagic)n++;}return n;}
string MarginMode(){long m=AccountInfoInteger(ACCOUNT_MARGIN_MODE);if(m==ACCOUNT_MARGIN_MODE_RETAIL_HEDGING)return "HEDGING";if(m==ACCOUNT_MARGIN_MODE_RETAIL_NETTING)return "NETTING";if(m==ACCOUNT_MARGIN_MODE_EXCHANGE)return "EXCHANGE";return "UNKNOWN";}
string AccountMode(){long m=AccountInfoInteger(ACCOUNT_TRADE_MODE);if(m==ACCOUNT_TRADE_MODE_DEMO)return "DEMO";if(m==ACCOUNT_TRADE_MODE_REAL)return "LIVE";if(m==ACCOUNT_TRADE_MODE_CONTEST)return "CONTEST";return "UNKNOWN";}

void DeletePanel(){for(int i=ObjectsTotal(0,0,-1)-1;i>=0;i--){string n=ObjectName(0,i,0,-1);if(StringFind(n,SBP)==0)ObjectDelete(0,n);}}
void Rect(string id,int x,int y,int w,int h,color bg,color border){string n=SBP+id;if(ObjectFind(0,n)<0)ObjectCreate(0,n,OBJ_RECTANGLE_LABEL,0,0,0);ObjectSetInteger(0,n,OBJPROP_CORNER,InpCorner);ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);ObjectSetInteger(0,n,OBJPROP_XSIZE,w);ObjectSetInteger(0,n,OBJPROP_YSIZE,h);ObjectSetInteger(0,n,OBJPROP_BGCOLOR,bg);ObjectSetInteger(0,n,OBJPROP_COLOR,border);ObjectSetInteger(0,n,OBJPROP_BORDER_TYPE,BORDER_FLAT);ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,n,OBJPROP_HIDDEN,true);}
void Label(string id,int x,int y,string text,int size,color col,string font="Segoe UI"){string n=SBP+id;if(ObjectFind(0,n)<0)ObjectCreate(0,n,OBJ_LABEL,0,0,0);ObjectSetInteger(0,n,OBJPROP_CORNER,InpCorner);ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);ObjectSetInteger(0,n,OBJPROP_FONTSIZE,size);ObjectSetInteger(0,n,OBJPROP_COLOR,col);ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_LEFT_UPPER);ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,n,OBJPROP_HIDDEN,true);ObjectSetString(0,n,OBJPROP_FONT,font);ObjectSetString(0,n,OBJPROP_TEXT,text);}
void Button(string id,int x,int y,int w,int h,string text){string n=SBP+id;if(ObjectFind(0,n)<0)ObjectCreate(0,n,OBJ_BUTTON,0,0,0);ObjectSetInteger(0,n,OBJPROP_CORNER,InpCorner);ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);ObjectSetInteger(0,n,OBJPROP_XSIZE,w);ObjectSetInteger(0,n,OBJPROP_YSIZE,h);ObjectSetInteger(0,n,OBJPROP_BGCOLOR,C_BG);ObjectSetInteger(0,n,OBJPROP_COLOR,C_MUTED);ObjectSetInteger(0,n,OBJPROP_BORDER_COLOR,C_BORDER);ObjectSetInteger(0,n,OBJPROP_FONTSIZE,8);ObjectSetString(0,n,OBJPROP_TEXT,text);ObjectSetString(0,n,OBJPROP_FONT,"Segoe UI");}

bool ValidActivationCode(string code){
 if(StringLen(code)!=43)return false;
 for(int i=0;i<43;i++){
  int v=(int)StringGetCharacter(code,i);
  if(!((v>=48&&v<=57)||(v>=65&&v<=90)||(v>=97&&v<=122)||v==45||v==95))return false;
 }
 return true;
}
bool CloudConnected(){return g_socket!=INVALID_HANDLE&&g_wsReady&&SocketIsConnected(g_socket);}
void AppendBytes(uchar &dst[],const uchar &src[],int count){
 if(count<=0)return;int old=ArraySize(dst);ArrayResize(dst,old+count);ArrayCopy(dst,src,old,0,count);
}
void DropBytes(uchar &buf[],int count){
 int n=ArraySize(buf);if(count<=0)return;if(count>=n){ArrayResize(buf,0);return;}for(int i=count;i<n;i++)buf[i-count]=buf[i];ArrayResize(buf,n-count);
}
int HeaderEnd(const uchar &buf[]){
 int n=ArraySize(buf);for(int i=0;i+3<n;i++)if(buf[i]==13&&buf[i+1]==10&&buf[i+2]==13&&buf[i+3]==10)return i+4;return -1;
}
string Base64(const uchar &src[],int count){
 const string tbl="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
 string out="";for(int i=0;i<count;i+=3){int a=src[i],b=(i+1<count)?src[i+1]:0,d=(i+2<count)?src[i+2]:0;int v=(a<<16)|(b<<8)|d;
  out+=StringSubstr(tbl,(v>>18)&63,1);out+=StringSubstr(tbl,(v>>12)&63,1);out+=(i+1<count)?StringSubstr(tbl,(v>>6)&63,1):"=";out+=(i+2<count)?StringSubstr(tbl,v&63,1):"=";}
 return out;
}
bool TlsSendRaw(const uchar &data[],int len){if(g_socket==INVALID_HANDLE||len<=0)return false;return SocketTlsSend(g_socket,data,(uint)len)==len;}
bool TlsSendString(string text){uchar data[];int n=StringToCharArray(text,data,0,WHOLE_ARRAY,CP_UTF8);if(n<=1)return false;return TlsSendRaw(data,n-1);}
bool WsSendFrame(int opcode,string text){
 if(!CloudConnected())return false;uchar payload[];int n=StringToCharArray(text,payload,0,WHOLE_ARRAY,CP_UTF8);if(n>0)n--;if(n<0||n>65535)return false;
 int header=(n<126)?6:8,total=header+n;uchar out[];ArrayResize(out,total);out[0]=(uchar)(0x80|(opcode&0x0F));
 int pos=0;if(n<126){out[1]=(uchar)(0x80|n);pos=2;}else{out[1]=(uchar)(0x80|126);out[2]=(uchar)((n>>8)&255);out[3]=(uchar)(n&255);pos=4;}
 uchar mask[4];for(int i=0;i<4;i++){mask[i]=(uchar)(MathRand()&255);out[pos+i]=mask[i];}pos+=4;
 for(int i=0;i<n;i++)out[pos+i]=(uchar)(payload[i]^mask[i&3]);return TlsSendRaw(out,total);
}
bool WsSendText(string text){return WsSendFrame(1,text);}
bool SendLine(string line){return WsSendText(line);}
void DisconnectCloud(){if(g_socket!=INVALID_HANDLE){SocketClose(g_socket);g_socket=INVALID_HANDLE;}g_wsReady=false;g_licenseActive=false;g_licenseExpires="";g_licenseExpiryMs=0;ArrayResize(g_frameBuf,0);}
bool WsHandshake(){
 uchar nonce[];ArrayResize(nonce,16);for(int i=0;i<16;i++)nonce[i]=(uchar)(MathRand()&255);
 string key=Base64(nonce,16);
 string req="GET "+InpCloudPath+" HTTP/1.1\r\nHost: "+InpCloudHost+"\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: "+key+"\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Protocol: signalbridge-ea-v1, sb-token."+InpActivationCode+"\r\nUser-Agent: DrFX-SignalBridge-EA/0.29.0\r\n\r\n";
 if(!TlsSendString(req))return false;
 uchar pending[];ulong until=GetTickCount64()+5000;
 while(GetTickCount64()<until&&!IsStopped()){
  uchar chunk[];int got=SocketTlsReadAvailable(g_socket,chunk,32768);if(got<0)return false;if(got>0){AppendBytes(pending,chunk,got);int e=HeaderEnd(pending);if(e>0){
    string h=CharArrayToString(pending,0,e,CP_UTF8);
    string lines[];int count=StringSplit(h,10,lines);
    if(count<4||StringFind(lines[0]," 101 ")<0){string responseCode=count>0?lines[0]:"EMPTY RESPONSE";g_connStage="WEBSOCKET REFUSED (HTTP)";Print("SignalBridge: WebSocket upgrade refused: ",responseCode,". Check the activation status in drfx.company and live Cloudflare EA licensing.");return false;}
    string selected="",accept="",upgrade="",connection="";
    for(int j=1;j<count;j++){string header=lines[j];StringTrimLeft(header);StringTrimRight(header);int colon=StringFind(header,":");if(colon<=0)continue;
     string name=StringSubstr(header,0,colon),value=StringSubstr(header,colon+1);StringToLower(name);StringTrimLeft(value);StringTrimRight(value);
     if(name=="sec-websocket-protocol")selected=value;
     if(name=="sec-websocket-accept")accept=value;
     if(name=="upgrade")upgrade=value;
     if(name=="connection")connection=value;
    }
    StringToLower(upgrade);StringToLower(connection);
    uchar shaSource[],emptyKey[],shaOut[];
    string challenge=key+"258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    int challengeLen=StringToCharArray(challenge,shaSource,0,WHOLE_ARRAY,CP_UTF8)-1;
    if(challengeLen<=0)return false;ArrayResize(shaSource,challengeLen);
    if(CryptEncode(CRYPT_HASH_SHA1,shaSource,emptyKey,shaOut)!=20)return false;
    string expectedAccept=Base64(shaOut,20);
    if(selected!="signalbridge-ea-v1"||upgrade!="websocket"||StringFind(connection,"upgrade")<0||accept!=expectedAccept){g_connStage="INVALID WEBSOCKET RESPONSE";Print("SignalBridge: handshake validation failed (no credentials logged).");return false;}
    int rest=ArraySize(pending)-e;if(rest>0){uchar tail[];ArrayResize(tail,rest);ArrayCopy(tail,pending,0,e,rest);AppendBytes(g_frameBuf,tail,rest);}
    g_wsReady=true;g_connStage="CONNECTED - WAITING FOR LICENSE";return true;
   }}
  RiskCheck();Sleep(10);
 }
 return false;
}

string g_riskPrefix="";bool g_riskHit=false;double g_dayFlow=0,g_riskBase=0,g_riskFlow=0,g_riskDD=0,g_dailyProfit=0,g_hitId=0;long g_riskDay=0,g_signalCount=0;int g_targets=0,g_stops=0;ulong g_riskCloseTick=0,g_statsTick=0;
uint RiskHash(string value){uint h=2166136261;for(int i=0;i<StringLen(value);i++)h=(h^(uint)StringGetCharacter(value,i))*16777619;return h;}
string RiskKey(string name){return g_riskPrefix+name;}
long BrokerDay(){MqlDateTime d;TimeToStruct(TimeCurrent(),d);d.hour=0;d.min=0;d.sec=0;return (long)StructToTime(d);}
double DayCashFlow(){double flow=0;if(!HistorySelect((datetime)(g_riskDay>0?g_riskDay:BrokerDay()),TimeCurrent()))return g_dayFlow;for(int i=0;i<HistoryDealsTotal();i++){ulong t=HistoryDealGetTicket(i);long type=HistoryDealGetInteger(t,DEAL_TYPE);if(type==DEAL_TYPE_BALANCE||type==DEAL_TYPE_CREDIT)flow+=HistoryDealGetDouble(t,DEAL_PROFIT);}return flow;}
void SaveRisk(){GlobalVariableSet(RiskKey("day"),(double)g_riskDay);GlobalVariableSet(RiskKey("base"),g_riskBase);GlobalVariableSet(RiskKey("flow"),g_riskFlow);GlobalVariableSet(RiskKey("hit"),g_riskHit?1:0);GlobalVariableSet(RiskKey("hitid"),g_hitId);GlobalVariablesFlush();}
void RefreshDayStats(){
 if(g_statsTick>0&&GetTickCount64()-g_statsTick<1000)return;g_statsTick=GetTickCount64();g_dayFlow=DayCashFlow();g_dailyProfit=AccountInfoDouble(ACCOUNT_PROFIT);g_targets=0;g_stops=0;
 if(HistorySelect((datetime)BrokerDay(),TimeCurrent()))for(int i=0;i<HistoryDealsTotal();i++){
  ulong t=HistoryDealGetTicket(i);long type=HistoryDealGetInteger(t,DEAL_TYPE);if(type!=DEAL_TYPE_BUY&&type!=DEAL_TYPE_SELL)continue;
  g_dailyProfit+=HistoryDealGetDouble(t,DEAL_PROFIT)+HistoryDealGetDouble(t,DEAL_COMMISSION)+HistoryDealGetDouble(t,DEAL_SWAP)+HistoryDealGetDouble(t,DEAL_FEE);
  long entry=HistoryDealGetInteger(t,DEAL_ENTRY);if(entry!=DEAL_ENTRY_OUT&&entry!=DEAL_ENTRY_OUT_BY&&entry!=DEAL_ENTRY_INOUT)continue;
  long reason=HistoryDealGetInteger(t,DEAL_REASON);double classified=GlobalVariableCheck(RiskKey("deal"+N64((long)t)))?GlobalVariableGet(RiskKey("deal"+N64((long)t))):0;
  if(reason==DEAL_REASON_TP||classified==1)g_targets++;if(reason==DEAL_REASON_SL||classified==2)g_stops++;
 }
 string k=RiskKey("signals"+N64(BrokerDay()));g_signalCount=GlobalVariableCheck(k)?(long)GlobalVariableGet(k):0;
}
void RiskInit(){
 g_riskPrefix="SBR_"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"_"+StringFormat("%08X%08X",RiskHash(AccountInfoString(ACCOUNT_SERVER)),RiskHash("server:"+AccountInfoString(ACCOUNT_SERVER)))+"_";
 g_riskDay=GlobalVariableCheck(RiskKey("day"))?(long)GlobalVariableGet(RiskKey("day")):BrokerDay();
 g_riskBase=GlobalVariableCheck(RiskKey("base"))?GlobalVariableGet(RiskKey("base")):AccountInfoDouble(ACCOUNT_EQUITY);
 g_riskFlow=GlobalVariableCheck(RiskKey("flow"))?GlobalVariableGet(RiskKey("flow")):DayCashFlow();
 g_riskHit=GlobalVariableCheck(RiskKey("hit"))&&GlobalVariableGet(RiskKey("hit"))==1;
 g_hitId=GlobalVariableCheck(RiskKey("hitid"))?GlobalVariableGet(RiskKey("hitid")):0;g_dayFlow=g_riskFlow;SaveRisk();
}
double DailyDrawdownValue(double base,double equity,double netCashFlow){double adjusted=base+netCashFlow;return adjusted>0?MathMax(0,(adjusted-equity)/adjusted*100):0;}
bool DailyRiskLatch(bool hit,double base,double drawdown,double limit){return hit||base<=0||drawdown>=limit;}
void RiskCheck(){
 if(g_riskPrefix=="")return;
 // Reload the shared account latch so every chart in this terminal respects HIT.
 if(GlobalVariableCheck(RiskKey("hit"))){g_riskHit=GlobalVariableGet(RiskKey("hit"))==1;g_riskBase=GlobalVariableGet(RiskKey("base"));g_riskFlow=GlobalVariableGet(RiskKey("flow"));g_riskDay=(long)GlobalVariableGet(RiskKey("day"));g_hitId=GlobalVariableGet(RiskKey("hitid"));}
 if(!g_riskHit&&g_riskDay!=BrokerDay()){g_riskDay=BrokerDay();g_riskBase=AccountInfoDouble(ACCOUNT_EQUITY);g_riskFlow=DayCashFlow();g_dayFlow=g_riskFlow;g_statsTick=0;SaveRisk();}
 RefreshDayStats();double adjustedBase=g_riskBase+g_dayFlow-g_riskFlow;
 g_riskDD=DailyDrawdownValue(g_riskBase,AccountInfoDouble(ACCOUNT_EQUITY),g_dayFlow-g_riskFlow);
 if(!g_riskHit&&DailyRiskLatch(g_riskHit,adjustedBase,g_riskDD,InpDailyDrawdownPercent)){g_riskHit=true;g_hitId=(double)TimeLocal()*1000+(double)(GetTickCount64()%1000);SaveRisk();g_lastExecution="DAILY DRAWDOWN HIT - closing ALL account positions";}
 RefreshDayStats();
 if(!g_riskHit||GetTickCount64()-g_riskCloseTick<1000)return;g_riskCloseTick=GetTickCount64();
 trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);
 // Account-wide scope is intentional: includes manual positions and other EAs.
 for(int i=OrdersTotal()-1;i>=0;i--){ulong t=OrderGetTicket(i);if(t>0&&!trade.OrderDelete(t))Print("SignalBridge DD pending-order cancel retry: ",trade.ResultRetcodeDescription());}
 for(int i=PositionsTotal()-1;i>=0;i--){ulong t=PositionGetTicket(i);if(t==0||!PositionSelectByTicket(t))continue;trade.SetTypeFillingBySymbol(PositionGetString(POSITION_SYMBOL));if(!trade.PositionClose(t))Print("SignalBridge DD position close retry: ",trade.ResultRetcodeDescription());}
}
bool ResetDailyRisk(double expectedHit){
 RiskCheck();if(!g_riskHit||expectedHit!=g_hitId||PositionsTotal()>0||OrdersTotal()>0||AccountInfoDouble(ACCOUNT_EQUITY)<=0)return false;
 g_riskBase=AccountInfoDouble(ACCOUNT_EQUITY);g_riskDay=BrokerDay();g_riskFlow=DayCashFlow();g_dayFlow=g_riskFlow;g_statsTick=0;g_riskHit=false;g_riskDD=0;SaveRisk();g_lastExecution="DAILY DRAWDOWN RESET - ready for new signals";SendHeartbeat();return true;
}
void CountSignal(string id){
 string seen=RiskKey("s"+StringFormat("%08X",RiskHash(id))+N64(BrokerDay()));if(GlobalVariableCheck(seen))return;
 GlobalVariableSet(seen,1);GlobalVariableSet(RiskKey("sigE"+StringFormat("%08X",RiskHash(id))), (double)TimeCurrent());string k=RiskKey("signals"+N64(BrokerDay()));if(!GlobalVariableCheck(k))GlobalVariableSet(k,0);double n=GlobalVariableGet(k);GlobalVariableSetOnCondition(k,n+1,n);GlobalVariablesFlush();g_signalCount=(long)GlobalVariableGet(k);
}
void RecordManagedExit(string event){ulong d=trade.ResultDeal();if(d==0)return;double kind=(event=="SL"?2:(event=="TP1"||event=="TP2"||event=="TP3")?1:0);if(kind>0){GlobalVariableSet(RiskKey("deal"+N64((long)d)),kind);GlobalVariablesFlush();g_statsTick=0;}}
string TestSymbol(){string reason="",sym=ResolveTestSymbol(reason);return sym==""?InpTestSymbol:sym;}
string RiskTelemetry(){return "|"+(g_riskHit?"HIT":"READY")+"|"+F2(g_riskDD)+"|"+F2(InpDailyDrawdownPercent)+"|"+F2(g_dailyProfit)+"|"+N64(g_signalCount)+"|"+IntegerToString(g_targets)+"|"+IntegerToString(g_stops)+"|"+Safe(TestSymbol())+"|"+DoubleToString(InpDefaultLots,4)+"|"+DoubleToString(g_hitId,0);}
// Snapshot exit rules before submission; broker-side TP backs up the first full exit.
bool g_policyDirty=false;string g_policy1="BE",g_policy2="CLOSE",g_policy3="OFF",g_reportResetId="";double g_policyPartial=50;int g_policyBuffer=0;long g_reportViewSince=0,g_reportResetFloor=0,g_reportSince=0;ulong g_reportTick=0;double g_reportBars[14];long g_reportSignals=0,g_reportTP1=0,g_reportTP2=0,g_reportTP3=0,g_reportStops=0;double g_reportProfit=0,g_reportLoss=0;ulong g_policyTick=0;
string PK(string tag,string field){return RiskKey(tag+field);}
string PolicyAction(int i){return i==0?g_policy1:i==1?g_policy2:g_policy3;}
bool ValidPolicyAction(string a){return a=="BE"||a=="CLOSE"||a=="PARTIAL"||a=="OFF";}
void SavePolicyDefaults(){GlobalVariableSet(RiskKey("p1"),PolicyCode(g_policy1));GlobalVariableSet(RiskKey("p2"),PolicyCode(g_policy2));GlobalVariableSet(RiskKey("p3"),PolicyCode(g_policy3));GlobalVariableSet(RiskKey("pp"),g_policyPartial);GlobalVariableSet(RiskKey("pb"),g_policyBuffer);GlobalVariablesFlush();}
int PolicyCode(string a){return a=="BE"?1:a=="CLOSE"?2:a=="PARTIAL"?3:0;}
string PolicyName(int a){return a==1?"BE":a==2?"CLOSE":a==3?"PARTIAL":"OFF";}
void LoadPolicyDefaults(){
 g_policy1=PolicyName((int)InpTP1Action);g_policy2=PolicyName((int)InpTP2Action);g_policy3=PolicyName((int)InpTP3Action);g_policyPartial=InpPartialPercent;g_policyBuffer=InpBreakEvenBufferPoints;
 double sig=(double)RiskHash(g_policy1+"|"+g_policy2+"|"+g_policy3+"|"+F2(g_policyPartial)+"|"+IntegerToString(g_policyBuffer));bool stored=GlobalVariableCheck(RiskKey("input_sig"));bool changed=stored?GlobalVariableGet(RiskKey("input_sig"))!=sig:(g_policy1!="BE"||g_policy2!="CLOSE"||g_policy3!="OFF"||g_policyPartial!=50||g_policyBuffer!=0);
 g_policyDirty=GlobalVariableCheck(RiskKey("policy_dirty"))&&GlobalVariableGet(RiskKey("policy_dirty"))==1;if(changed){g_policyDirty=true;GlobalVariableSet(RiskKey("policy_dirty"),1);SavePolicyDefaults();}else if(GlobalVariableCheck(RiskKey("p1"))){g_policy1=PolicyName((int)GlobalVariableGet(RiskKey("p1")));g_policy2=PolicyName((int)GlobalVariableGet(RiskKey("p2")));g_policy3=PolicyName((int)GlobalVariableGet(RiskKey("p3")));g_policyPartial=GlobalVariableGet(RiskKey("pp"));g_policyBuffer=(int)GlobalVariableGet(RiskKey("pb"));}
 GlobalVariableSet(RiskKey("input_sig"),sig);GlobalVariablesFlush();g_reportResetFloor=GlobalVariableCheck(RiskKey("report_since"))?(long)GlobalVariableGet(RiskKey("report_since")):0;g_reportViewSince=BrokerDay();g_reportSince=(long)MathMax(g_reportResetFloor,g_reportViewSince);
}
double PolicyClosePrice(double t1,double t2,double t3){double levels[3];levels[0]=t1;levels[1]=t2;levels[2]=t3;for(int i=0;i<3;i++)if(PolicyAction(i)=="CLOSE")return levels[i];return 0;}
void SavePositionPolicy(string tag,double t1,double t2,double t3,double lots){double levels[3];levels[0]=t1;levels[1]=t2;levels[2]=t3;for(int i=0;i<3;i++){GlobalVariableSet(PK(tag,"t"+IntegerToString(i)),levels[i]);GlobalVariableSet(PK(tag,"a"+IntegerToString(i)),PolicyCode(PolicyAction(i)));}GlobalVariableSet(PK(tag,"pct"),g_policyPartial);GlobalVariableSet(PK(tag,"buf"),g_policyBuffer);GlobalVariableSet(PK(tag,"vol"),lots);GlobalVariablesFlush();}
void QueueTargetEvent(string tag,int i,int state){GlobalVariableSet(PK(tag,"e"+IntegerToString(i)),state);GlobalVariablesFlush();}
void FlushTargetEvents(){if(!CloudConnected())return;int count=0;for(int n=GlobalVariablesTotal()-1;n>=0&&count<12;n--){string key=GlobalVariableName(n);if(StringFind(key,g_riskPrefix)!=0)continue;string tail=StringSubstr(key,StringLen(g_riskPrefix));if(StringLen(tail)!=14||StringSubstr(tail,12,1)!="e")continue;int i=(int)StringToInteger(StringSubstr(tail,13));if(i<0||i>2)continue;string tag=StringSubstr(tail,0,12);int state=(int)GlobalVariableGet(key);if(GlobalVariableCheck(PK(tag,"ack"+IntegerToString(i)))&&GlobalVariableGet(PK(tag,"ack"+IntegerToString(i)))==state)continue;if(SendLine("TARGET_EVENT|"+tag+"|"+IntegerToString(i)+"|"+IntegerToString(state)+"|"+IntegerToString((int)GlobalVariableGet(PK(tag,"a"+IntegerToString(i))))))count++;}}
void PolicyHit(string tag,int i){string key=PK(tag,"h"+IntegerToString(i));if(!GlobalVariableCheck(key)){GlobalVariableSet(key,(double)TimeCurrent());GlobalVariablesFlush();QueueTargetEvent(tag,i,1);}}
void ApplyPositionTarget(string tag,ulong ticket,int i){
 string stateKey=PK(tag,"s"+IntegerToString(i));if(GlobalVariableCheck(stateKey)&&GlobalVariableGet(stateKey)==2)return;
 if(!PositionSelectByTicket(ticket)||(long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)return;
 int action=(int)GlobalVariableGet(PK(tag,"a"+IntegerToString(i)));if(action==0)return;PolicyHit(tag,i);
 string sym=PositionGetString(POSITION_SYMBOL);double open=PositionGetDouble(POSITION_PRICE_OPEN),sl=PositionGetDouble(POSITION_SL),tp=PositionGetDouble(POSITION_TP),volume=PositionGetDouble(POSITION_VOLUME);bool buy=(ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY;
 trade.SetExpertMagicNumber(InpMagic);trade.SetTypeFillingBySymbol(sym);trade.SetDeviationInPoints(InpSlippagePoints);
 if(action==1){
  double point=SymbolInfoDouble(sym,SYMBOL_POINT),step=SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_SIZE),buffer=GlobalVariableGet(PK(tag,"buf"))*point;if(step<=0)return;
  double wanted=buy?MathCeil((open+buffer)/step)*step:MathFloor((open-buffer)/step)*step;
  if((buy&&sl>=wanted&&sl>0)||(!buy&&sl>0&&sl<=wanted)){GlobalVariableSet(stateKey,2);QueueTargetEvent(tag,i,2);return;}
  MqlTick q;if(!SymbolInfoTick(sym,q))return;double distance=MathMax((double)SymbolInfoInteger(sym,SYMBOL_TRADE_STOPS_LEVEL),(double)SymbolInfoInteger(sym,SYMBOL_TRADE_FREEZE_LEVEL))*point;
  if((buy&&q.bid-wanted<=distance)||(!buy&&wanted-q.ask<=distance)){g_lastExecution="TP1 BE awaiting broker stop distance";return;}
  if(trade.PositionModify(ticket,wanted,tp)&&trade.ResultRetcode()==TRADE_RETCODE_DONE){GlobalVariableSet(stateKey,2);QueueTargetEvent(tag,i,2);GlobalVariablesFlush();g_lastExecution="TP"+IntegerToString(i+1)+" BE confirmed";}else g_lastExecution="BE retry / "+trade.ResultRetcodeDescription();return;
 }
 if(action==2){if(trade.PositionClose(ticket)&&trade.ResultRetcode()==TRADE_RETCODE_DONE&&!PositionSelectByTicket(ticket)){GlobalVariableSet(stateKey,2);QueueTargetEvent(tag,i,2);GlobalVariablesFlush();g_lastExecution="TP"+IntegerToString(i+1)+" full close confirmed";}return;}
 // Partial exits reduce to a fixed remaining volume; uncertain submissions never replay blindly.
 double original=GlobalVariableGet(PK(tag,"vol")),pct=GlobalVariableGet(PK(tag,"pct")),sum=0;for(int j=0;j<=i;j++)if((int)GlobalVariableGet(PK(tag,"a"+IntegerToString(j)))==3)sum+=pct;
 double target=RoundVolume(sym,original*MathMax(0,1-sum/100)),step=SymbolInfoDouble(sym,SYMBOL_VOLUME_STEP),minimum=SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN);
 if(volume<=target+step*0.25){GlobalVariableSet(stateKey,2);QueueTargetEvent(tag,i,2);return;}
 if(target<minimum||RoundVolume(sym,volume-target)<minimum){g_lastExecution="Partial blocked: broker minimum volume";return;}
 if(GlobalVariableCheck(stateKey)&&GlobalVariableGet(stateKey)==3){g_lastExecution="Partial submission uncertain: reconcile before retry";return;}
 if(AccountInfoInteger(ACCOUNT_MARGIN_MODE)!=ACCOUNT_MARGIN_MODE_RETAIL_HEDGING){g_lastExecution="Partial exits require a hedging account";return;}
 GlobalVariableSet(stateKey,3);QueueTargetEvent(tag,i,3);GlobalVariablesFlush();bool ok=trade.PositionClosePartial(ticket,RoundVolume(sym,volume-target));long rc=(long)trade.ResultRetcode();
 if(ok&&(rc==TRADE_RETCODE_DONE||rc==TRADE_RETCODE_DONE_PARTIAL)){if(PositionSelectByTicket(ticket)&&PositionGetDouble(POSITION_VOLUME)<=target+step*0.25){GlobalVariableSet(stateKey,2);QueueTargetEvent(tag,i,2);}else {GlobalVariableSet(stateKey,1);QueueTargetEvent(tag,i,1);}}
 else if(rc==TRADE_RETCODE_REJECT||rc==TRADE_RETCODE_INVALID_VOLUME||rc==TRADE_RETCODE_MARKET_CLOSED||rc==TRADE_RETCODE_TRADE_DISABLED||rc==TRADE_RETCODE_PRICE_CHANGED||rc==TRADE_RETCODE_REQUOTE){GlobalVariableSet(stateKey,1);QueueTargetEvent(tag,i,1);}GlobalVariablesFlush();
}
void ProcessPositionTargets(){
 if(g_riskHit||GetTickCount64()-g_policyTick<100)return;g_policyTick=GetTickCount64();
 for(int n=PositionsTotal()-1;n>=0;n--){ulong ticket=PositionGetTicket(n);if(ticket==0||!PositionSelectByTicket(ticket)||(long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)continue;string comment=PositionGetString(POSITION_COMMENT);if(StringFind(comment,"SB:")!=0)continue;string tag=StringSubstr(comment,3,12);if(!GlobalVariableCheck(PK(tag,"vol")))continue;
  bool buy=(ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY;MqlTick q;if(!SymbolInfoTick(PositionGetString(POSITION_SYMBOL),q))continue;double price=buy?q.bid:q.ask;bool hit[3];for(int i=0;i<3;i++){double level=GlobalVariableGet(PK(tag,"t"+IntegerToString(i)));hit[i]=level>0&&(buy?price>=level:price<=level);if(hit[i])PolicyHit(tag,i);}
  bool closing=false;for(int i=2;i>=0;i--)if(hit[i]&&(int)GlobalVariableGet(PK(tag,"a"+IntegerToString(i)))==2){ApplyPositionTarget(tag,ticket,i);closing=true;break;}if(closing)continue;
  for(int i=0;i<3;i++)if(hit[i])ApplyPositionTarget(tag,ticket,i);
 }
}
bool HasPositionIdentifier(long pid){for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t>0&&PositionSelectByTicket(t)&&PositionGetInteger(POSITION_IDENTIFIER)==pid)return true;}return false;}
ulong g_targetRecoveryTick=0;
void RecoverClosedTargets(){
 if(g_targetRecoveryTick>0&&GetTickCount64()-g_targetRecoveryTick<60000)return;g_targetRecoveryTick=GetTickCount64();int checked=0;
 for(int n=GlobalVariablesTotal()-1;n>=0&&checked<100;n--){string k=GlobalVariableName(n);if(StringFind(k,g_riskPrefix)!=0)continue;string tail=StringSubstr(k,StringLen(g_riskPrefix));if(StringLen(tail)!=15||StringSubstr(tail,12)!="vol")continue;string tag=StringSubstr(tail,0,12);if(GlobalVariableCheck(PK(tag,"rec")))continue;
  if(GlobalVariableCheck(GVTicket(tag))&&PositionSelectByTicket((ulong)GlobalVariableGet(GVTicket(tag))))continue;if(!GlobalVariableCheck(GVPosId(tag)))continue;long pid=(long)GlobalVariableGet(GVPosId(tag));if(pid<=0||HasPositionIdentifier(pid)||!HistorySelectByPosition(pid))continue;checked++;bool exited=false;
  for(int d=0;d<HistoryDealsTotal();d++){ulong deal=HistoryDealGetTicket(d);long entry=HistoryDealGetInteger(deal,DEAL_ENTRY);if(entry!=DEAL_ENTRY_OUT&&entry!=DEAL_ENTRY_OUT_BY&&entry!=DEAL_ENTRY_INOUT)continue;exited=true;if(HistoryDealGetInteger(deal,DEAL_REASON)!=DEAL_REASON_TP)continue;long when=HistoryDealGetInteger(deal,DEAL_TIME);int last=-1;for(int i=0;i<3;i++)if((int)GlobalVariableGet(PK(tag,"a"+IntegerToString(i)))==2){last=i;break;}for(int i=0;i<=last;i++){string h=PK(tag,"h"+IntegerToString(i));if(!GlobalVariableCheck(h)){GlobalVariableSet(h,(double)when);QueueTargetEvent(tag,i,1);}if(i==last){GlobalVariableSet(PK(tag,"s"+IntegerToString(i)),2);QueueTargetEvent(tag,i,2);}}}
  if(exited){GlobalVariableSet(PK(tag,"rec"),1);GlobalVariablesFlush();}
 }
}
void RefreshReport(){
 if(g_reportTick>0&&GetTickCount64()-g_reportTick<1000)return;g_reportTick=GetTickCount64();g_reportSince=(long)MathMax(g_reportResetFloor,g_reportViewSince);
 g_reportSignals=0;g_reportTP1=0;g_reportTP2=0;g_reportTP3=0;g_reportStops=0;g_reportProfit=0;g_reportLoss=0;
 for(int i=GlobalVariablesTotal()-1;i>=0;i--){string k=GlobalVariableName(i);if(StringFind(k,g_riskPrefix)!=0)continue;double time=GlobalVariableGet(k);if(time<g_reportSince)continue;string tail=StringSubstr(k,StringLen(g_riskPrefix));if(StringFind(tail,"sigE")==0)g_reportSignals++;if(StringLen(tail)==14){string suffix=StringSubstr(tail,12);if(suffix=="h0")g_reportTP1++;if(suffix=="h1")g_reportTP2++;if(suffix=="h2")g_reportTP3++;}}
 if(!HistorySelect((datetime)g_reportSince,TimeCurrent()))return;
 for(int i=0;i<HistoryDealsTotal();i++){ulong d=HistoryDealGetTicket(i);long type=HistoryDealGetInteger(d,DEAL_TYPE);if(type!=DEAL_TYPE_BUY&&type!=DEAL_TYPE_SELL)continue;double net=HistoryDealGetDouble(d,DEAL_PROFIT)+HistoryDealGetDouble(d,DEAL_SWAP)+HistoryDealGetDouble(d,DEAL_COMMISSION)+HistoryDealGetDouble(d,DEAL_FEE);if(net>=0)g_reportProfit+=net;else g_reportLoss+=net;long reason=HistoryDealGetInteger(d,DEAL_REASON),entry=HistoryDealGetInteger(d,DEAL_ENTRY);if((entry==DEAL_ENTRY_OUT||entry==DEAL_ENTRY_OUT_BY||entry==DEAL_ENTRY_INOUT)&&(reason==DEAL_REASON_SL||GlobalVariableGet(RiskKey("deal"+N64((long)d)))==2))g_reportStops++;}
}
void ResetReport(string id){g_reportTick=0;GlobalVariableSet(RiskKey("rrid"),(double)RiskHash(id));g_reportResetFloor=(long)TimeCurrent()+1;g_reportSince=g_reportResetFloor;g_reportResetId=id;GlobalVariableSet(RiskKey("report_since"),(double)g_reportSince);GlobalVariablesFlush();g_statsTick=0;RefreshReport();SendHeartbeat();}
string ReportSeries(){ArrayInitialize(g_reportBars,0);long start=BrokerDay()-13*86400;if(HistorySelect((datetime)MathMax(start,g_reportResetFloor),TimeCurrent()))for(int i=0;i<HistoryDealsTotal();i++){ulong d=HistoryDealGetTicket(i);long type=HistoryDealGetInteger(d,DEAL_TYPE);if(type!=DEAL_TYPE_BUY&&type!=DEAL_TYPE_SELL)continue;long time=HistoryDealGetInteger(d,DEAL_TIME);int index=(int)((time-start)/86400);if(index>=0&&index<14)g_reportBars[index]+=HistoryDealGetDouble(d,DEAL_PROFIT)+HistoryDealGetDouble(d,DEAL_SWAP)+HistoryDealGetDouble(d,DEAL_COMMISSION)+HistoryDealGetDouble(d,DEAL_FEE);}string out="";for(int i=0;i<14;i++){if(i>0)out+=",";out+=F2(g_reportBars[i]);}return out;}
string ActivePositionTelemetry(){for(int i=0;i<PositionsTotal();i++){ulong ticket=PositionGetTicket(i);if(ticket==0||!PositionSelectByTicket(ticket)||(long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)continue;string note=PositionGetString(POSITION_COMMENT);if(StringFind(note,"SB:")!=0)continue;string tag=StringSubstr(note,3,12),sym=PositionGetString(POSITION_SYMBOL);int digits=(int)SymbolInfoInteger(sym,SYMBOL_DIGITS);MqlTick q;if(!SymbolInfoTick(sym,q))continue;bool buy=(ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY;return Safe(sym)+";"+(buy?"BUY":"SELL")+";"+DoubleToString(PositionGetDouble(POSITION_VOLUME),4)+";"+DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN),digits)+";"+DoubleToString(buy?q.bid:q.ask,digits)+";"+DoubleToString(PositionGetDouble(POSITION_SL),digits)+";"+DoubleToString(PositionGetDouble(POSITION_TP),digits)+";"+tag+";"+F2(PositionGetDouble(POSITION_PROFIT))+";"+N64((long)GlobalVariableGet(PK(tag,"s0")));}return "";}
string ReportTelemetry(){RefreshReport();return "|"+N64(g_reportSignals)+"|"+N64(g_reportTP1)+"|"+N64(g_reportTP2)+"|"+N64(g_reportTP3)+"|"+N64(g_reportStops)+"|"+F2(g_reportProfit)+"|"+F2(g_reportLoss)+"|"+F2(g_reportProfit+g_reportLoss)+"|"+F2(AccountInfoDouble(ACCOUNT_PROFIT))+"|"+N64(g_reportSince)+"|"+g_reportResetId+"|"+ReportSeries()+"|"+ActivePositionTelemetry();}

string TestCapabilities(){
 if(g_testLock==INVALID_HANDLE||!InpEnableConnectionTest||g_testCorrupt)return "risk-v1,test-config-v1";
 if(AccountMode()=="DEMO"&&InpEnableDemoExecution)return "timed-test-v1,timed-test-v2,test-config-v1,risk-v1,exit-policy-v1,reports-v1";
 if(AccountMode()=="LIVE"&&InpEnableLiveConnectionTest)return "live-test-v2,test-config-v1,risk-v1,exit-policy-v1,reports-v1";
 return "risk-v1,test-config-v1";
}
void SendHello(){SendLine("HELLO|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions())+"|"+F2(g_cloudRttMs)+"|"+TestCapabilities()+RiskTelemetry()+ReportTelemetry());g_lastHb=GetTickCount64();}
void SendHeartbeat(){if(SendLine("HB|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions())+"|"+F2(g_cloudRttMs)+"|"+TestCapabilities()+RiskTelemetry()+ReportTelemetry()))g_lastHb=GetTickCount64();FlushTargetEvents();}
void EnsureCloud(){
 if(CloudConnected())return;ulong now=GetTickCount64();int retry=InpReconnectMs;if(retry<250)retry=250;if(retry>10000)retry=10000;if(now-g_lastConnectTry<(ulong)retry)return;g_lastConnectTry=now;DisconnectCloud();
 if(!ValidActivationCode(InpActivationCode)){g_connStage=InpActivationCode==""?"ACTIVATION CODE REQUIRED":"INVALID ACTIVATION CODE";return;}
 g_connStage="CONNECTING TO SIGNALBRIDGE";ResetLastError();g_socket=SocketCreate(SOCKET_DEFAULT);if(g_socket==INVALID_HANDLE){g_connStage="SOCKET CREATE FAILED";PrintFormat("SignalBridge: SocketCreate failed (%d). Check MT5 network permissions.",GetLastError());return;}SocketTimeouts(g_socket,2000,2000);
 ResetLastError();if(!SocketConnect(g_socket,InpCloudHost,(uint)InpCloudPort,3000)){int err=GetLastError();g_connStage="CANNOT CONNECT TO CLOUD";PrintFormat("SignalBridge: cannot connect to %s:%d (MT5 error %d). Allow https://%s in MT5 Tools > Options > Expert Advisors.",InpCloudHost,InpCloudPort,err,InpCloudHost);DisconnectCloud();return;}
 if(!WsHandshake()){Print("SignalBridge: Cloud TLS/WebSocket handshake failed; state: ",g_connStage);DisconnectCloud();return;}SendHello();
}


string ReceiptFile(){return "SignalBridge_receipts_"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+".txt";}
void ReceiptSave(){
 int h=FileOpen(ReceiptFile(),FILE_COMMON|FILE_WRITE|FILE_TXT|FILE_ANSI);if(h==INVALID_HANDLE)return;
 for(int i=0;i<MAX_RECEIPTS;i++)if(g_receiptId[i]!="")FileWriteString(h,Safe(g_receiptId[i])+"|"+Safe(g_receiptStatus[i])+"|"+Safe(g_receiptTicket[i])+"|"+Safe(g_receiptRetcode[i])+"|"+Safe(g_receiptDetail[i])+"\r\n");
 FileFlush(h);FileClose(h);
}
void ReceiptLoad(){
 for(int i=0;i<MAX_RECEIPTS;i++){g_receiptId[i]="";g_receiptStatus[i]="";g_receiptTicket[i]="";g_receiptRetcode[i]="";g_receiptDetail[i]="";}
 int h=FileOpen(ReceiptFile(),FILE_COMMON|FILE_READ|FILE_TXT|FILE_ANSI);if(h==INVALID_HANDLE)return;int slot=0;
 while(!FileIsEnding(h)&&slot<MAX_RECEIPTS){string line=FileReadString(h);StringTrimLeft(line);StringTrimRight(line);if(line=="")continue;string p[];ushort sep=StringGetCharacter("|",0);int n=StringSplit(line,sep,p);if(n<5)continue;g_receiptId[slot]=p[0];g_receiptStatus[slot]=p[1];g_receiptTicket[slot]=p[2];g_receiptRetcode[slot]=p[3];g_receiptDetail[slot]=p[4];slot++;}
 FileClose(h);
}
bool QueueReceipt(string id,string status,string ticket,long retcode,string detail){
 int slot=-1;
 for(int i=0;i<MAX_RECEIPTS;i++){if(g_receiptId[i]==id&&g_receiptStatus[i]==status){slot=i;break;}if(slot<0&&g_receiptId[i]=="")slot=i;}
 if(slot<0){Print("SignalBridge receipt outbox full; preserving existing receipts");return false;}
 g_receiptId[slot]=Safe(id);g_receiptStatus[slot]=Safe(status);g_receiptTicket[slot]=Safe(ticket);g_receiptRetcode[slot]=N64(retcode);g_receiptDetail[slot]=Safe(detail);ReceiptSave();return true;
}
void ClearReceipt(string id,string status){
 bool changed=false;for(int i=0;i<MAX_RECEIPTS;i++)if(g_receiptId[i]==id&&g_receiptStatus[i]==status){g_receiptId[i]="";g_receiptStatus[i]="";g_receiptTicket[i]="";g_receiptRetcode[i]="";g_receiptDetail[i]="";changed=true;}
 if(changed)ReceiptSave();
}
void FlushReceipts(){
 if(!CloudConnected())return;
 for(int i=0;i<MAX_RECEIPTS;i++)if(g_receiptId[i]!="")SendLine("RCPT|"+g_receiptId[i]+"|"+g_receiptStatus[i]+"|"+g_receiptTicket[i]+"|"+g_receiptRetcode[i]+"|"+g_receiptDetail[i]);
}
bool Receipt(string id,string status,string ticket,long retcode,string detail){
 bool queued=QueueReceipt(id,status,ticket,retcode,detail);if(queued&&CloudConnected())FlushReceipts();
 g_activityTick=GetTickCount64();g_lastExecution=status+" · "+detail;if(ticket!="")g_lastTicket=ticket;return queued;
}

string PendingFile(){return "SignalBridge_pending_"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+".txt";}
void PendingSave(){int h=FileOpen(PendingFile(),FILE_COMMON|FILE_WRITE|FILE_TXT|FILE_ANSI);if(h==INVALID_HANDLE)return;for(int i=0;i<MAX_PENDING;i++)if(g_pendingId[i]!=""&&g_pendingTag[i]!="")FileWriteString(h,Safe(g_pendingTag[i])+"|"+Safe(g_pendingId[i])+"\r\n");FileFlush(h);FileClose(h);}
void PendingLoad(){for(int i=0;i<MAX_PENDING;i++){g_pendingTag[i]="";g_pendingId[i]="";}int h=FileOpen(PendingFile(),FILE_COMMON|FILE_READ|FILE_TXT|FILE_ANSI);if(h==INVALID_HANDLE)return;int slot=0;while(!FileIsEnding(h)&&slot<MAX_PENDING){string line=FileReadString(h);StringTrimLeft(line);StringTrimRight(line);if(line=="")continue;int p=StringFind(line,"|");if(p<=0)continue;string tag=StringSubstr(line,0,p),id=StringSubstr(line,p+1);if(StringLen(tag)!=12||id=="")continue;g_pendingTag[slot]=tag;g_pendingId[slot]=id;slot++;}FileClose(h);}
bool RegisterPending(string tag,string id){for(int i=0;i<MAX_PENDING;i++){if(g_pendingTag[i]==tag){g_pendingId[i]=id;PendingSave();return true;}}for(int i=0;i<MAX_PENDING;i++){if(g_pendingId[i]==""){g_pendingTag[i]=tag;g_pendingId[i]=id;PendingSave();return true;}}return false;}
string ResolvePending(string tag){for(int i=0;i<MAX_PENDING;i++)if(g_pendingTag[i]==tag)return g_pendingId[i];return "";}
void ClearPending(string tag){bool changed=false;for(int i=0;i<MAX_PENDING;i++)if(g_pendingTag[i]==tag){g_pendingTag[i]="";g_pendingId[i]="";changed=true;}if(changed)PendingSave();}
void ClearPendingById(string id){bool changed=false;for(int i=0;i<MAX_PENDING;i++)if(g_pendingId[i]==id){g_pendingTag[i]="";g_pendingId[i]="";changed=true;}if(changed)PendingSave();}
bool FinalReceiptAckClearsPending(string status){return status=="FILLED"||status=="BROKER_REJECTED"||status=="DUPLICATE";}
bool HasPending(){for(int i=0;i<MAX_PENDING;i++)if(g_pendingId[i]!="")return true;return false;}

string ResolveSymbol(string requested){if((requested=="XAUUSD"||requested==InpGoldSymbol)&&InpGoldSymbol!=""){if(SymbolSelect(InpGoldSymbol,true))return InpGoldSymbol;return "";}string s=InpSymbolPrefix+requested+InpSymbolSuffix;if(SymbolSelect(s,true))return s;if(SymbolSelect(requested,true))return requested;return "";}
// Resolve the gold test independently. Never guess between multiple contracts.
string ResolveTestSymbol(string &reason){
 if(InpTestSymbol!=""){
  string mapped=ResolveSymbol(InpTestSymbol);if(mapped!="")return mapped;
  if(InpTestSymbol!="XAUUSD"){reason="TEST_SYMBOL_NOT_FOUND: configured "+InpTestSymbol;return "";}
 }
 string exact=ResolveSymbol("XAUUSD");if(exact!="")return exact;
 if(InpGoldSymbol!=""){reason="TEST_SYMBOL_NOT_FOUND: InpGoldSymbol="+InpGoldSymbol;return "";}
 string candidate="";int matches=0;
 for(int i=0;i<SymbolsTotal(false);i++){
  string name=SymbolName(i,false);
  if(SymbolInfoString(name,SYMBOL_CURRENCY_BASE)!="XAU"||SymbolInfoString(name,SYMBOL_CURRENCY_PROFIT)!="USD")continue;
  if(SymbolInfoInteger(name,SYMBOL_TRADE_MODE)!=SYMBOL_TRADE_MODE_FULL&&SymbolInfoInteger(name,SYMBOL_TRADE_MODE)!=SYMBOL_TRADE_MODE_LONGONLY)continue;
  candidate=name;matches++;
 }
 if(matches==1&&SymbolSelect(candidate,true))return candidate;
 reason=matches>1?"TEST_SYMBOL_AMBIGUOUS: set InpTestSymbol to the exact broker gold symbol":"TEST_SYMBOL_NOT_FOUND: set InpTestSymbol to your broker gold symbol";
 return "";
}

double NormalizeVolume(string sym,double v){double step=SymbolInfoDouble(sym,SYMBOL_VOLUME_STEP),mn=SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN),mx=SymbolInfoDouble(sym,SYMBOL_VOLUME_MAX);if(step<=0||mn<=0||mx<=0)return 0;double cap=(InpMaxLot>0?MathMin(mx,InpMaxLot):mx),lots=MathFloor(v/step+1e-9)*step;if(lots<mn-1e-9||lots>cap+1e-9)return 0;int digits=(int)MathMax(0,MathCeil(-MathLog10(step)));return NormalizeDouble(lots,digits);}
double RoundVolume(string sym,double v){double step=SymbolInfoDouble(sym,SYMBOL_VOLUME_STEP);if(step<=0)return 0;int digits=(int)MathMax(0,MathCeil(-MathLog10(step)));return NormalizeDouble(MathFloor(v/step+0.5+1e-9)*step,digits);}
double LotsForRisk(string sym,bool buy,double sl,double riskPct){if(riskPct<=0)return 0;if(riskPct>InpMaxRiskPercent)riskPct=InpMaxRiskPercent;MqlTick tick;if(!SymbolInfoTick(sym,tick))return 0;double entry=buy?tick.ask:tick.bid,dist=MathAbs(entry-sl),tickSize=SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_SIZE),tickValue=SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_VALUE_LOSS);if(tickValue<=0)tickValue=SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_VALUE);if(dist<=0||tickSize<=0||tickValue<=0)return 0;double riskMoney=AccountInfoDouble(ACCOUNT_BALANCE)*riskPct/100.0,lossPerLot=(dist/tickSize)*tickValue;if(riskMoney<=0||lossPerLot<=0)return 0;return NormalizeVolume(sym,riskMoney/lossPerLot);}
bool StopsValid(string sym,bool buy,double sl,double tp){MqlTick tick;if(!SymbolInfoTick(sym,tick))return false;double price=buy?tick.ask:tick.bid,point=SymbolInfoDouble(sym,SYMBOL_POINT);int stops=(int)SymbolInfoInteger(sym,SYMBOL_TRADE_STOPS_LEVEL);double minDist=stops*point;if(buy){if(sl>=price||tp<=price)return false;if(price-sl<minDist||tp-price<minDist)return false;}else{if(sl<=price||tp>=price)return false;if(sl-price<minDist||price-tp<minDist)return false;}if(point>0&&InpMaxSpreadPoints>0&&(tick.ask-tick.bid)/point>InpMaxSpreadPoints)return false;return true;}

void RememberPositionIdentity(string tag,ulong ticket){
 if(ticket==0||!PositionSelectByTicket(ticket))return;
 if((long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)return;
 GlobalVariableSet(GVTicket(tag),(double)ticket);
 long pid=PositionGetInteger(POSITION_IDENTIFIER);if(pid>0)GlobalVariableSet(GVPosId(tag),(double)pid);
 FlushTradeIdentity();
}
void RememberPositionFromDeal(string tag,ulong deal){
 if(deal==0)return;
 for(int attempt=0;attempt<5;attempt++){
  HistorySelect(TimeCurrent()-300,TimeCurrent()+60);
  if(HistoryDealSelect(deal)){
   long pid=HistoryDealGetInteger(deal,DEAL_POSITION_ID);
   if(pid>0){GlobalVariableSet(GVPosId(tag),(double)pid);FlushTradeIdentity();for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t==0||!PositionSelectByTicket(t))continue;if(PositionGetInteger(POSITION_IDENTIFIER)==pid&&(long)PositionGetInteger(POSITION_MAGIC)==InpMagic){RememberPositionIdentity(tag,t);break;}}}
   return;
  }
  if(attempt<4)Sleep(40);
 }
}
bool FillPositionSnapshot(ulong t,ulong &ticket,string &sym,double &volume,double &open,double &sl,double &tp){
 if(t==0||!PositionSelectByTicket(t))return false;
 if((long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)return false;
 ticket=t;sym=PositionGetString(POSITION_SYMBOL);volume=PositionGetDouble(POSITION_VOLUME);open=PositionGetDouble(POSITION_PRICE_OPEN);sl=PositionGetDouble(POSITION_SL);tp=PositionGetDouble(POSITION_TP);return true;
}
bool FindPosition(string tag,ulong &ticket,string &sym,double &volume,double &open,double &sl,double &tp){
 if(GlobalVariableCheck(GVPosId(tag))){
  long wanted=(long)GlobalVariableGet(GVPosId(tag));
  if(wanted>0)for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t==0||!PositionSelectByTicket(t))continue;if((long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)continue;if(PositionGetInteger(POSITION_IDENTIFIER)!=wanted)continue;if(FillPositionSnapshot(t,ticket,sym,volume,open,sl,tp)){RememberPositionIdentity(tag,t);return true;}}
 }
 if(GlobalVariableCheck(GVTicket(tag))){
  ulong saved=(ulong)GlobalVariableGet(GVTicket(tag));
  if(FillPositionSnapshot(saved,ticket,sym,volume,open,sl,tp)){RememberPositionIdentity(tag,saved);return true;}
 }
 string want="SB:"+tag;
 for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t==0||!PositionSelectByTicket(t))continue;if((long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)continue;if(StringFind(PositionGetString(POSITION_COMMENT),want)<0)continue;if(FillPositionSnapshot(t,ticket,sym,volume,open,sl,tp)){RememberPositionIdentity(tag,t);return true;}}
 if(HistorySelect(TimeCurrent()-30*86400,TimeCurrent()+60)){
  for(int i=HistoryDealsTotal()-1;i>=0;i--){ulong d=HistoryDealGetTicket(i);if(d==0)continue;if((long)HistoryDealGetInteger(d,DEAL_MAGIC)!=InpMagic)continue;if(StringFind(HistoryDealGetString(d,DEAL_COMMENT),want)<0)continue;long pid=HistoryDealGetInteger(d,DEAL_POSITION_ID);if(pid<=0)continue;for(int j=0;j<PositionsTotal();j++){ulong t=PositionGetTicket(j);if(t==0||!PositionSelectByTicket(t))continue;if((long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)continue;if(PositionGetInteger(POSITION_IDENTIFIER)!=pid)continue;GlobalVariableSet(GVPosId(tag),(double)pid);FlushTradeIdentity();if(FillPositionSnapshot(t,ticket,sym,volume,open,sl,tp)){RememberPositionIdentity(tag,t);return true;}}}
 }
 return false;
}
bool HasAnyPositionOnSymbol(string sym){
 for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t==0||!PositionSelectByTicket(t))continue;if(PositionGetString(POSITION_SYMBOL)==sym)return true;}
 return false;
}
bool HistoryHasTag(string tag,ulong &dealOut){string want="SB:"+tag;if(!HistorySelect(TimeCurrent()-7*86400,TimeCurrent()+60))return false;for(int i=HistoryDealsTotal()-1;i>=0;i--){ulong d=HistoryDealGetTicket(i);if(d==0)continue;if((long)HistoryDealGetInteger(d,DEAL_MAGIC)!=InpMagic)continue;if(StringFind(HistoryDealGetString(d,DEAL_COMMENT),want)>=0){dealOut=d;return true;}}return false;}
void ReconcilePending(){if(!CloudConnected()||!HasPending())return;for(int i=0;i<MAX_PENDING;i++){string tag=g_pendingTag[i],id=g_pendingId[i];if(tag==""||id=="")continue;ulong ticket=0;string sym="";double volume=0,open=0,sl=0,tp=0;if(FindPosition(tag,ticket,sym,volume,open,sl,tp)){Receipt(id,"FILLED",N64((long)ticket),0,"reconciled open position after terminal restart");continue;}ulong deal=0;if(HistoryHasTag(tag,deal))Receipt(id,"FILLED",N64((long)deal),0,"reconciled broker history after terminal restart");}}
bool DemoGate(string id){if(AccountInfoInteger(ACCOUNT_TRADE_MODE)!=ACCOUNT_TRADE_MODE_DEMO){Receipt(id,"ACCOUNT_MISMATCH","",0,"DEMO execution refused on non-demo account");return false;}if(!InpEnableDemoExecution){Receipt(id,"REJECTED","",0,"enable InpEnableDemoExecution first");return false;}if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)||!MQLInfoInteger(MQL_TRADE_ALLOWED)){Receipt(id,"REJECTED","",0,"Algo Trading disabled");return false;}return true;}

void HandleOpen(string id,string mode,string side,string requested,string tag,string volumeMode,double volumeValue,double referencePrice,double sl,double tp1,double tp2,double tp3,long expiresMs){
 if(expiresMs>0&&(long)TimeGMT()*1000>expiresMs){Receipt(id,"EXPIRED","",0,"command expired");return;}
 if(side!="BUY"&&side!="SELL"){Receipt(id,"REJECTED","",0,"invalid side");return;}
 ulong existing=0;string ps="";double pv=0,po=0,psl=0,ptp=0;if(FindPosition(tag,existing,ps,pv,po,psl,ptp)){Receipt(id,"DUPLICATE",N64((long)existing),0,"position already exists");return;}ulong oldDeal=0;if(HistoryHasTag(tag,oldDeal)){Receipt(id,"DUPLICATE",N64((long)oldDeal),0,"broker history already contains this signal");return;}string unresolved=ResolvePending(tag);if(unresolved!=""){Receipt(id,"ERROR","",0,"unresolved prior broker submission; automatic replay blocked");return;}
 string sym=ResolveSymbol(requested);if(sym==""){Receipt(id,"REJECTED","",0,"symbol not found");return;}bool buy=(side=="BUY");MqlTick tick;if(!SymbolInfoTick(sym,tick)){Receipt(id,"REJECTED","",0,"no broker quote");return;}double current=buy?tick.ask:tick.bid;double targetLevels[3];targetLevels[0]=tp1;targetLevels[1]=tp2;targetLevels[2]=tp3;double previous=current;for(int targetIndex=0;targetIndex<3;targetIndex++){double target=targetLevels[targetIndex];if(target<=0)continue;if(buy?target<=previous:target>=previous){Receipt(id,"REJECTED","",0,"target order invalid or target crossed before entry");return;}previous=target;}if(referencePrice>0&&MathAbs(current-referencePrice)/referencePrice*100.0>InpMaxPriceDeviationPct){Receipt(id,"REJECTED","",0,"price deviation too large");return;}
 long marginMode=AccountInfoInteger(ACCOUNT_MARGIN_MODE);
 if((marginMode==ACCOUNT_MARGIN_MODE_RETAIL_NETTING||marginMode==ACCOUNT_MARGIN_MODE_EXCHANGE)&&HasAnyPositionOnSymbol(sym)){Receipt(id,"REJECTED","",0,"netting account already has a position on this symbol; merge risk blocked");return;}
 double lots=(volumeMode=="RISK_PERCENT")?LotsForRisk(sym,buy,sl,volumeValue):NormalizeVolume(sym,volumeValue);if(lots<=0){Receipt(id,"REJECTED","",0,"position size invalid or below broker minimum");return;}double finalTp=PolicyClosePrice(tp1,tp2,tp3);if(finalTp<=0){Receipt(id,"REJECTED","",0,"configured full-close target is missing");return;}if(!StopsValid(sym,buy,sl,finalTp)){Receipt(id,"REJECTED","",0,"SL/TP/spread validation failed");return;}
 if(mode=="dry_run"){Receipt(id,"PREVIEWED","",0,"preview accepted by MT5");return;}if(mode!="demo_execute"){Receipt(id,"REJECTED","",0,"unknown execution mode");return;}if(!DemoGate(id))return;if(CountMyPositions()>=InpMaxOpenTrades){Receipt(id,"REJECTED","",0,"max open trades reached");return;}
 SavePositionPolicy(tag,tp1,tp2,tp3,lots);if(!RegisterPending(tag,id)){Receipt(id,"ERROR","",0,"persistent pending-command ledger is full");return;}trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.SetTypeFillingBySymbol(sym);bool ok=buy?trade.Buy(lots,sym,0.0,sl,finalTp,"SB:"+tag):trade.Sell(lots,sym,0.0,sl,finalTp,"SB:"+tag);long rc=(long)trade.ResultRetcode();if(!ok){Receipt(id,"BROKER_REJECTED","",rc,trade.ResultRetcodeDescription());return;}GlobalVariableSet(GVVol(tag),lots);FlushTradeIdentity();
 RememberPositionFromDeal(tag,trade.ResultDeal());
 ulong openedTicket=0;string openedSym="";double openedVol=0,openedPrice=0,openedSl=0,openedTp=0;if(FindPosition(tag,openedTicket,openedSym,openedVol,openedPrice,openedSl,openedTp))RememberPositionIdentity(tag,openedTicket);
 Receipt(id,"SUBMITTED",N64((long)trade.ResultOrder()),rc,trade.ResultRetcodeDescription());
}

void HandleManage(string id,string mode,string event,string tag){
 ulong ticket=0;string sym="";double current=0,open=0,sl=0,tp=0;if(!FindPosition(tag,ticket,sym,current,open,sl,tp)){ulong d=0;if(HistoryHasTag(tag,d)){Receipt(id,"DUPLICATE",N64((long)d),0,"position already closed or action already completed");return;}Receipt(id,"REJECTED","",0,"matching SignalBridge position not found");return;}
 if(mode=="dry_run"){Receipt(id,"PREVIEWED",N64((long)ticket),0,"management preview "+event);return;}if(mode!="demo_execute"){Receipt(id,"REJECTED","",0,"unknown execution mode");return;}if(!DemoGate(id))return;
 if((event=="TP1"||event=="TP2"||event=="TP3")&&GlobalVariableCheck(PK(tag,"vol"))){int index=(int)StringToInteger(StringSubstr(event,2))-1;MqlTick q;if(!SymbolInfoTick(sym,q)){Receipt(id,"REJECTED","",0,"no target quote");return;}bool buy=(ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY;double level=GlobalVariableGet(PK(tag,"t"+IntegerToString(index)));if(level<=0||(buy?q.bid<level:q.ask>level)){Receipt(id,"REJECTED","",0,"target price not reached");return;}ApplyPositionTarget(tag,ticket,index);bool done=GlobalVariableCheck(PK(tag,"s"+IntegerToString(index)))&&GlobalVariableGet(PK(tag,"s"+IntegerToString(index)))==2;Receipt(id,done?"FILLED":"REJECTED",N64((long)ticket),0,done?"saved target policy confirmed":"target action not confirmed; local engine will retry");return;}
 trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.SetTypeFillingBySymbol(sym);
 if(event=="TP3"||event=="SL"||event=="CLOSE"){
  bool ok=trade.PositionClose(ticket);long rc=(long)trade.ResultRetcode();if(!ok){Receipt(id,"BROKER_REJECTED",N64((long)ticket),rc,trade.ResultRetcodeDescription());return;}if(rc==TRADE_RETCODE_DONE||rc==TRADE_RETCODE_DONE_PARTIAL)RecordManagedExit(event);Receipt(id,(rc==TRADE_RETCODE_DONE||rc==TRADE_RETCODE_DONE_PARTIAL)?"FILLED":"SUBMITTED",N64((long)trade.ResultDeal()),rc,event+" close "+trade.ResultRetcodeDescription());return;
 }
 if(event!="TP1"&&event!="TP2"){Receipt(id,"REJECTED",N64((long)ticket),0,"unsupported management event");return;}
 long marginMode=AccountInfoInteger(ACCOUNT_MARGIN_MODE);
 double original=GlobalVariableCheck(GVVol(tag))?GlobalVariableGet(GVVol(tag)):current;double fraction=(event=="TP1"?0.66:0.33);double target=RoundVolume(sym,original*fraction);double minLot=SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN),step=SymbolInfoDouble(sym,SYMBOL_VOLUME_STEP);
 if(target<minLot-1e-9){Receipt(id,"REJECTED",N64((long)ticket),0,"position too small for safe partial close");return;}
 if(current<=target+step*0.25){Receipt(id,"DUPLICATE",N64((long)ticket),0,event+" already applied");return;}
 double toClose=RoundVolume(sym,current-target);if(toClose<minLot-1e-9){Receipt(id,"DUPLICATE",N64((long)ticket),0,"remaining partial below broker minimum");return;}
 bool ok=false;
 if(marginMode==ACCOUNT_MARGIN_MODE_RETAIL_HEDGING)ok=trade.PositionClosePartial(ticket,toClose);
 else if(marginMode==ACCOUNT_MARGIN_MODE_RETAIL_NETTING){
  if(!PositionSelectByTicket(ticket)){Receipt(id,"ERROR",N64((long)ticket),0,"netting position disappeared before reduction");return;}
  ENUM_POSITION_TYPE ptype=(ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
  string note="SBM:"+tag+":"+event;
  ok=(ptype==POSITION_TYPE_BUY)?trade.Sell(toClose,sym,0.0,0.0,0.0,note):trade.Buy(toClose,sym,0.0,0.0,0.0,note);
 }else{Receipt(id,"REJECTED",N64((long)ticket),0,"unsupported account margin mode");return;}
 long rc=(long)trade.ResultRetcode();if(!ok){Receipt(id,"BROKER_REJECTED",N64((long)ticket),rc,trade.ResultRetcodeDescription());return;}if(rc==TRADE_RETCODE_DONE||rc==TRADE_RETCODE_DONE_PARTIAL)RecordManagedExit(event);string detail=event+" partial "+trade.ResultRetcodeDescription();
 ulong afterTicket=0;string afterSym="";double afterVol=0,afterOpen=0,afterSl=0,afterTp=0;
 if(FindPosition(tag,afterTicket,afterSym,afterVol,afterOpen,afterSl,afterTp)){
  RememberPositionIdentity(tag,afterTicket);
  if(event=="TP2"){double curTp=afterTp;if(!trade.PositionModify(afterTicket,afterOpen,curTp))detail+="; break-even move failed";}
 }
 Receipt(id,(rc==TRADE_RETCODE_DONE||rc==TRADE_RETCODE_DONE_PARTIAL)?"FILLED":"SUBMITTED",N64((long)trade.ResultDeal()),rc,detail);
}

// UTC from the authenticated server, advanced with a monotonic timer.
long LicenseNowMs(){return g_serverMs+(long)(GetTickCount64()-g_licenseVerifiedTick);}
bool LicenseReady(){return g_licenseActive&&g_licenseExpiryMs>LicenseNowMs()&&GetTickCount64()-g_licenseVerifiedTick<90000;}
string LicenseRemaining(){
 if(!g_licenseActive)return "UNVERIFIED";
 long sec=(g_licenseExpiryMs-LicenseNowMs())/1000;if(sec<=0)return "EXPIRED";
 return N64(sec/86400)+"d "+N64((sec%86400)/3600)+"h "+N64((sec%3600)/60)+"m";
}
string TimedTestFile(){
 uint h=2166136261;string server=AccountInfoString(ACCOUNT_SERVER);
 for(int i=0;i<StringLen(server);i++)h=(h^(uint)StringGetCharacter(server,i))*16777619;
 return "SignalBridge_test_"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"_"+N64((long)h)+"_"+N64(InpMagic)+".txt";
}
bool SaveTimedTest(){
 int h=FileOpen(TimedTestFile(),FILE_COMMON|FILE_WRITE|FILE_TXT|FILE_ANSI);
 if(h==INVALID_HANDLE)return false;
 uint written=FileWriteString(h,g_testId+"|"+g_testTag+"|"+N64(g_testDue)+"|"+g_testPhase+"|"+Safe(g_testDetail)+"|"+g_testAccountMode+"|"+g_testLogin+"|"+Safe(g_testServer)+"\r\n");
 FileFlush(h);FileClose(h);return written>0;
}
void LoadTimedTest(){
 if(!FileIsExist(TimedTestFile(),FILE_COMMON))return;
 int h=FileOpen(TimedTestFile(),FILE_COMMON|FILE_READ|FILE_TXT|FILE_ANSI);
 if(h==INVALID_HANDLE){g_testCorrupt=true;return;}
 string line=FileReadString(h);FileClose(h);string p[];int n=StringSplit(line,StringGetCharacter("|",0),p);
 if(n<5||p[0]==""||StringLen(p[1])!=12||StringToInteger(p[2])<=0){g_testCorrupt=true;return;}
 if(p[3]!="ARMED"&&p[3]!="OPEN"&&p[3]!="CLOSED"&&p[3]!="REJECTED"&&p[3]!="CLOSE_FAILED"){g_testCorrupt=true;return;}
 g_testId=p[0];g_testTag=p[1];g_testDue=StringToInteger(p[2]);g_testPhase=p[3];g_testDetail=p[4];
 g_testAccountMode=n>=8?p[5]:"DEMO";g_testLogin=n>=8?p[6]:N64(AccountInfoInteger(ACCOUNT_LOGIN));g_testServer=n>=8?p[7]:AccountInfoString(ACCOUNT_SERVER);
 // Restart recovery closes immediately; do not trust a changed wall clock.
 if(TimedTestActive())g_testDeadlineTick=GetTickCount64();
}
bool TimedTestActive(){return g_testId!=""&&(g_testPhase=="ARMED"||g_testPhase=="OPEN"||g_testPhase=="CLOSE_FAILED");}
void TestPhase(string phase,string detail){g_testPhase=phase;g_testDetail=detail;if(!SaveTimedTest()){g_testCorrupt=true;g_lastExecution="TEST JOURNAL WRITE FAILED";}}
void SendTestStatus(){
 if(g_testId==""||!CloudConnected())return;
 SendLine("TEST_STATUS|"+g_testId+"|"+g_testPhase+"||"+Safe(g_testDetail));
}
void CloseTimedTest(){
 if(!TimedTestActive())return;
 if(g_testDeadlineTick>0){if(GetTickCount64()<g_testDeadlineTick)return;}
 else if((long)TimeGMT()<g_testDue)return;
 if(GetTickCount64()-g_testRetryTick<1000)return;g_testRetryTick=GetTickCount64();
 // Never close by symbol; recover the exact correlation-tagged position.
 if(AccountMode()!=g_testAccountMode||N64(AccountInfoInteger(ACCOUNT_LOGIN))!=g_testLogin||AccountInfoString(ACCOUNT_SERVER)!=g_testServer){TestPhase("CLOSE_FAILED","test account identity mismatch during recovery");return;}
 ulong ticket=0;string sym="";double vol=0,open=0,sl=0,tp=0;
 if(!FindPosition(g_testTag,ticket,sym,vol,open,sl,tp)){
  ulong deal=0;
  if(HistoryHasTag(g_testTag,deal)){
   long pid=HistoryDealGetInteger(deal,DEAL_POSITION_ID);bool stillOpen=false;
   for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t>0&&PositionSelectByTicket(t)&&PositionGetInteger(POSITION_IDENTIFIER)==pid)stillOpen=true;}
   // Require broker exit evidence, not merely an empty local position list.
   bool exited=false;
   if(!stillOpen&&pid>0&&HistorySelectByPosition((ulong)pid))for(int i=0;i<HistoryDealsTotal();i++){
    ulong d=HistoryDealGetTicket(i);if(d>0&&(HistoryDealGetInteger(d,DEAL_ENTRY)==DEAL_ENTRY_OUT||HistoryDealGetInteger(d,DEAL_ENTRY)==DEAL_ENTRY_OUT_BY))exited=true;
   }
   if(exited){TestPhase("CLOSED","broker history confirms test exit");return;}
  }
  g_lastExecution="TEST RECOVERY: awaiting broker evidence";return;
 }
 trade.SetExpertMagicNumber(InpMagic);trade.SetTypeFillingBySymbol(sym);trade.SetDeviationInPoints(InpSlippagePoints);
 bool ok=trade.PositionClose(ticket);long rc=(long)trade.ResultRetcode();
 if(ok&&rc==TRADE_RETCODE_DONE&&!PositionSelectByTicket(ticket))TestPhase("CLOSED","test position closed by local timer");
 else {TestPhase("CLOSE_FAILED","close retry: "+trade.ResultRetcodeDescription());g_lastExecution="TEST CLOSE RETRY REQUIRED";}
}
void HandleTimedTest(string id,string mode,string side,string requested,string tag,double lots,long expiresMs,string expectedMode,string expectedLogin,string expectedServer){
 if(g_testId==id){SendTestStatus();return;}
 if(g_testLock==INVALID_HANDLE||g_testCorrupt||g_testId!=""){Receipt(id,"REJECTED","",0,"previous test awaiting durable completion");return;}
 if(!InpEnableConnectionTest||(mode!="demo_execute"&&mode!="test_execute")||side!="BUY"||requested!=TestSymbol()||MathAbs(lots-InpDefaultLots)>0.0000001||expiresMs<=LicenseNowMs()){Receipt(id,"REJECTED","",0,"invalid or disabled timed test");return;}
 bool live=AccountMode()=="LIVE";
 if(mode=="demo_execute"&&AccountMode()!="DEMO"){Receipt(id,"REJECTED","",0,"legacy test transport is DEMO-only");return;}
 if(mode=="test_execute"&&(expectedMode!=AccountMode()||expectedLogin!=N64(AccountInfoInteger(ACCOUNT_LOGIN))||expectedServer!=AccountInfoString(ACCOUNT_SERVER))){Receipt(id,"ACCOUNT_MISMATCH","",0,"confirmed test account changed");return;}
 if(live){if(!InpEnableLiveConnectionTest||mode!="test_execute"){Receipt(id,"REJECTED","",0,"enable explicit LIVE connection test opt-in");return;}}
 else if(!DemoGate(id))return;
 if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)||!MQLInfoInteger(MQL_TRADE_ALLOWED)){Receipt(id,"REJECTED","",0,"Algo Trading disabled");return;}
 string reason="",sym=ResolveTestSymbol(reason);MqlTick tick;
 if(sym==""){Receipt(id,"REJECTED","",0,reason);return;}
 if(HasAnyPositionOnSymbol(sym)){Receipt(id,"REJECTED","",0,"TEST_SYMBOL_HAS_POSITION: "+sym+" already has an open position; no position was changed");return;}
 if(CountMyPositions()>=InpMaxOpenTrades){Receipt(id,"REJECTED","",0,"TEST_POSITION_LIMIT: bridge position limit reached");return;}
 if(!SymbolInfoTick(sym,tick)||tick.ask<=0||tick.bid<=0){Receipt(id,"REJECTED","",0,"TEST_NO_QUOTE: "+sym+" has no usable broker bid/ask");return;}
 if(!AccountInfoInteger(ACCOUNT_TRADE_ALLOWED)||!AccountInfoInteger(ACCOUNT_TRADE_EXPERT)){Receipt(id,"REJECTED","",0,"TEST_ACCOUNT_TRADE_DISABLED: broker/account disallows expert trading");return;}
 if(MathAbs(NormalizeVolume(sym,InpDefaultLots)-InpDefaultLots)>0.0000001){Receipt(id,"REJECTED","",0,"broker cannot trade configured test lots");return;}
 double point=SymbolInfoDouble(sym,SYMBOL_POINT);
 if(point<=0||InpMaxSpreadPoints<=0||(tick.ask-tick.bid)/point>InpMaxSpreadPoints){Receipt(id,"REJECTED","",0,"test spread limit");return;}
 double emergencyStop=0;double step=SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_SIZE);
 if(InpTestEmergencySLPoints<=0||step<=0){Receipt(id,"REJECTED","",0,"test emergency stop required");return;}
 double distance=MathMax((double)InpTestEmergencySLPoints,(double)SymbolInfoInteger(sym,SYMBOL_TRADE_STOPS_LEVEL)+InpMaxSpreadPoints+10)*point;
 emergencyStop=MathFloor((tick.bid-distance)/step)*step;
 if(emergencyStop<=0){Receipt(id,"REJECTED","",0,"invalid test emergency stop");return;}
 // Write the exit intent BEFORE submitting. A restart must never resubmit it.
 g_testAccountMode=AccountMode();g_testLogin=N64(AccountInfoInteger(ACCOUNT_LOGIN));g_testServer=AccountInfoString(ACCOUNT_SERVER);g_testId=id;g_testTag=tag;g_testDue=(long)TimeGMT()+5;g_testDeadlineTick=GetTickCount64()+5000;g_testPhase="ARMED";g_testDetail="test submitted; exit intent saved";
 if(!SaveTimedTest()){g_testCorrupt=true;Receipt(id,"REJECTED","",0,"cannot persist test exit intent");return;}
 trade.SetExpertMagicNumber(InpMagic);trade.SetTypeFillingBySymbol(sym);trade.SetDeviationInPoints(InpSlippagePoints);
 bool ok=trade.Buy(InpDefaultLots,sym,0,emergencyStop,0,"SB:"+tag);long rc=(long)trade.ResultRetcode();
 if(ok&&(rc==TRADE_RETCODE_DONE||rc==TRADE_RETCODE_DONE_PARTIAL)){
  RememberPositionFromDeal(tag,trade.ResultDeal());g_testDue=(long)TimeGMT()+5;g_testDeadlineTick=GetTickCount64()+5000;
  TestPhase("OPEN","BUY "+sym+" "+DoubleToString(InpDefaultLots,4)+"; local exit armed");Receipt(id,"FILLED",N64((long)trade.ResultOrder()),rc,"test open; closure is tracked separately");
 }else if(rc==TRADE_RETCODE_REJECT||rc==TRADE_RETCODE_INVALID_VOLUME||rc==TRADE_RETCODE_INVALID_STOPS||rc==TRADE_RETCODE_INVALID_PRICE||rc==TRADE_RETCODE_NO_MONEY||rc==TRADE_RETCODE_MARKET_CLOSED||rc==TRADE_RETCODE_TRADE_DISABLED||rc==TRADE_RETCODE_INVALID_FILL||rc==TRADE_RETCODE_REQUOTE||rc==TRADE_RETCODE_PRICE_OFF||rc==TRADE_RETCODE_PRICE_CHANGED){
  TestPhase("REJECTED",trade.ResultRetcodeDescription());Receipt(id,"BROKER_REJECTED","",rc,trade.ResultRetcodeDescription());
 }else{g_lastExecution="TEST SUBMISSION UNCERTAIN - RECOVERING";}
}

void HandleCommand(string &parts[]){
 if(ArraySize(parts)<16)return;
 if(!LicenseReady()){Receipt(parts[1],"REJECTED","",0,"activation not confirmed");return;}string id=parts[1],mode=parts[2],action=parts[3],event=parts[4],side=parts[5],requested=parts[6],tag=parts[7],volumeMode=parts[8];double volumeValue=StringToDouble(parts[9]),referencePrice=StringToDouble(parts[10]),sl=StringToDouble(parts[11]),tp1=StringToDouble(parts[12]),tp2=StringToDouble(parts[13]),tp3=StringToDouble(parts[14]);long expiresMs=(long)StringToInteger(parts[15]);if(StringLen(tag)!=12){Receipt(id,"REJECTED","",0,"invalid correlation tag");return;}g_activityTick=GetTickCount64();g_lastSource=ArraySize(parts)>16?parts[16]:"unknown";g_lastStrategy=ArraySize(parts)>17?parts[17]:"";g_lastSignal=action+" "+event+" "+side+" "+requested;
 if(action=="OPEN"&&g_policyDirty){Receipt(id,"REJECTED","",0,"POLICY_SYNC_PENDING");return;}
 if(action=="OPEN"&&ArraySize(parts)>=26&&ValidPolicyAction(parts[21])&&ValidPolicyAction(parts[22])&&ValidPolicyAction(parts[23])){g_policy1=parts[21];g_policy2=parts[22];g_policy3=parts[23];g_policyPartial=StringToDouble(parts[24]);g_policyBuffer=(int)StringToInteger(parts[25]);}
 if(action=="OPEN")CountSignal(id);RiskCheck();if(g_riskHit){Receipt(id,"REJECTED","",0,"DAILY_DRAWDOWN_HIT: manual reset required");return;}
 if(action=="TEST"){HandleTimedTest(id,mode,side,requested,tag,volumeValue,expiresMs,ArraySize(parts)>18?parts[18]:"",ArraySize(parts)>19?parts[19]:"",ArraySize(parts)>20?parts[20]:"");return;}
 if(TimedTestActive()){Receipt(id,"REJECTED","",0,"connection test recovery in progress");return;}
 if(action=="OPEN"){HandleOpen(id,mode,side,requested,tag,volumeMode,volumeValue,referencePrice,sl,tp1,tp2,tp3,expiresMs);return;}if(action=="MANAGE"){HandleManage(id,mode,event,tag);return;}Receipt(id,"REJECTED","",0,"unsupported command action");
}
void ProcessLine(string line){
 string p[];ushort sep=StringGetCharacter("|",0);int n=StringSplit(line,sep,p);if(n<=0)return;
 if((p[0]=="HELLO_ACK"||p[0]=="HB_ACK")&&n>=3){
  long server=(long)StringToInteger(p[1]);string expiryText=p[2];StringReplace(expiryText,"-",".");datetime expiry=StringToTime(expiryText);
  if(server<=0||expiry<=0||(long)expiry*1000<=server){g_licenseActive=false;g_connStage="LICENSE EXPIRED / INVALID";return;}
  g_serverMs=server;g_licenseVerifiedTick=GetTickCount64();g_licenseExpiryMs=(long)expiry*1000;
  g_licenseActive=true;g_licenseExpires=p[2];g_connStage="LICENSE ACTIVE";if(g_policyDirty)SendLine("POLICY_UPDATE|"+g_policy1+"|"+g_policy2+"|"+g_policy3+"|"+F2(g_policyPartial)+"|"+IntegerToString(g_policyBuffer));SendTestStatus();return;
 }
 if(p[0]=="TEST_ACK"&&n>=3&&p[1]==g_testId&&p[2]==g_testPhase&&(p[2]=="CLOSED"||p[2]=="REJECTED")){
  if(FileDelete(TimedTestFile(),FILE_COMMON)){g_testId="";g_testTag="";g_testPhase="";g_testDeadlineTick=0;}return;
 }
 if(p[0]=="ERR"){g_licenseActive=false;g_connStage="ACTIVATION REJECTED";g_lastExecution="ACTIVATION: "+(n>=2?p[1]:"DENIED");Print("SignalBridge: activation rejected: ",n>=2?p[1]:"DENIED");DisconnectCloud();return;}
 if(p[0]=="EVENT_ACK"&&n>=4){int index=(int)StringToInteger(p[2]),state=(int)StringToInteger(p[3]);if(StringLen(p[1])==12&&index>=0&&index<3&&state>=1&&state<=3){GlobalVariableSet(PK(p[1],"ack"+IntegerToString(index)),state);GlobalVariablesFlush();}return;}
 if(p[0]=="POLICY_ACK"){g_policyDirty=false;GlobalVariableSet(RiskKey("policy_dirty"),0);GlobalVariablesFlush();return;}if(p[0]=="POLICY_REJECTED"){g_lastExecution="Policy sync rejected; check your settings";return;}
 if(p[0]=="POLICY_SET"&&!g_policyDirty&&n>=6&&ValidPolicyAction(p[1])&&ValidPolicyAction(p[2])&&ValidPolicyAction(p[3])){double pct=StringToDouble(p[4]);int buffer=(int)StringToInteger(p[5]);if(pct>0&&pct<100&&buffer>=0&&(p[1]=="CLOSE"||p[2]=="CLOSE"||p[3]=="CLOSE")){g_policy1=p[1];g_policy2=p[2];g_policy3=p[3];g_policyPartial=pct;g_policyBuffer=buffer;SavePolicyDefaults();}return;}
 if(p[0]=="REPORT_RANGE"&&n>=5&&LicenseReady()&&p[2]==N64(AccountInfoInteger(ACCOUNT_LOGIN))&&p[3]==AccountInfoString(ACCOUNT_SERVER)&&(long)StringToInteger(p[4])>=LicenseNowMs()){if(p[1]=="today"||p[1]=="7d"||p[1]=="30d"||p[1]=="all"){g_reportViewSince=p[1]=="all"?0:BrokerDay()-(p[1]=="7d"?6:p[1]=="30d"?29:0)*86400;g_reportTick=0;SendHeartbeat();}return;}
 if(p[0]=="REPORT_RESET"&&n>=5&&LicenseReady()&&p[2]==N64(AccountInfoInteger(ACCOUNT_LOGIN))&&p[3]==AccountInfoString(ACCOUNT_SERVER)&&(long)StringToInteger(p[4])>=LicenseNowMs()){if(!GlobalVariableCheck(RiskKey("rrid"))||GlobalVariableGet(RiskKey("rrid"))!=(double)RiskHash(p[1]))ResetReport(p[1]);return;}
 if(p[0]=="RISK_RESET"&&n>=7){bool bound=p[2]==N64(AccountInfoInteger(ACCOUNT_LOGIN))&&p[3]==AccountInfoString(ACCOUNT_SERVER);bool ok=LicenseReady()&&bound&&p[4]=="CONFIRM"&&(long)StringToInteger(p[6])>=LicenseNowMs()&&ResetDailyRisk(StringToDouble(p[5]));SendLine("RISK_RESET_ACK|"+p[1]+"|"+(ok?"READY":"REJECTED"));return;}
 if(p[0]=="CMD"){HandleCommand(p);return;}
 if(p[0]=="RACK"&&n>=4){if(p[3]=="1"){ClearReceipt(p[1],p[2]);if(FinalReceiptAckClearsPending(p[2]))ClearPendingById(p[1]);}return;}
 if(p[0]=="PONG"&&n>=2){ulong sent=(ulong)StringToInteger(p[1]);ulong now=GetTickCount64();if(sent>0&&now>=sent)g_cloudRttMs=(double)(now-sent);return;}
}
void ParseFrames(){
 for(;;){int n=ArraySize(g_frameBuf);if(n<2)return;int b0=(int)g_frameBuf[0],b1=(int)g_frameBuf[1],opcode=b0&15;bool masked=(b1&128)!=0;ulong len=(ulong)(b1&127);int pos=2;
  if(len==126){if(n<4)return;len=((ulong)g_frameBuf[2]<<8)|(ulong)g_frameBuf[3];pos=4;}else if(len==127){DisconnectCloud();return;}
  uchar mask[4];if(masked){if(n<pos+4)return;for(int i=0;i<4;i++)mask[i]=g_frameBuf[pos+i];pos+=4;}
  if(len>65535){DisconnectCloud();return;}if((ulong)n<(ulong)pos+len)return;
  uchar payload[];ArrayResize(payload,(int)len);for(int i=0;i<(int)len;i++){uchar v=g_frameBuf[pos+i];payload[i]=masked?(uchar)(v^mask[i&3]):v;}
  DropBytes(g_frameBuf,pos+(int)len);
  if(opcode==8){DisconnectCloud();return;}if(opcode==9){string pong=CharArrayToString(payload,0,(int)len,CP_UTF8);WsSendFrame(10,pong);continue;}if(opcode!=1)continue;
  string line=CharArrayToString(payload,0,(int)len,CP_UTF8);StringTrimLeft(line);StringTrimRight(line);if(line!="")ProcessLine(line);
 }
}
void PumpCloud(){
 if(!CloudConnected())return;for(int k=0;k<4;k++){uchar chunk[];int got=SocketTlsReadAvailable(g_socket,chunk,32768);if(got<0){DisconnectCloud();return;}if(got==0)break;AppendBytes(g_frameBuf,chunk,got);}ParseFrames();
}

color BlendColor(color a,color b,double t){
 int av=(int)a,bv=(int)b;
 int red=(int)((av&255)*(1-t)+(bv&255)*t),green=(int)(((av>>8)&255)*(1-t)+((bv>>8)&255)*t),blue=(int)(((av>>16)&255)*(1-t)+((bv>>16)&255)*t);
 return (color)(red+(green<<8)+(blue<<16));
}
int UiRefresh(){return (int)MathMax(33,MathMin(1000,InpUiRefreshMs));}
string g_panelTab="OVERVIEW";
//+------------------------------------------------------------------+
//| Command center panel: anti-aliased ARGB canvas, eased animation, |
//| hover/press feedback, sliding tabs and a draggable header.       |
//+------------------------------------------------------------------+
#define SB_FONT_B "Segoe UI Semibold"
#define SB_FONT_R "Segoe UI"
#define SB_FONT_M "Consolas"
#define SB_RES "::SB290_panel"
#define SB_OBJ "SB290_panel"
#define SB_HMAX 620
color P_BG=C'7,11,18',P_CARD=C'13,20,31',P_CARD2=C'18,28,42',P_LINE=C'37,53,69',P_GOLD=C'231,196,119',P_GOLD2=C'255,226,150',P_CYAN=C'128,217,226',P_GREEN=C'56,219,158',P_RED=C'255,111,125',P_TEXT=C'237,242,248',P_MUTED=C'139,156,178',P_DIM=C'92,108,128';
double SbClamp(double v,double lo,double hi){return MathMax(lo,MathMin(hi,v));}
uint SbA(color c,double a=1.0){return ColorToARGB(c,(uchar)SbClamp(255.0*a,0,255));}
color SbMix(color a,color b,double t){t=SbClamp(t,0,1);int ia=(int)a,ib=(int)b;int r=(int)((ia&0xFF)*(1-t)+(ib&0xFF)*t),g=(int)(((ia>>8)&0xFF)*(1-t)+((ib>>8)&0xFF)*t),bl=(int)(((ia>>16)&0xFF)*(1-t)+((ib>>16)&0xFF)*t);return (color)(r|(g<<8)|(bl<<16));}
uint SbLerpA(uint a,uint b,double t){t=SbClamp(t,0,1);uint r=0;for(int s=0;s<32;s+=8){double ca=(double)((a>>s)&0xFF),cb=(double)((b>>s)&0xFF);r|=((uint)(ca+(cb-ca)*t+0.5)&0xFF)<<s;}return r;}
double SbAngDiff(double a,double b){double d=MathMod(a-b,360.0);if(d<0)d+=360.0;return d;}
double SbEase(double cur,double target,double k){if(MathAbs(target-cur)<1e-6)return target;return cur+(target-cur)*k;}

class CSbSurface
  {
public:
   uint px[];int w,h;
   void Resize(int W,int H){w=MathMax(W,1);h=MathMax(H,1);ArrayResize(px,w*h);Clear();}
   void Clear(){ArrayInitialize(px,0);}
   void Blend(int x,int y,uint c,double cov)
     {
      if(x<0||y<0||x>=w||y>=h)return;
      double sa=(double)((c>>24)&0xFF)/255.0*cov;if(sa<=0.003)return;if(sa>1)sa=1;
      int i=y*w+x;uint d=px[i];double da=(double)((d>>24)&0xFF)/255.0,k=da*(1.0-sa),oa=sa+k;if(oa<=0)return;
      uint r=(uint)((((c>>16)&0xFF)*sa+((d>>16)&0xFF)*k)/oa+0.5),g=(uint)((((c>>8)&0xFF)*sa+((d>>8)&0xFF)*k)/oa+0.5),b=(uint)(((c&0xFF)*sa+(d&0xFF)*k)/oa+0.5),a=(uint)(oa*255.0+0.5);
      if(a>255)a=255;if(r>255)r=255;if(g>255)g=255;if(b>255)b=255;px[i]=(a<<24)|(r<<16)|(g<<8)|b;
     }
   double SdRR(double qx,double qy,double x,double y,double ww,double hh,double r){double hx=ww*0.5,hy=hh*0.5,dx=MathAbs(qx-(x+hx))-(hx-r),dy=MathAbs(qy-(y+hy))-(hy-r),ox=MathMax(dx,0),oy=MathMax(dy,0);return MathSqrt(ox*ox+oy*oy)+MathMin(MathMax(dx,dy),0)-r;}
   void FillRR(double x,double y,double ww,double hh,double r,uint c1,uint c2=0,bool grad=false)
     {
      if(ww<=0||hh<=0)return;r=MathMin(r,MathMin(ww,hh)*0.5);
      int x0=MathMax((int)MathFloor(x),0),x1=MathMin((int)MathCeil(x+ww),w),y0=MathMax((int)MathFloor(y),0),y1=MathMin((int)MathCeil(y+hh),h);
      for(int j=y0;j<y1;j++)
        {
         uint c=grad?SbLerpA(c1,c2,(j+0.5-y)/hh):c1;if(((c>>24)&0xFF)==0)continue;
         double py=j+0.5;bool mid=(py>y+r+0.5&&py<y+hh-r-0.5);
         int a=(int)MathCeil(x+0.5),b=(int)MathFloor(x+ww-0.5);
         for(int i=x0;i<x1;i++)
           {
            if(mid&&i>=a&&i<b){if(((c>>24)&0xFF)==255){int e=MathMin(b,x1);ArrayFill(px,j*w+i,e-i,c);i=e-1;continue;}Blend(i,j,c,1.0);continue;}
            double d=SdRR(i+0.5,py,x,y,ww,hh,r);if(d>=0.5)continue;Blend(i,j,c,MathMin(1.0,0.5-d));
           }
        }
     }
   void StrokeRR(double x,double y,double ww,double hh,double r,double th,uint c)
     {
      r=MathMin(r,MathMin(ww,hh)*0.5);int x0=MathMax((int)MathFloor(x)-1,0),x1=MathMin((int)MathCeil(x+ww)+1,w),y0=MathMax((int)MathFloor(y)-1,0),y1=MathMin((int)MathCeil(y+hh)+1,h),band=(int)MathCeil(th)+2,sA=(int)MathCeil(x+band),sB=(int)MathFloor(x+ww-band);
      for(int j=y0;j<y1;j++){double py=j+0.5;bool mid=(py>y+r+band&&py<y+hh-r-band);for(int i=x0;i<x1;i++){if(mid&&i>sA&&i<sB){i=sB-1;continue;}double d=SdRR(i+0.5,py,x,y,ww,hh,r),cov=th*0.5+0.5-MathAbs(d+th*0.5);if(cov>0)Blend(i,j,c,MathMin(1.0,cov));}}
     }
   void GlowRR(double x,double y,double ww,double hh,double r,double spread,uint c)
     {
      r=MathMin(r,MathMin(ww,hh)*0.5);int sp=(int)MathCeil(spread),x0=MathMax((int)x-sp,0),x1=MathMin((int)(x+ww)+sp,w),y0=MathMax((int)y-sp,0),y1=MathMin((int)(y+hh)+sp,h),sA=(int)MathCeil(x+1),sB=(int)MathFloor(x+ww-1);
      for(int j=y0;j<y1;j++){double py=j+0.5;bool mid=(py>y+r&&py<y+hh-r);for(int i=x0;i<x1;i++){if(mid&&i>sA&&i<sB){i=sB-1;continue;}double d=SdRR(i+0.5,py,x,y,ww,hh,r);if(d<=0||d>=spread)continue;Blend(i,j,c,MathExp(-3.0*d/spread)*(1.0-d/spread));}}
     }
   void Circle(double cx,double cy,double r,uint c)
     {
      int x0=MathMax((int)(cx-r-1),0),x1=MathMin((int)(cx+r+2),w),y0=MathMax((int)(cy-r-1),0),y1=MathMin((int)(cy+r+2),h);
      for(int j=y0;j<y1;j++)for(int i=x0;i<x1;i++){double dx=i+0.5-cx,dy=j+0.5-cy,cov=r+0.5-MathSqrt(dx*dx+dy*dy);if(cov>0)Blend(i,j,c,MathMin(1.0,cov));}
     }
   void Ring(double cx,double cy,double r,double th,uint c){Arc(cx,cy,r,th,0,360,c,false);}
   void Arc(double cx,double cy,double r,double th,double a0,double span,uint c,bool caps=true)
     {
      if(span<=0)return;if(span>360)span=360;
      int x0=MathMax((int)(cx-r-th-1),0),x1=MathMin((int)(cx+r+th+2),w),y0=MathMax((int)(cy-r-th-1),0),y1=MathMin((int)(cy+r+th+2),h);
      for(int j=y0;j<y1;j++)for(int i=x0;i<x1;i++)
        {
         double dx=i+0.5-cx,dy=j+0.5-cy,d=MathSqrt(dx*dx+dy*dy),cov=th*0.5+0.5-MathAbs(d-r);if(cov<=0)continue;
         if(span<360){double ang=MathArctan2(dx,-dy)*180.0/M_PI;if(SbAngDiff(ang,a0)>span)continue;}
         Blend(i,j,c,MathMin(1.0,cov));
        }
      if(caps&&span<360){double ra=a0*M_PI/180.0,rb=(a0+span)*M_PI/180.0;Circle(cx+r*MathSin(ra),cy-r*MathCos(ra),th*0.5,c);Circle(cx+r*MathSin(rb),cy-r*MathCos(rb),th*0.5,c);}
     }
   void Line(double ax,double ay,double bx,double by,double th,uint c)
     {
      int x0=MathMax((int)(MathMin(ax,bx)-th-1),0),x1=MathMin((int)(MathMax(ax,bx)+th+2),w),y0=MathMax((int)(MathMin(ay,by)-th-1),0),y1=MathMin((int)(MathMax(ay,by)+th+2),h);
      double vx=bx-ax,vy=by-ay,ll=vx*vx+vy*vy;
      for(int j=y0;j<y1;j++)for(int i=x0;i<x1;i++){double qx=i+0.5-ax,qy=j+0.5-ay,t=(ll>0)?SbClamp((qx*vx+qy*vy)/ll,0,1):0,ex=qx-vx*t,ey=qy-vy*t,cov=th*0.5+0.5-MathSqrt(ex*ex+ey*ey);if(cov>0)Blend(i,j,c,MathMin(1.0,cov));}
     }
   void Text(string s,int x,int y,string font,int size,int weight,uint c,uint anchor=0){if(((c>>24)&0xFF)==0||s=="")return;TextSetFont(font,size,weight);TextOut(s,x,y,anchor,px,w,h,c,COLOR_FORMAT_ARGB_NORMALIZE);}
   int TextW(string s,string font,int size,int weight){uint tw=0,th=0;TextSetFont(font,size,weight);TextGetSize(s,tw,th);return (int)tw;}
  };

CSbSurface g_sf;
bool g_sbReady=false,g_mouseDown=false,g_dragging=false,g_scrollOff=false,g_scrollWas=true,g_posInit=false;
int g_pX=0,g_pY=0,g_pW=420,g_dragOX=0,g_dragOY=0;
double g_hCur=0,g_tabPos=0,g_dBal=0,g_dEq=0,g_dNet=0,g_dDD=0,g_barsGrow=0,g_sigFlash=-100,g_pressT=-100,g_toastT=-100;
string g_hover="",g_press="",g_toast="",g_seenSignal="";bool g_valsInit=false;
string g_hbId[];int g_hbX[],g_hbY[],g_hbW[],g_hbH[];
string SB_TABS[5]={"OVERVIEW","SIGNALS","TRADES","RISK","SETTINGS"};
double SbNow(){return (double)GetTickCount64()/1000.0;}
void HitReset(){ArrayResize(g_hbId,0);ArrayResize(g_hbX,0);ArrayResize(g_hbY,0);ArrayResize(g_hbW,0);ArrayResize(g_hbH,0);}
void HitAdd(string id,int x,int y,int w,int h){int n=ArraySize(g_hbId);ArrayResize(g_hbId,n+1);ArrayResize(g_hbX,n+1);ArrayResize(g_hbY,n+1);ArrayResize(g_hbW,n+1);ArrayResize(g_hbH,n+1);g_hbId[n]=id;g_hbX[n]=x;g_hbY[n]=y;g_hbW[n]=w;g_hbH[n]=h;}
string HitTest(int x,int y){for(int i=ArraySize(g_hbId)-1;i>=0;i--)if(x>=g_hbX[i]&&x<g_hbX[i]+g_hbW[i]&&y>=g_hbY[i]&&y<g_hbY[i]+g_hbH[i])return g_hbId[i];return "";}
void Toast(string text){g_toast=text;g_toastT=SbNow();}
string Money(double v){string s=DoubleToString(MathAbs(v),2);int dot=StringFind(s,".");string ip=StringSubstr(s,0,dot),fp=StringSubstr(s,dot);string out="";int n=StringLen(ip);for(int i=0;i<n;i++){out+=StringSubstr(ip,i,1);if((n-i-1)%3==0&&i<n-1)out+=",";}return (v<0?"-":"")+out+fp;}
string Signed(double v){return (v>=0?"+":"")+Money(v);}

int PanelTargetH()
  {
   if(g_compact)return 132;
   if(g_panelTab=="OVERVIEW")return 560;
   if(g_panelTab=="TRADES")return 470;
   return 452;
  }
void PanelPlace(int h)
  {
   int cw=(int)ChartGetInteger(0,CHART_WIDTH_IN_PIXELS),ch=(int)ChartGetInteger(0,CHART_HEIGHT_IN_PIXELS,0);
   if(!g_posInit)
     {
      g_pX=InpPanelX;g_pY=InpPanelY;
      if(InpCorner==CORNER_RIGHT_UPPER||InpCorner==CORNER_RIGHT_LOWER)g_pX=cw-InpPanelX-g_pW;
      if(InpCorner==CORNER_LEFT_LOWER||InpCorner==CORNER_RIGHT_LOWER)g_pY=ch-InpPanelY-h;
      g_posInit=true;
     }
   if(cw>g_pW)g_pX=(int)SbClamp(g_pX,0,cw-g_pW);if(ch>40)g_pY=(int)SbClamp(g_pY,0,MathMax(0,ch-40));
   ObjectSetInteger(0,SB_OBJ,OBJPROP_XDISTANCE,g_pX);ObjectSetInteger(0,SB_OBJ,OBJPROP_YDISTANCE,g_pY);ObjectSetInteger(0,SB_OBJ,OBJPROP_YSIZE,h);
  }
bool PanelCreate()
  {
   g_pW=(int)SbClamp(InpPanelWidth,380,560);
   g_sf.Resize(g_pW,SB_HMAX);
   if(!ResourceCreate(SB_RES,g_sf.px,g_sf.w,g_sf.h,0,0,0,COLOR_FORMAT_ARGB_NORMALIZE))return false;
   ObjectDelete(0,SB_OBJ);
   if(!ObjectCreate(0,SB_OBJ,OBJ_BITMAP_LABEL,0,0,0))return false;
   ObjectSetInteger(0,SB_OBJ,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,SB_OBJ,OBJPROP_XSIZE,g_pW);ObjectSetInteger(0,SB_OBJ,OBJPROP_YSIZE,SB_HMAX);
   ObjectSetString(0,SB_OBJ,OBJPROP_BMPFILE,SB_RES);ObjectSetInteger(0,SB_OBJ,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,SB_OBJ,OBJPROP_HIDDEN,true);ObjectSetInteger(0,SB_OBJ,OBJPROP_ZORDER,100);ObjectSetInteger(0,SB_OBJ,OBJPROP_BACK,false);
   ChartSetInteger(0,CHART_EVENT_MOUSE_MOVE,true);
   g_hCur=PanelTargetH();g_sbReady=true;return true;
  }
void PanelDestroy(){if(g_scrollOff){ChartSetInteger(0,CHART_MOUSE_SCROLL,g_scrollWas);g_scrollOff=false;}ObjectDelete(0,SB_OBJ);ResourceFree(SB_RES);g_sbReady=false;}

//--- widgets
void Btn(string id,int x,int y,int w,int h,string text,color accent,bool primary,bool enabled=true)
  {
   double t=SbNow(),hov=(enabled&&g_hover==id)?1.0:0.0,pr=(g_press==id)?MathMax(0,1.0-(t-g_pressT)/0.25):0;
   double inset=pr*1.5;
   if(primary){g_sf.GlowRR(x,y,w,h,8,10+6*hov,SbA(accent,0.20+0.18*hov));g_sf.FillRR(x+inset,y+inset,w-2*inset,h-2*inset,8,SbA(SbMix(accent,P_GOLD2,0.25+0.2*hov)),SbA(SbMix(accent,C'120,90,30',0.25)),true);}
   else{g_sf.FillRR(x+inset,y+inset,w-2*inset,h-2*inset,8,SbA(SbMix(P_CARD2,accent,0.06+0.12*hov)));g_sf.StrokeRR(x+inset,y+inset,w-2*inset,h-2*inset,8,1,SbA(SbMix(P_LINE,accent,0.25+0.6*hov)));}
   if(!enabled)g_sf.FillRR(x,y,w,h,8,SbA(P_BG,0.45));
   color tc=primary?C'12,10,4':SbMix(P_TEXT,accent,0.35+0.4*hov);
   g_sf.Text(text,x+w/2,y+h/2,SB_FONT_B,9,FW_BOLD,SbA(tc,enabled?1.0:0.5),TA_CENTER|TA_VCENTER);
   if(enabled)HitAdd(id,x,y,w,h);
  }
void Card(int x,int y,int w,int h,double glow=0,color tint=clrNONE)
  {
   if(glow>0)g_sf.GlowRR(x,y,w,h,10,12,SbA(tint==clrNONE?P_GOLD:tint,0.22*glow));
   g_sf.FillRR(x,y,w,h,10,SbA(P_CARD2),SbA(P_CARD),true);
   g_sf.StrokeRR(x,y,w,h,10,1,SbA(tint==clrNONE?P_LINE:SbMix(P_LINE,tint,0.35+0.5*glow)));
  }
void Kicker(string s,int x,int y,color c=clrNONE){g_sf.Text(s,x,y,SB_FONT_B,7,FW_BOLD,SbA(c==clrNONE?P_MUTED:c));}
void Chip(string s,int x,int y,color c,bool filled=false)
  {
   int tw=g_sf.TextW(s,SB_FONT_B,7,FW_BOLD)+14;
   g_sf.FillRR(x,y,tw,18,9,SbA(c,filled?0.9:0.12));if(!filled)g_sf.StrokeRR(x,y,tw,18,9,1,SbA(c,0.45));
   g_sf.Text(s,x+tw/2,y+9,SB_FONT_B,7,FW_BOLD,SbA(filled?C'8,10,14':c),TA_CENTER|TA_VCENTER);
  }

string StatusText(color &c)
  {
   if(LicenseReady()){c=P_GREEN;return "LIVE  "+DoubleToString(g_cloudRttMs,0)+" ms";}
   if(CloudConnected()){c=P_GOLD;return "VERIFYING";}
   c=P_RED;string s=g_connStage;if(StringLen(s)>22)s=StringSubstr(s,0,22);return s==""?"OFFLINE":s;
  }

void DrawHeader(double t,int W)
  {
   //--- header band with a moving sheen
   g_sf.FillRR(1,1,W-2,g_compact?50:62,13,SbA(C'20,30,45'),SbA(C'10,15,24'),true);
   double sx=MathMod(t*90,W+240)-120;for(int i=0;i<120;i++){double a=0.05*MathSin(M_PI*i/120.0);for(int j=2;j<(g_compact?50:62);j+=1)g_sf.Blend((int)(sx+i-j*0.35),j,SbA(P_GOLD2),a);}
   //--- logo badge
   double pulse=(MathSin(t*2.2)+1)/2;
   g_sf.GlowRR(14,12,34,34,9,8+4*pulse,SbA(P_GOLD,0.25));
   g_sf.FillRR(14,12,34,34,9,SbA(P_GOLD2),SbA(C'176,134,52'),true);
   g_sf.Text("DFX",31,29,SB_FONT_B,9,FW_HEAVY,SbA(C'20,14,4'),TA_CENTER|TA_VCENTER);
   g_sf.Circle(45,43,4,SbA(LicenseReady()?P_GREEN:P_RED));g_sf.Ring(45,43,4,1.5,SbA(C'10,15,24'));
   g_sf.Text("DrFX",58,15,SB_FONT_B,13,FW_BOLD,SbA(P_GOLD));
   g_sf.Text("SIGNALBRIDGE",58+g_sf.TextW("DrFX ",SB_FONT_B,13,FW_BOLD),19,SB_FONT_B,8,FW_BOLD,SbA(P_TEXT,0.9));
   if(!g_compact)g_sf.Text("EA 0.29.0  ·  "+AccountMode()+"  ·  LICENSE "+LicenseRemaining(),58,38,SB_FONT_M,7,FW_NORMAL,SbA(P_MUTED));
   //--- status pill with breathing dot
   color sc;string st=StatusText(sc);int pw=g_sf.TextW(st,SB_FONT_B,7,FW_BOLD)+30,px0=W-pw-40,py0=g_compact?15:18;
   g_sf.FillRR(px0,py0,pw,22,11,SbA(sc,0.12));g_sf.StrokeRR(px0,py0,pw,22,11,1,SbA(sc,0.5));
   g_sf.Circle(px0+12,py0+11,3+2.5*pulse,SbA(sc,0.25*(1-pulse)+0.05));g_sf.Circle(px0+12,py0+11,3,SbA(sc));
   g_sf.Text(st,px0+21,py0+11,SB_FONT_B,7,FW_BOLD,SbA(sc),TA_LEFT|TA_VCENTER);
   //--- collapse / expand
   double hv=g_hover=="compact"?1:0;g_sf.FillRR(W-32,py0,22,22,7,SbA(SbMix(P_CARD2,P_GOLD,0.1+0.2*hv)));g_sf.StrokeRR(W-32,py0,22,22,7,1,SbA(SbMix(P_LINE,P_GOLD,0.3+0.5*hv)));
   g_sf.Text(g_compact?"+":"–",W-21,py0+11,SB_FONT_B,11,FW_BOLD,SbA(SbMix(P_MUTED,P_GOLD,0.4+0.6*hv)),TA_CENTER|TA_VCENTER);HitAdd("compact",W-32,py0,22,22);
   HitAdd("drag",0,0,W-44,g_compact?50:62);
  }

void DrawTabs(double t,int W)
  {
   int x0=12,y0=72,tw=(W-24)/5;
   g_sf.FillRR(x0,y0,W-24,30,9,SbA(P_CARD));g_sf.StrokeRR(x0,y0,W-24,30,9,1,SbA(P_LINE));
   int sel=0;for(int i=0;i<5;i++)if(SB_TABS[i]==g_panelTab)sel=i;
   g_tabPos=SbEase(g_tabPos,sel,0.28);
   double ix=x0+3+g_tabPos*tw;
   g_sf.GlowRR(ix,y0+3,tw-6,24,7,8,SbA(P_GOLD,0.18));g_sf.FillRR(ix,y0+3,tw-6,24,7,SbA(P_GOLD,0.22),SbA(P_GOLD,0.10),true);g_sf.StrokeRR(ix,y0+3,tw-6,24,7,1,SbA(P_GOLD,0.6));
   for(int i=0;i<5;i++)
     {
      string id="tab"+IntegerToString(i);double hv=g_hover==id?1:0,on=MathMax(0,1-MathAbs(g_tabPos-i));
      g_sf.Text(SB_TABS[i],x0+i*tw+tw/2,y0+15,SB_FONT_B,7,FW_BOLD,SbA(SbMix(SbMix(P_MUTED,P_TEXT,hv*0.7),P_GOLD2,on)),TA_CENTER|TA_VCENTER);
      HitAdd(id,x0+i*tw,y0,tw,30);
     }
  }

void Kpi(int x,int y,int w,string k,double v,color c,double t,int i)
  {
   Card(x,y,w,62);Kicker(k,x+12,y+11);
   g_sf.Text(Money(v),x+12,y+40,SB_FONT_M,12,FW_BOLD,SbA(c),TA_LEFT|TA_VCENTER);
   double sh=MathMod(t*0.6+i*0.33,1.0);g_sf.Line(x+10,y+60,x+10+(w-20)*sh,y+60,1.2,SbA(c,0.35*(1-sh)));
  }

void DrawFlow(int x,int y,int w,double t)
  {
   bool live=LicenseReady();Card(x,y,w,74,live?0.5+0.5*MathSin(t*1.6)*0.5:0,live?P_GREEN:clrNONE);
   Kicker("SIGNAL ROUTE",x+12,y+10);
   g_sf.Text(live?"Cloud RTT "+DoubleToString(g_cloudRttMs,0)+" ms":"Waiting for verified connection",x+w-12,y+10,SB_FONT_R,7,FW_NORMAL,SbA(live?P_GREEN:P_MUTED),TA_RIGHT);
   string nodes[3];nodes[0]="TV / TELEGRAM";nodes[1]="DRFX CLOUD";nodes[2]="MT5 · "+AccountMode();color nc[3];nc[0]=P_CYAN;nc[1]=P_GOLD;nc[2]=P_GREEN;
   double cy=y+44,xs[3];xs[0]=x+44;xs[1]=x+w/2.0;xs[2]=x+w-44;
   for(int i=0;i<2;i++)
     {
      g_sf.Line(xs[i]+12,cy,xs[i+1]-12,cy,1.5,SbA(P_LINE));
      if(live)for(int k=0;k<3;k++){double p=MathMod(t*0.55+k/3.0+i*0.17,1.0);double px=xs[i]+12+(xs[i+1]-xs[i]-24)*p;g_sf.Circle(px,cy,5,SbA(nc[i+1],0.12));g_sf.Circle(px,cy,2.2,SbA(nc[i+1],0.95*MathSin(M_PI*p)));}
     }
   for(int i=0;i<3;i++)
     {
      double pl=live?(MathSin(t*2.4+i*1.1)+1)/2:0;
      g_sf.Circle(xs[i],cy,13+3*pl,SbA(nc[i],0.10));g_sf.Circle(xs[i],cy,10,SbA(P_BG));g_sf.Ring(xs[i],cy,10,1.6,SbA(nc[i],live?0.95:0.4));g_sf.Circle(xs[i],cy,3.5,SbA(nc[i],live?1:0.4));
      g_sf.Text(nodes[i],(int)xs[i],(int)cy+18,SB_FONT_B,6,FW_BOLD,SbA(P_MUTED),TA_CENTER|TA_TOP);
     }
  }

void DrawCounters(int x,int y,int w)
  {
   string k[5]={"SIGNALS","TP1","TP2","TP3","STOPS"};long v[5];v[0]=g_reportSignals;v[1]=g_reportTP1;v[2]=g_reportTP2;v[3]=g_reportTP3;v[4]=g_reportStops;
   color c[5];c[0]=P_CYAN;c[1]=P_GREEN;c[2]=P_GREEN;c[3]=P_GREEN;c[4]=P_RED;int cw=(w-16)/5;
   for(int i=0;i<5;i++){int cx=x+i*(cw+4);Card(cx,y,cw,50);Kicker(k[i],cx+cw/2-g_sf.TextW(k[i],SB_FONT_B,7,FW_BOLD)/2,y+9);g_sf.Text(IntegerToString((int)v[i]),cx+cw/2,y+33,SB_FONT_M,12,FW_BOLD,SbA(c[i]),TA_CENTER|TA_VCENTER);}
  }

void DrawBars(int x,int y,int w,int h)
  {
   Card(x,y,w,h);Kicker("14-DAY NET P/L · BROKER HISTORY",x+12,y+10);
   double mx=0,sum=0;for(int i=0;i<14;i++){mx=MathMax(mx,MathAbs(g_reportBars[i]));sum+=g_reportBars[i];}
   g_sf.Text(Signed(sum),x+w-12,y+10,SB_FONT_M,8,FW_BOLD,SbA(sum>=0?P_GREEN:P_RED),TA_RIGHT);
   int top=y+30,bot=y+h-12,mid=(top+bot)/2;g_sf.Line(x+12,mid,x+w-12,mid,1,SbA(P_LINE));
   double bw=(w-24)/14.0;g_barsGrow=SbEase(g_barsGrow,1,0.12);
   for(int i=0;i<14;i++)
     {
      double v=g_reportBars[i],hh=mx>0?MathAbs(v)/mx*(mid-top-2)*g_barsGrow:0;double bx=x+12+i*bw+2;
      if(hh<1){g_sf.FillRR(bx,mid-1,bw-4,2,1,SbA(P_DIM,0.6));continue;}
      color c=v>=0?P_GREEN:P_RED;
      if(v>=0)g_sf.FillRR(bx,mid-hh,bw-4,hh,3,SbA(c,0.95),SbA(c,0.35),true);else g_sf.FillRR(bx,mid,bw-4,hh,3,SbA(c,0.35),SbA(c,0.95),true);
     }
   if(mx<=0)g_sf.Text("Waiting for closed trades",x+w/2,mid-12,SB_FONT_R,8,FW_NORMAL,SbA(P_MUTED),TA_CENTER|TA_VCENTER);
  }

void DrawLast(int x,int y,int w,double t)
  {
   if(g_lastSignal!=g_seenSignal){g_seenSignal=g_lastSignal;if(g_valsInit)g_sigFlash=t;}
   double f=MathMax(0,1-(t-g_sigFlash)/2.0);Card(x,y,w,52,f,P_CYAN);
   g_sf.Circle(x+18,y+26,4+6*f,SbA(P_CYAN,0.25*f));g_sf.Circle(x+18,y+26,3.5,SbA(P_CYAN));
   g_sf.Text(StringSubstr(g_lastSignal,0,52),x+32,y+18,SB_FONT_B,8,FW_BOLD,SbA(SbMix(P_CYAN,P_TEXT,f)),TA_LEFT|TA_VCENTER);
   g_sf.Text(StringSubstr(g_lastExecution,0,60),x+32,y+36,SB_FONT_R,7,FW_NORMAL,SbA(P_MUTED),TA_LEFT|TA_VCENTER);
  }

void DrawFooter(int x,int y,int w)
  {
   int bw=(w-8)/2;
   Btn("report_reset",x,y,bw,32,"↻  RESET REPORT",P_CYAN,false);
   if(g_riskHit)Btn("risk_reset",x+bw+8,y,bw,32,"RESTART AFTER DD HIT",P_RED,true);
   else Btn("risk_reset",x+bw+8,y,bw,32,"DAILY DD  "+F2(g_riskDD)+"% / "+F2(InpDailyDrawdownPercent)+"%",P_GREEN,false,false);
  }

void DrawOverview(int W,double t)
  {
   int x=12,y=112,cw=(W-24-16)/3;
   Kpi(x,y,cw,"BALANCE",g_dBal,P_TEXT,t,0);Kpi(x+cw+8,y,cw,"EQUITY",g_dEq,g_dEq>=g_dBal?P_GREEN:P_GOLD2,t,1);Kpi(x+2*(cw+8),y,cw,"NET REPORT",g_dNet,g_dNet>=0?P_GREEN:P_RED,t,2);
   DrawFlow(x,y+72,W-24,t);
   DrawCounters(x,y+156,W-24);
   DrawBars(x,y+216,W-24,104);
   DrawLast(x,y+330,W-24,t);
   DrawFooter(x,y+396,W-24);
  }

void DrawSignals(int W,double t)
  {
   int x=12,y=112,w=W-24;
   if(g_lastSignal!=g_seenSignal){g_seenSignal=g_lastSignal;if(g_valsInit)g_sigFlash=t;}
   double f=MathMax(0,1-(t-g_sigFlash)/2.0);Card(x,y,w,150,f,P_CYAN);
   double cx=x+52,cy=y+75;for(int k=0;k<3;k++){double p=MathMod(t*0.5+k/3.0,1.0);g_sf.Ring(cx,cy,10+30*p,1.5,SbA(P_CYAN,0.5*(1-p)));}
   g_sf.Circle(cx,cy,9,SbA(P_CYAN));g_sf.Circle(cx,cy,3.5,SbA(P_BG));
   Kicker("LAST SIGNAL",x+104,y+18);g_sf.Text(StringSubstr(g_lastSignal,0,40),x+104,y+38,SB_FONT_B,10,FW_BOLD,SbA(P_TEXT));
   Kicker("SOURCE / STRATEGY",x+104,y+66);g_sf.Text(StringSubstr(g_lastSource+(g_lastStrategy!=""?" / "+g_lastStrategy:""),0,44),x+104,y+82,SB_FONT_R,8,FW_NORMAL,SbA(P_CYAN));
   Kicker("EXECUTION",x+104,y+106);g_sf.Text(StringSubstr(g_lastExecution,0,44),x+104,y+122,SB_FONT_R,8,FW_NORMAL,SbA(P_MUTED));
   DrawCounters(x,y+160,w);
   Card(x,y+220,w,64);Kicker("CONNECTION",x+12,y+232);g_sf.Text(StringSubstr(g_connStage,0,48),x+12,y+256,SB_FONT_B,9,FW_BOLD,SbA(LicenseReady()?P_GREEN:P_GOLD2),TA_LEFT|TA_VCENTER);
   g_sf.Text("Ticket "+g_lastTicket,x+w-12,y+256,SB_FONT_M,8,FW_NORMAL,SbA(P_MUTED),TA_RIGHT|TA_VCENTER);
   DrawFooter(x,y+296,w);
  }

void DrawTrades(int W,double t)
  {
   int x=12,y=112,w=W-24,n=CountMyPositions();
   Card(x,y,w,302);Kicker("BRIDGE POSITIONS",x+12,y+12);Chip(IntegerToString(n)+" OPEN",x+w-70,y+8,n>0?P_GREEN:P_MUTED);
   int row=0;double mx=0;
   for(int i=0;i<PositionsTotal();i++){ulong tk=PositionGetTicket(i);if(tk>0&&PositionSelectByTicket(tk)&&(long)PositionGetInteger(POSITION_MAGIC)==InpMagic)mx=MathMax(mx,MathAbs(PositionGetDouble(POSITION_PROFIT)));}
   for(int i=0;i<PositionsTotal()&&row<6;i++)
     {
      ulong tk=PositionGetTicket(i);if(tk==0||!PositionSelectByTicket(tk)||(long)PositionGetInteger(POSITION_MAGIC)!=InpMagic)continue;
      int ry=y+38+row*42;bool buy=(ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY;double pl=PositionGetDouble(POSITION_PROFIT);color pc=pl>=0?P_GREEN:P_RED;
      double hv=g_hover=="row"+IntegerToString(row)?1:0;g_sf.FillRR(x+8,ry,w-16,36,8,SbA(SbMix(P_CARD,P_GOLD,0.05+0.08*hv)));HitAdd("row"+IntegerToString(row),x+8,ry,w-16,36);
      Chip(buy?"BUY":"SELL",x+16,ry+9,buy?P_GREEN:P_RED,true);
      g_sf.Text(PositionGetString(POSITION_SYMBOL),x+70,ry+12,SB_FONT_B,8,FW_BOLD,SbA(P_TEXT),TA_LEFT|TA_VCENTER);
      g_sf.Text(DoubleToString(PositionGetDouble(POSITION_VOLUME),2)+" lot",x+70,ry+26,SB_FONT_M,7,FW_NORMAL,SbA(P_MUTED),TA_LEFT|TA_VCENTER);
      double frac=mx>0?MathAbs(pl)/mx:0;int bx=x+w/2,bwid=(int)((w/2-110)*frac);g_sf.FillRR(bx,ry+15,w/2-110,6,3,SbA(P_LINE));if(bwid>0)g_sf.FillRR(bx,ry+15,bwid,6,3,SbA(pc,0.85));
      g_sf.Text(Signed(pl),x+w-16,ry+18,SB_FONT_M,9,FW_BOLD,SbA(pc),TA_RIGHT|TA_VCENTER);
      row++;
     }
   if(row==0){double p=(MathSin(t*1.5)+1)/2;g_sf.Ring(x+w/2,y+140,22+4*p,1.5,SbA(P_GOLD,0.3+0.3*p));g_sf.Text("No SignalBridge positions",x+w/2,y+188,SB_FONT_B,9,FW_BOLD,SbA(P_TEXT),TA_CENTER|TA_VCENTER);g_sf.Text("New bridge orders appear here live",x+w/2,y+206,SB_FONT_R,8,FW_NORMAL,SbA(P_MUTED),TA_CENTER|TA_VCENTER);}
   g_sf.Text("FLOATING  "+Signed(AccountInfoDouble(ACCOUNT_PROFIT)),x+12,y+288,SB_FONT_M,8,FW_BOLD,SbA(AccountInfoDouble(ACCOUNT_PROFIT)>=0?P_GREEN:P_RED),TA_LEFT|TA_VCENTER);
   DrawFooter(x,y+314,w);
  }

void DrawRisk(int W,double t)
  {
   int x=12,y=112,w=W-24;color c=g_riskHit?P_RED:(g_dDD>InpDailyDrawdownPercent*0.7?P_GOLD2:P_GREEN);
   Card(x,y,w,214,g_riskHit?0.6+0.4*MathSin(t*4):0,g_riskHit?P_RED:clrNONE);
   double cx=x+86,cy=y+112,r=58,frac=SbClamp(g_dDD/MathMax(0.01,InpDailyDrawdownPercent),0,1);
   g_sf.Arc(cx,cy,r,10,225,270,SbA(P_LINE));if(frac>0)g_sf.Arc(cx,cy,r,10,225,270*frac,SbA(c));
   double ea=(225+270*frac)*M_PI/180.0;g_sf.Circle(cx+r*MathSin(ea),cy-r*MathCos(ea),7,SbA(c,0.25));
   g_sf.Text(F2(g_dDD)+"%",(int)cx,(int)cy-4,SB_FONT_M,15,FW_BOLD,SbA(c),TA_CENTER|TA_VCENTER);g_sf.Text("of "+F2(InpDailyDrawdownPercent)+"% limit",(int)cx,(int)cy+18,SB_FONT_R,7,FW_NORMAL,SbA(P_MUTED),TA_CENTER|TA_VCENTER);
   int tx=x+168;Kicker("DAILY ACCOUNT DRAWDOWN",tx,y+28);Chip(g_riskHit?"HIT · SIGNALS PAUSED":"READY",tx,y+46,c,g_riskHit);
   g_sf.Text("Equity "+Money(AccountInfoDouble(ACCOUNT_EQUITY)),tx,y+86,SB_FONT_M,8,FW_NORMAL,SbA(P_TEXT));
   g_sf.Text("Today "+Signed(g_dailyProfit),tx,y+104,SB_FONT_M,8,FW_NORMAL,SbA(g_dailyProfit>=0?P_GREEN:P_RED));
   g_sf.Text("A HIT closes ALL account",tx,y+134,SB_FONT_R,7,FW_NORMAL,SbA(P_MUTED));g_sf.Text("positions and orders.",tx,y+148,SB_FONT_R,7,FW_NORMAL,SbA(P_MUTED));
   g_sf.Text("Manual confirmation restarts.",tx,y+166,SB_FONT_R,7,FW_NORMAL,SbA(P_MUTED));
   DrawCounters(x,y+224,w);
   DrawFooter(x,y+296,w);
  }

void DrawSettings(int W,double t)
  {
   int x=12,y=112,w=W-24;
   Card(x,y,w,112);Kicker("DEFAULT TRADE MANAGEMENT · NEW POSITIONS",x+12,y+12);
   string p[3];p[0]=g_policy1;p[1]=g_policy2;p[2]=g_policy3;int cw=(w-40)/3;
   for(int i=0;i<3;i++){int cx=x+12+i*(cw+8);color c=p[i]=="CLOSE"?P_GREEN:p[i]=="BE"?P_CYAN:p[i]=="PARTIAL"?P_GOLD2:P_DIM;double hv=g_hover=="pol"+IntegerToString(i)?1:0;
      g_sf.FillRR(cx,y+36,cw,58,9,SbA(SbMix(P_CARD,c,0.08+0.1*hv)));g_sf.StrokeRR(cx,y+36,cw,58,9,1,SbA(c,0.45+0.3*hv));HitAdd("pol"+IntegerToString(i),cx,y+36,cw,58);
      g_sf.Text("TP"+IntegerToString(i+1),cx+cw/2,y+52,SB_FONT_B,7,FW_BOLD,SbA(P_MUTED),TA_CENTER|TA_VCENTER);g_sf.Text(p[i],cx+cw/2,y+74,SB_FONT_B,11,FW_BOLD,SbA(c),TA_CENTER|TA_VCENTER);}
   g_sf.Text("Partial "+DoubleToString(g_policyPartial,0)+"%  ·  BE buffer "+IntegerToString(g_policyBuffer)+" pts",x+12,y+102,SB_FONT_M,7,FW_NORMAL,SbA(P_MUTED),TA_LEFT|TA_VCENTER);
   Card(x,y+122,w,112);Kicker("EXECUTION",x+12,y+134);
   string k[4]={"TEST SYMBOL","DEFAULT LOTS","MAX LOT","MAX RISK"};string v[4];v[0]=TestSymbol();v[1]=DoubleToString(InpDefaultLots,2);v[2]=DoubleToString(InpMaxLot,2);v[3]=F2(InpMaxRiskPercent)+"%";
   for(int i=0;i<4;i++){int cx=x+12+(i%2)*(w/2),cy=y+156+(i/2)*36;Kicker(k[i],cx,cy);g_sf.Text(v[i],cx,cy+18,SB_FONT_M,9,FW_BOLD,SbA(P_TEXT),TA_LEFT|TA_VCENTER);}
   g_sf.Text("Change in F7 inputs or your member portal at drfx.company",x+w/2,y+254,SB_FONT_R,7,FW_NORMAL,SbA(P_MUTED),TA_CENTER|TA_VCENTER);
   DrawFooter(x,y+296,w);
  }

void DrawCompact(int W,double t)
  {
   int x=12,y=58,w=W-24;
   Kicker("EQUITY",x,y);g_sf.Text(Money(g_dEq),x,y+20,SB_FONT_M,11,FW_BOLD,SbA(P_TEXT),TA_LEFT|TA_VCENTER);
   Kicker("NET",x+w/2,y);g_sf.Text(Signed(g_dNet),x+w/2,y+20,SB_FONT_M,11,FW_BOLD,SbA(g_dNet>=0?P_GREEN:P_RED),TA_LEFT|TA_VCENTER);
   double frac=SbClamp(g_dDD/MathMax(0.01,InpDailyDrawdownPercent),0,1);color c=g_riskHit?P_RED:P_GREEN;
   g_sf.FillRR(x,y+42,w,8,4,SbA(P_LINE));if(frac>0)g_sf.FillRR(x,y+42,MathMax(8,w*frac),8,4,SbA(c));
   g_sf.Text("DD "+F2(g_dDD)+"% / "+F2(InpDailyDrawdownPercent)+"%"+(g_riskHit?"  HIT":""),x,y+62,SB_FONT_M,7,FW_NORMAL,SbA(c),TA_LEFT|TA_VCENTER);
   g_sf.Text("SIG "+N64(g_reportSignals)+"  TP "+N64(g_reportTP1+g_reportTP2+g_reportTP3)+"  SL "+N64(g_reportStops),x+w,y+62,SB_FONT_M,7,FW_NORMAL,SbA(P_CYAN),TA_RIGHT|TA_VCENTER);
  }

void RenderPanel(){
 if(!InpShowPanel){DeletePanel();return;}
 if(g_sbReady&&ObjectFind(0,SB_OBJ)<0)g_sbReady=false;
 if(!g_sbReady&&!PanelCreate())return;
 RefreshReport();
 double t=InpAnimations?SbNow():0;int W=g_pW;
 //--- eased numbers and height
 double k=InpAnimations?0.22:1.0;
 if(!g_valsInit){g_dBal=AccountInfoDouble(ACCOUNT_BALANCE);g_dEq=AccountInfoDouble(ACCOUNT_EQUITY);g_dNet=0;g_dDD=0;g_tabPos=0;}
 g_dBal=SbEase(g_dBal,AccountInfoDouble(ACCOUNT_BALANCE),k);g_dEq=SbEase(g_dEq,AccountInfoDouble(ACCOUNT_EQUITY),k);g_dNet=SbEase(g_dNet,g_reportProfit+g_reportLoss,k);g_dDD=SbEase(g_dDD,g_riskDD,k);
 g_hCur=SbEase(g_hCur,PanelTargetH(),InpAnimations?0.3:1.0);int H=(int)MathCeil(g_hCur);
 g_sf.Clear();HitReset();
 //--- frame: shadow, body, animated conic edge
 g_sf.FillRR(0,0,W,H,14,SbA(P_BG),SbA(C'5,8,13'),true);
 g_sf.StrokeRR(0,0,W,H,14,1,SbA(P_LINE));
 if(InpAnimations){double per=2.0*(W+H),pos=MathMod(t*160,per);for(int s=0;s<90;s++){double q=MathMod(pos-s*2,per),ex,ey;if(q<W){ex=q;ey=0.5;}else if(q<W+H){ex=W-0.5;ey=q-W;}else if(q<2*W+H){ex=W-(q-W-H);ey=H-0.5;}else{ex=0.5;ey=H-(q-2*W-H);}g_sf.Blend((int)ex,(int)ey,SbA(P_GOLD2),1.0-s/90.0);}}
 DrawHeader(t,W);
 if(g_compact)DrawCompact(W,t);
 else
   {
    DrawTabs(t,W);
    if(g_panelTab=="OVERVIEW")DrawOverview(W,t);
    else if(g_panelTab=="SIGNALS")DrawSignals(W,t);
    else if(g_panelTab=="TRADES")DrawTrades(W,t);
    else if(g_panelTab=="RISK")DrawRisk(W,t);
    else DrawSettings(W,t);
   }
 //--- toast
 double ta=SbNow()-g_toastT;if(g_toast!=""&&ta<2.6){double a=SbClamp(MathMin(ta/0.2,(2.6-ta)/0.4),0,1);int tw=g_sf.TextW(g_toast,SB_FONT_B,8,FW_BOLD)+28,tx=(W-tw)/2,ty=H-50+(int)(8*(1-a));g_sf.FillRR(tx,ty,tw,26,13,SbA(C'24,34,48',0.96*a));g_sf.StrokeRR(tx,ty,tw,26,13,1,SbA(P_GOLD,0.6*a));g_sf.Text(g_toast,W/2,ty+13,SB_FONT_B,8,FW_BOLD,SbA(P_TEXT,a),TA_CENTER|TA_VCENTER);}
 g_valsInit=true;
 ResourceCreate(SB_RES,g_sf.px,g_sf.w,g_sf.h,0,0,0,COLOR_FORMAT_ARGB_NORMALIZE);
 PanelPlace(MathMin(H,SB_HMAX));ChartRedraw(0);
}

void PanelClick(string id)
  {
   if(id=="")return;g_press=id;g_pressT=SbNow();
   if(StringFind(id,"tab")==0){int t=(int)StringToInteger(StringSubstr(id,3));if(t>=0&&t<5&&g_panelTab!=SB_TABS[t]){g_panelTab=SB_TABS[t];g_barsGrow=0;}}
   else if(id=="compact"){g_compact=!g_compact;}
   else if(id=="report_reset"){if(MessageBox("Reset displayed report only? Drawdown and open trades are unchanged.","SignalBridge reports",MB_YESNO)==IDYES){ResetReport(N64((long)TimeCurrent()));g_barsGrow=0;Toast("Report reset");}}
   else if(id=="risk_reset"){if(g_riskHit&&MessageBox("Restart signals and start a new drawdown baseline? All account positions and orders must already be closed.","SignalBridge daily drawdown",MB_YESNO|MB_ICONWARNING)==IDYES){if(ResetDailyRisk(g_hitId))Toast("Signals restarted");else Toast("Close all positions first");}}
   else if(StringFind(id,"pol")==0)Toast("Edit TP actions in F7 inputs or the portal");
   RenderPanel();
  }
void OnChartEvent(const int id,const long &lparam,const double &dparam,const string &sparam)
  {
   if(id==CHARTEVENT_MOUSE_MOVE&&g_sbReady)
     {
      int mx=(int)lparam-g_pX,my=(int)dparam-g_pY;bool inside=(mx>=0&&mx<g_pW&&my>=0&&my<(int)g_hCur),down=((StringToInteger(sparam)&1)==1);
      if(g_dragging){if(down){g_pX=(int)lparam-g_dragOX;g_pY=(int)dparam-g_dragOY;PanelPlace((int)g_hCur);ChartRedraw(0);}else g_dragging=false;}
      string hv=inside?HitTest(mx,my):"";if(hv!=g_hover){g_hover=hv;if(!InpAnimations)RenderPanel();}
      if(inside&&!g_scrollOff){g_scrollWas=(bool)ChartGetInteger(0,CHART_MOUSE_SCROLL);ChartSetInteger(0,CHART_MOUSE_SCROLL,false);g_scrollOff=true;}
      else if(!inside&&g_scrollOff&&!down&&!g_dragging){ChartSetInteger(0,CHART_MOUSE_SCROLL,g_scrollWas);g_scrollOff=false;}
      if(down&&!g_mouseDown&&inside){if(hv=="drag"){g_dragging=true;g_dragOX=mx;g_dragOY=my;}else PanelClick(hv);}
      g_mouseDown=down;return;
     }
   if(id==CHARTEVENT_CHART_CHANGE&&g_sbReady)PanelPlace((int)g_hCur);
  }

int OnInit(){if(InpPartialPercent<=0||InpPartialPercent>=100||InpBreakEvenBufferPoints<0||(InpTP1Action!=SB_EXIT_CLOSE&&InpTP2Action!=SB_EXIT_CLOSE&&InpTP3Action!=SB_EXIT_CLOSE)||InpDefaultLots<=0||InpDefaultLots>InpMaxLot||InpDailyDrawdownPercent<=0||InpDailyDrawdownPercent>100||InpTestSymbol==""){Print("SignalBridge: invalid lot, symbol or daily drawdown input");return INIT_PARAMETERS_INCORRECT;}RiskInit();LoadPolicyDefaults();RiskCheck();RecoverClosedTargets();MathSrand((int)(GetTickCount64()^(ulong)AccountInfoInteger(ACCOUNT_LOGIN)));Print("SignalBridge EA v0.29.0 starting. Account: ",AccountMode(),"; server: ",InpCloudHost," (no secret printed).");if(!ValidActivationCode(InpActivationCode)){g_connStage=InpActivationCode==""?"ACTIVATION CODE REQUIRED":"INVALID ACTIVATION CODE";Print("SignalBridge: activation code missing or invalid; obtain a 43-character code from your DrFX client portal.");}if(AccountInfoInteger(ACCOUNT_TRADE_MODE)!=ACCOUNT_TRADE_MODE_DEMO)Print("SignalBridge: non-DEMO account detected. Automatic signal execution remains DEMO-only; LIVE tests require explicit opt-in.");g_compact=InpCompact;PendingLoad();ReceiptLoad();g_testLock=FileOpen(TimedTestFile()+".lock",FILE_COMMON|FILE_READ|FILE_WRITE|FILE_BIN);if(g_testLock!=INVALID_HANDLE)LoadTimedTest();trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.LogLevel(LOG_LEVEL_ERRORS);int ms=InpTimerMs;if(ms<20)ms=20;if(ms>1000)ms=1000;if(!EventSetMillisecondTimer(ms)){PrintFormat("SignalBridge: timer initialization failed (%d)",GetLastError());return INIT_FAILED;}CloseTimedTest();if(!TimedTestActive())EnsureCloud();RenderPanel();return INIT_SUCCEEDED;}
void OnDeinit(const int reason){EventKillTimer();PanelDestroy();if(g_testLock!=INVALID_HANDLE){FileClose(g_testLock);g_testLock=INVALID_HANDLE;}DisconnectCloud();DeletePanel();ChartRedraw(0);}
void OnTick(){RiskCheck();ProcessPositionTargets();CloseTimedTest();}
void OnTimer(){
 RiskCheck();ProcessPositionTargets();CloseTimedTest();
 // During the five-second test/recovery, avoid blocking reconnects and socket writes.
 if(TimedTestActive()){if(GetTickCount64()-g_lastUiUpdate>=(ulong)UiRefresh()){g_lastUiUpdate=GetTickCount64();RenderPanel();}return;}
 EnsureCloud();PumpCloud();
 if(g_licenseActive&&!LicenseReady()){g_licenseActive=false;g_connStage="LICENSE EXPIRED / RECHECK REQUIRED";}
 ulong now=GetTickCount64();if(CloudConnected()&&now-g_lastHb>5000)SendHeartbeat();if(CloudConnected()&&now-g_lastPing>10000){g_lastPing=now;g_pingStarted=now;SendLine("PING|"+N64((long)now));}if(CloudConnected()&&now-g_lastReconcile>2000){g_lastReconcile=now;RecoverClosedTargets();FlushReceipts();if(HasPending())ReconcilePending();}if(now-g_lastUiUpdate>=(ulong)UiRefresh()){g_lastUiUpdate=now;RenderPanel();}}
void OnTradeTransaction(const MqlTradeTransaction &trans,const MqlTradeRequest &request,const MqlTradeResult &result){
 if(trans.type==TRADE_TRANSACTION_DEAL_ADD&&trans.deal>0&&HistoryDealSelect(trans.deal)&&HistoryDealGetInteger(trans.deal,DEAL_REASON)==DEAL_REASON_TP){long pid=HistoryDealGetInteger(trans.deal,DEAL_POSITION_ID);for(int i=GlobalVariablesTotal()-1;i>=0;i--){string k=GlobalVariableName(i);if(StringFind(k,"SBP_")!=0||(long)GlobalVariableGet(k)!=pid)continue;string tag=StringSubstr(k,4);if(!GlobalVariableCheck(PK(tag,"vol")))continue;int closeIndex=-1;for(int j=0;j<3;j++)if((int)GlobalVariableGet(PK(tag,"a"+IntegerToString(j)))==2){closeIndex=j;break;}for(int j=0;j<=closeIndex;j++){if(GlobalVariableGet(PK(tag,"t"+IntegerToString(j)))>0)PolicyHit(tag,j);if(j==closeIndex&&!HasPositionIdentifier(pid)){GlobalVariableSet(PK(tag,"s"+IntegerToString(j)),2);QueueTargetEvent(tag,j,2);}}}}

 if(trans.type!=TRADE_TRANSACTION_DEAL_ADD||trans.deal==0)return;if(!HistoryDealSelect(trans.deal))return;if((long)HistoryDealGetInteger(trans.deal,DEAL_MAGIC)!=InpMagic)return;
 string comment=HistoryDealGetString(trans.deal,DEAL_COMMENT);if(StringFind(comment,"SB:")!=0&&StringFind(request.comment,"SB:")==0)comment=request.comment;if(StringFind(comment,"SB:")!=0)return;
 string tag=StringSubstr(comment,3);int colon=StringFind(tag,":");if(colon>0)tag=StringSubstr(tag,0,colon);
 long pid=HistoryDealGetInteger(trans.deal,DEAL_POSITION_ID);if(pid>0){GlobalVariableSet(GVPosId(tag),(double)pid);FlushTradeIdentity();}
 if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(trans.deal,DEAL_ENTRY)!=DEAL_ENTRY_IN)return;
 ulong ticket=0;string sym="";double volume=0,open=0,sl=0,tp=0;if(FindPosition(tag,ticket,sym,volume,open,sl,tp))RememberPositionIdentity(tag,ticket);
 string id=ResolvePending(tag);if(id=="")return;Receipt(id,"FILLED",N64((long)trans.deal),0,"broker deal confirmed");
}
//+------------------------------------------------------------------+
