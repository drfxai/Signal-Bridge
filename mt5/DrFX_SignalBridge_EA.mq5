//+------------------------------------------------------------------+
//|                DrFX SignalBridge direct EA / licensed build        |
//| Direct Cloudflare WebSocket, replay-safe, DEMO-only execution    |
//+------------------------------------------------------------------+
#property copyright "DrFXAi"
#property link      "https://github.com/drfxai/Signal-Bridge"
#property strict
#property version   "0.280"
#property description "SignalBridge EA v0.28.0: animated compact panel, live telemetry and account-bound connection tests."
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
input int InpUiRefreshMs=125; // UI animation frame interval, clamped to 100-1000 ms
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

input group "=== Live Panel ==="
input bool InpShowPanel=true;
input bool InpCompact=false;
input ENUM_BASE_CORNER InpCorner=CORNER_LEFT_UPPER;
input int InpPanelX=16;
input int InpPanelY=22;
input int InpPanelWidth=390;

#define SBP "SB280_"
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
 string req="GET "+InpCloudPath+" HTTP/1.1\r\nHost: "+InpCloudHost+"\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: "+key+"\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Protocol: signalbridge-ea-v1, sb-token."+InpActivationCode+"\r\nUser-Agent: DrFX-SignalBridge-EA/0.28.0\r\n\r\n";
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
 GlobalVariableSet(seen,1);string k=RiskKey("signals"+N64(BrokerDay()));if(!GlobalVariableCheck(k))GlobalVariableSet(k,0);double n=GlobalVariableGet(k);GlobalVariableSetOnCondition(k,n+1,n);GlobalVariablesFlush();g_signalCount=(long)GlobalVariableGet(k);
}
void RecordManagedExit(string event){ulong d=trade.ResultDeal();if(d==0)return;double kind=(event=="SL"?2:(event=="TP1"||event=="TP2"||event=="TP3")?1:0);if(kind>0){GlobalVariableSet(RiskKey("deal"+N64((long)d)),kind);GlobalVariablesFlush();g_statsTick=0;}}
string TestSymbol(){string reason="",sym=ResolveTestSymbol(reason);return sym==""?InpTestSymbol:sym;}
string RiskTelemetry(){return "|"+(g_riskHit?"HIT":"READY")+"|"+F2(g_riskDD)+"|"+F2(InpDailyDrawdownPercent)+"|"+F2(g_dailyProfit)+"|"+N64(g_signalCount)+"|"+IntegerToString(g_targets)+"|"+IntegerToString(g_stops)+"|"+Safe(TestSymbol())+"|"+DoubleToString(InpDefaultLots,4)+"|"+DoubleToString(g_hitId,0);}
string TestCapabilities(){
 if(g_testLock==INVALID_HANDLE||!InpEnableConnectionTest||g_testCorrupt)return "risk-v1,test-config-v1";
 if(AccountMode()=="DEMO"&&InpEnableDemoExecution)return "timed-test-v1,timed-test-v2,test-config-v1,risk-v1";
 if(AccountMode()=="LIVE"&&InpEnableLiveConnectionTest)return "live-test-v2,test-config-v1,risk-v1";
 return "risk-v1,test-config-v1";
}
void SendHello(){SendLine("HELLO|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions())+"|"+F2(g_cloudRttMs)+"|"+TestCapabilities()+RiskTelemetry());g_lastHb=GetTickCount64();}
void SendHeartbeat(){if(SendLine("HB|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions())+"|"+F2(g_cloudRttMs)+"|"+TestCapabilities()+RiskTelemetry()))g_lastHb=GetTickCount64();}
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
 string sym=ResolveSymbol(requested);if(sym==""){Receipt(id,"REJECTED","",0,"symbol not found");return;}bool buy=(side=="BUY");MqlTick tick;if(!SymbolInfoTick(sym,tick)){Receipt(id,"REJECTED","",0,"no broker quote");return;}double current=buy?tick.ask:tick.bid;if(referencePrice>0&&MathAbs(current-referencePrice)/referencePrice*100.0>InpMaxPriceDeviationPct){Receipt(id,"REJECTED","",0,"price deviation too large");return;}
 long marginMode=AccountInfoInteger(ACCOUNT_MARGIN_MODE);
 if((marginMode==ACCOUNT_MARGIN_MODE_RETAIL_NETTING||marginMode==ACCOUNT_MARGIN_MODE_EXCHANGE)&&HasAnyPositionOnSymbol(sym)){Receipt(id,"REJECTED","",0,"netting account already has a position on this symbol; merge risk blocked");return;}
 double lots=(volumeMode=="RISK_PERCENT")?LotsForRisk(sym,buy,sl,volumeValue):NormalizeVolume(sym,volumeValue);if(lots<=0){Receipt(id,"REJECTED","",0,"position size invalid or below broker minimum");return;}double finalTp=(tp3>0?tp3:(tp2>0?tp2:tp1));if(finalTp<=0||!StopsValid(sym,buy,sl,finalTp)){Receipt(id,"REJECTED","",0,"SL/TP/spread validation failed");return;}
 if(mode=="dry_run"){Receipt(id,"PREVIEWED","",0,"preview accepted by MT5");return;}if(mode!="demo_execute"){Receipt(id,"REJECTED","",0,"unknown execution mode");return;}if(!DemoGate(id))return;if(CountMyPositions()>=InpMaxOpenTrades){Receipt(id,"REJECTED","",0,"max open trades reached");return;}
 if(!RegisterPending(tag,id)){Receipt(id,"ERROR","",0,"persistent pending-command ledger is full");return;}trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.SetTypeFillingBySymbol(sym);bool ok=buy?trade.Buy(lots,sym,0.0,sl,finalTp,"SB:"+tag):trade.Sell(lots,sym,0.0,sl,finalTp,"SB:"+tag);long rc=(long)trade.ResultRetcode();if(!ok){Receipt(id,"BROKER_REJECTED","",rc,trade.ResultRetcodeDescription());return;}GlobalVariableSet(GVVol(tag),lots);FlushTradeIdentity();
 RememberPositionFromDeal(tag,trade.ResultDeal());
 ulong openedTicket=0;string openedSym="";double openedVol=0,openedPrice=0,openedSl=0,openedTp=0;if(FindPosition(tag,openedTicket,openedSym,openedVol,openedPrice,openedSl,openedTp))RememberPositionIdentity(tag,openedTicket);
 Receipt(id,"SUBMITTED",N64((long)trade.ResultOrder()),rc,trade.ResultRetcodeDescription());
}

void HandleManage(string id,string mode,string event,string tag){
 ulong ticket=0;string sym="";double current=0,open=0,sl=0,tp=0;if(!FindPosition(tag,ticket,sym,current,open,sl,tp)){ulong d=0;if(HistoryHasTag(tag,d)){Receipt(id,"DUPLICATE",N64((long)d),0,"position already closed or action already completed");return;}Receipt(id,"REJECTED","",0,"matching SignalBridge position not found");return;}
 if(mode=="dry_run"){Receipt(id,"PREVIEWED",N64((long)ticket),0,"management preview "+event);return;}if(mode!="demo_execute"){Receipt(id,"REJECTED","",0,"unknown execution mode");return;}if(!DemoGate(id))return;
 trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.SetTypeFillingBySymbol(sym);
 if(event=="TP3"||event=="SL"||event=="CLOSE"){
  bool ok=trade.PositionClose(ticket);long rc=(long)trade.ResultRetcode();if(!ok){Receipt(id,"BROKER_REJECTED",N64((long)ticket),rc,trade.ResultRetcodeDescription());return;}Receipt(id,(rc==TRADE_RETCODE_DONE||rc==TRADE_RETCODE_DONE_PARTIAL)?"FILLED":"SUBMITTED",N64((long)trade.ResultDeal()),rc,event+" close "+trade.ResultRetcodeDescription());return;
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
  g_licenseActive=true;g_licenseExpires=p[2];g_connStage="LICENSE ACTIVE";SendTestStatus();return;
 }
 if(p[0]=="TEST_ACK"&&n>=3&&p[1]==g_testId&&p[2]==g_testPhase&&(p[2]=="CLOSED"||p[2]=="REJECTED")){
  if(FileDelete(TimedTestFile(),FILE_COMMON)){g_testId="";g_testTag="";g_testPhase="";g_testDeadlineTick=0;}return;
 }
 if(p[0]=="ERR"){g_licenseActive=false;g_connStage="ACTIVATION REJECTED";g_lastExecution="ACTIVATION: "+(n>=2?p[1]:"DENIED");Print("SignalBridge: activation rejected: ",n>=2?p[1]:"DENIED");DisconnectCloud();return;}
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
int UiRefresh(){return (int)MathMax(100,MathMin(1000,InpUiRefreshMs));}
void RenderPanel(){
 if(!InpShowPanel){DeletePanel();return;}
 int x=InpPanelX,y=InpPanelY,w=g_compact?242:(int)MathMax(370,InpPanelWidth),h=g_compact?128:426;
 ulong now=GetTickCount64();double pulse=InpAnimations?(MathSin((double)(now%6000)/6000*6.283185)+1)/2:1;
 color gold=C'255,204,98',stateColor=LicenseReady()?BlendColor(C'20,94,78',C_GREEN,pulse):C_RED;
 color edge=InpAnimations?BlendColor(C_BORDER,C'49,117,148',pulse):C_BORDER;
 Rect("root",x,y,w,h,C_BG,edge);Rect("head",x+1,y+1,w-2,g_compact?26:46,C_BG2,C_BORDER);
 if(g_compact){
  Label("title",x+8,y+7,"SignalBridge",9,gold);Label("state",x+106,y+7,"●",9,stateColor);Label("mode",x+122,y+8,AccountMode(),7,C_CYAN,"Consolas");
  Label("remaining",x+164,y+8,StringSubstr(LicenseRemaining(),0,4),7,gold,"Consolas");Button("compact",x+w-25,y+4,20,18,"+");
  Label("equity",x+8,y+35,"EQ "+F2(AccountInfoDouble(ACCOUNT_EQUITY)),9,C_TEXT,"Consolas");Label("positions",x+151,y+35,"OPEN "+IntegerToString(CountMyPositions()),8,C_CYAN,"Consolas");
  Label("rtt",x+8,y+60,"RTT "+F2(g_cloudRttMs)+"ms",7,C_MUTED,"Consolas");Label("test",x+117,y+60,TimedTestActive()?"TEST / "+g_testPhase:LicenseReady()?"CONNECTED":"OFFLINE",7,TimedTestActive()?C_AMBER:stateColor,"Consolas");
 }else{
  Label("title",x+14,y+10,"DrFX / SIGNALBRIDGE",11,gold);Label("version",x+14,y+29,"EA 0.28.0  /  "+AccountMode(),7,C_MUTED,"Consolas");Button("compact",x+w-96,y+12,82,23,"COMPACT");
  Label("status",x+14,y+60,LicenseReady()?"● EA CONNECTED":"● "+g_connStage,9,stateColor);Label("license",x+14,y+83,"LICENSE / "+LicenseRemaining(),9,gold,"Consolas");
  int col=(w-40)/2;
  Rect("balance_card",x+12,y+109,col,50,C_BG2,C_BORDER);Label("balance_k",x+22,y+117,"BALANCE",7,C_MUTED,"Consolas");Label("balance_v",x+22,y+134,F2(AccountInfoDouble(ACCOUNT_BALANCE)),11,C_TEXT,"Consolas");
  Rect("equity_card",x+col+28,y+109,col,50,C_BG2,C_BORDER);Label("equity_k",x+col+38,y+117,"EQUITY",7,C_MUTED,"Consolas");Label("equity_v",x+col+38,y+134,F2(AccountInfoDouble(ACCOUNT_EQUITY)),11,gold,"Consolas");
  Label("telemetry",x+14,y+177,"OPEN "+IntegerToString(CountMyPositions())+"   P/L "+F2(AccountInfoDouble(ACCOUNT_PROFIT))+"   "+F2(g_cloudRttMs)+"ms",8,C_CYAN,"Consolas");
  Label("source",x+14,y+204,StringSubstr(g_lastSource+" / "+g_lastStrategy,0,48),8,gold,"Consolas");Label("signal",x+14,y+226,StringSubstr(g_lastSignal,0,48),8,C_CYAN,"Consolas");
  Label("execution",x+14,y+248,StringSubstr(g_lastExecution,0,48),8,C_TEXT,"Consolas");
  Label("test",x+14,y+275,g_testCorrupt?"TEST JOURNAL ERROR":g_testId!=""?"TEST / "+g_testPhase:"TEST / "+(TestCapabilities()!=""?"READY":"OPT-IN REQUIRED"),8,TimedTestActive()?C_AMBER:C_MUTED,"Consolas");
  Label("expiry",x+14,y+299,"UTC / "+(g_licenseExpires==""?"UNVERIFIED":g_licenseExpires),7,C_MUTED,"Consolas");
  Label("account",x+14,y+325,"#"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+" / "+StringSubstr(AccountInfoString(ACCOUNT_SERVER),0,30),7,C_MUTED,"Consolas");
 }
 Button("risk_reset",x+8,y+(g_compact?84:350),w-16,22,g_riskHit?"DRAWDOWN HIT - CLICK TO RESTART":"DRAWDOWN READY / "+F2(g_riskDD)+"% of "+F2(InpDailyDrawdownPercent)+"%");
 ObjectSetInteger(0,SBP+"risk_reset",OBJPROP_BGCOLOR,g_riskHit?C_RED:C_GREEN);
 Label("daily_stats",x+8,y+(g_compact?111:382),"P/L "+F2(g_dailyProfit)+"  SIG "+N64(g_signalCount)+"  TP "+IntegerToString(g_targets)+"  SL "+IntegerToString(g_stops),g_compact?6:8,C_CYAN,"Consolas");
 // Ambient border sweep, activity pulse and factual test progress; no fabricated telemetry.
 int run=(int)(now%4000),sweep=InpAnimations?(int)((double)run/4000*(w-36)):0;
 Rect("sweep",x+4+sweep,y+1,28,2,InpAnimations?gold:C_BORDER,gold);
 if(TimedTestActive()){
  double fraction=g_testDeadlineTick>now?1-(double)(g_testDeadlineTick-now)/5000:1;fraction=MathMax(0,MathMin(1,fraction));
  Rect("progress_track",x+4,y+h-5,w-8,2,C_BG2,C_BG2);Rect("progress",x+4,y+h-5,(int)MathMax(1,(w-8)*fraction),2,C_AMBER,C_AMBER);
 }else{ObjectDelete(0,SBP+"progress");ObjectDelete(0,SBP+"progress_track");}
 if(InpAnimations&&now-g_activityTick<1500)ObjectSetInteger(0,SBP+"root",OBJPROP_COLOR,gold);
 ChartRedraw(0);
}

int OnInit(){if(InpDefaultLots<=0||InpDefaultLots>InpMaxLot||InpDailyDrawdownPercent<=0||InpDailyDrawdownPercent>100||InpTestSymbol==""){Print("SignalBridge: invalid lot, symbol or daily drawdown input");return INIT_PARAMETERS_INCORRECT;}RiskInit();RiskCheck();MathSrand((int)(GetTickCount64()^(ulong)AccountInfoInteger(ACCOUNT_LOGIN)));Print("SignalBridge EA v0.28.0 starting. Account: ",AccountMode(),"; server: ",InpCloudHost," (no secret printed).");if(!ValidActivationCode(InpActivationCode)){g_connStage=InpActivationCode==""?"ACTIVATION CODE REQUIRED":"INVALID ACTIVATION CODE";Print("SignalBridge: activation code missing or invalid; obtain a 43-character code from your DrFX client portal.");}if(AccountInfoInteger(ACCOUNT_TRADE_MODE)!=ACCOUNT_TRADE_MODE_DEMO)Print("SignalBridge: non-DEMO account detected. Automatic signal execution remains DEMO-only; LIVE tests require explicit opt-in.");g_compact=InpCompact;PendingLoad();ReceiptLoad();g_testLock=FileOpen(TimedTestFile()+".lock",FILE_COMMON|FILE_READ|FILE_WRITE|FILE_BIN);if(g_testLock!=INVALID_HANDLE)LoadTimedTest();trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.LogLevel(LOG_LEVEL_ERRORS);int ms=InpTimerMs;if(ms<20)ms=20;if(ms>1000)ms=1000;if(!EventSetMillisecondTimer(ms)){PrintFormat("SignalBridge: timer initialization failed (%d)",GetLastError());return INIT_FAILED;}CloseTimedTest();if(!TimedTestActive())EnsureCloud();RenderPanel();return INIT_SUCCEEDED;}
void OnDeinit(const int reason){EventKillTimer();if(g_testLock!=INVALID_HANDLE){FileClose(g_testLock);g_testLock=INVALID_HANDLE;}DisconnectCloud();DeletePanel();ChartRedraw(0);}
void OnTick(){RiskCheck();CloseTimedTest();}
void OnTimer(){
 RiskCheck();CloseTimedTest();
 // During the five-second test/recovery, avoid blocking reconnects and socket writes.
 if(TimedTestActive()){if(GetTickCount64()-g_lastUiUpdate>=(ulong)UiRefresh()){g_lastUiUpdate=GetTickCount64();RenderPanel();}return;}
 EnsureCloud();PumpCloud();
 if(g_licenseActive&&!LicenseReady()){g_licenseActive=false;g_connStage="LICENSE EXPIRED / RECHECK REQUIRED";}
 ulong now=GetTickCount64();if(CloudConnected()&&now-g_lastHb>5000)SendHeartbeat();if(CloudConnected()&&now-g_lastPing>10000){g_lastPing=now;g_pingStarted=now;SendLine("PING|"+N64((long)now));}if(CloudConnected()&&now-g_lastReconcile>2000){g_lastReconcile=now;FlushReceipts();if(HasPending())ReconcilePending();}if(now-g_lastUiUpdate>=(ulong)UiRefresh()){g_lastUiUpdate=now;RenderPanel();}}
void OnTradeTransaction(const MqlTradeTransaction &trans,const MqlTradeRequest &request,const MqlTradeResult &result){
 if(trans.type!=TRADE_TRANSACTION_DEAL_ADD||trans.deal==0)return;if(!HistoryDealSelect(trans.deal))return;if((long)HistoryDealGetInteger(trans.deal,DEAL_MAGIC)!=InpMagic)return;
 string comment=HistoryDealGetString(trans.deal,DEAL_COMMENT);if(StringFind(comment,"SB:")!=0&&StringFind(request.comment,"SB:")==0)comment=request.comment;if(StringFind(comment,"SB:")!=0)return;
 string tag=StringSubstr(comment,3);int colon=StringFind(tag,":");if(colon>0)tag=StringSubstr(tag,0,colon);
 long pid=HistoryDealGetInteger(trans.deal,DEAL_POSITION_ID);if(pid>0){GlobalVariableSet(GVPosId(tag),(double)pid);FlushTradeIdentity();}
 if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(trans.deal,DEAL_ENTRY)!=DEAL_ENTRY_IN)return;
 ulong ticket=0;string sym="";double volume=0,open=0,sl=0,tp=0;if(FindPosition(tag,ticket,sym,volume,open,sl,tp))RememberPositionIdentity(tag,ticket);
 string id=ResolvePending(tag);if(id=="")return;Receipt(id,"FILLED",N64((long)trans.deal),0,"broker deal confirmed");
}
void OnChartEvent(const int id,const long &lparam,const double &dparam,const string &sparam){if(id==CHARTEVENT_OBJECT_CLICK&&sparam==SBP+"risk_reset"){if(g_riskHit&&MessageBox("Restart signals and start a new drawdown baseline? All account positions and orders must already be closed.","SignalBridge daily drawdown",MB_YESNO|MB_ICONWARNING)==IDYES)ResetDailyRisk(g_hitId);RenderPanel();return;}if(id==CHARTEVENT_OBJECT_CLICK&&sparam==SBP+"compact"){g_compact=!g_compact;DeletePanel();RenderPanel();}}
//+------------------------------------------------------------------+
