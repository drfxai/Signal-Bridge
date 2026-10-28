//+------------------------------------------------------------------+
//|                DrFX SignalBridge direct EA / licensed build        |
//| Direct Cloudflare WebSocket, replay-safe, DEMO-only execution    |
//+------------------------------------------------------------------+
#property copyright "DrFXAi"
#property link      "https://github.com/drfxai/Signal-Bridge"
#property strict
#property version   "0.251"
#property description "SignalBridge EA v0.25.1: clearer connection and license diagnostics."
#property description "DEMO execution only. Live accounts are always refused."
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

input group "=== DEMO Execution Safety ==="
input bool InpEnableDemoExecution=false;
input long InpMagic=770425;
input double InpMaxLot=0.10;
input double InpMaxRiskPercent=1.00;
input double InpMaxPriceDeviationPct=0.75;
input int InpMaxOpenTrades=4;
input int InpMaxSpreadPoints=80;
input int InpSlippagePoints=20;
input string InpSymbolPrefix="";
input string InpSymbolSuffix="";

input group "=== Live Panel ==="
input bool InpShowPanel=true;
input bool InpCompact=false;
input ENUM_BASE_CORNER InpCorner=CORNER_LEFT_UPPER;
input int InpPanelX=16;
input int InpPanelY=22;
input int InpPanelWidth=390;

#define SBP "SB251_"
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
string g_connStage="ACTIVATION CODE REQUIRED";
string g_pendingTag[MAX_PENDING],g_pendingId[MAX_PENDING];
string g_receiptId[MAX_RECEIPTS],g_receiptStatus[MAX_RECEIPTS],g_receiptTicket[MAX_RECEIPTS],g_receiptRetcode[MAX_RECEIPTS],g_receiptDetail[MAX_RECEIPTS];
color C_BG=C'9,15,25',C_BG2=C'15,25,42',C_BORDER=C'43,65,93',C_TEXT=C'234,245,255',C_MUTED=C'139,160,184',C_CYAN=C'82,215,255',C_GREEN=C'69,213,161',C_AMBER=C'243,189,98',C_RED=C'255,111,125';

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
void DisconnectCloud(){if(g_socket!=INVALID_HANDLE){SocketClose(g_socket);g_socket=INVALID_HANDLE;}g_wsReady=false;g_licenseActive=false;g_licenseExpires="";ArrayResize(g_frameBuf,0);}
bool WsHandshake(){
 uchar nonce[];ArrayResize(nonce,16);for(int i=0;i<16;i++)nonce[i]=(uchar)(MathRand()&255);
 string key=Base64(nonce,16);
 string req="GET "+InpCloudPath+" HTTP/1.1\r\nHost: "+InpCloudHost+"\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: "+key+"\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Protocol: signalbridge-ea-v1, sb-token."+InpActivationCode+"\r\nUser-Agent: DrFX-SignalBridge-EA/0.25.1\r\n\r\n";
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
  Sleep(10);
 }
 return false;
}
void SendHello(){SendLine("HELLO|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions()));g_lastHb=GetTickCount64();}
void SendHeartbeat(){if(SendLine("HB|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions())+"|"+F2(g_cloudRttMs)))g_lastHb=GetTickCount64();}
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
 g_lastExecution=status+" · "+detail;if(ticket!="")g_lastTicket=ticket;return queued;
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

string ResolveSymbol(string requested){string s=InpSymbolPrefix+requested+InpSymbolSuffix;if(SymbolSelect(s,true))return s;if(SymbolSelect(requested,true))return requested;return "";}
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
 long rc=(long)trade.ResultRetcode();if(!ok){Receipt(id,"BROKER_REJECTED",N64((long)ticket),rc,trade.ResultRetcodeDescription());return;}string detail=event+" partial "+trade.ResultRetcodeDescription();
 ulong afterTicket=0;string afterSym="";double afterVol=0,afterOpen=0,afterSl=0,afterTp=0;
 if(FindPosition(tag,afterTicket,afterSym,afterVol,afterOpen,afterSl,afterTp)){
  RememberPositionIdentity(tag,afterTicket);
  if(event=="TP2"){double curTp=afterTp;if(!trade.PositionModify(afterTicket,afterOpen,curTp))detail+="; break-even move failed";}
 }
 Receipt(id,(rc==TRADE_RETCODE_DONE||rc==TRADE_RETCODE_DONE_PARTIAL)?"FILLED":"SUBMITTED",N64((long)trade.ResultDeal()),rc,detail);
}

void HandleCommand(string &parts[]){
 if(ArraySize(parts)<16)return;
 if(!g_licenseActive){Receipt(parts[1],"REJECTED","",0,"activation not confirmed");return;}string id=parts[1],mode=parts[2],action=parts[3],event=parts[4],side=parts[5],requested=parts[6],tag=parts[7],volumeMode=parts[8];double volumeValue=StringToDouble(parts[9]),referencePrice=StringToDouble(parts[10]),sl=StringToDouble(parts[11]),tp1=StringToDouble(parts[12]),tp2=StringToDouble(parts[13]),tp3=StringToDouble(parts[14]);long expiresMs=(long)StringToInteger(parts[15]);if(StringLen(tag)!=12){Receipt(id,"REJECTED","",0,"invalid correlation tag");return;}g_lastSignal=action+" "+event+" "+side+" "+requested;
 if(action=="OPEN"){HandleOpen(id,mode,side,requested,tag,volumeMode,volumeValue,referencePrice,sl,tp1,tp2,tp3,expiresMs);return;}if(action=="MANAGE"){HandleManage(id,mode,event,tag);return;}Receipt(id,"REJECTED","",0,"unsupported command action");
}
void ProcessLine(string line){
 string p[];ushort sep=StringGetCharacter("|",0);int n=StringSplit(line,sep,p);if(n<=0)return;
 if(p[0]=="HELLO_ACK"&&n>=3){g_licenseActive=true;g_licenseExpires=p[2];g_connStage="LICENSE ACTIVE";Print("SignalBridge: EA license verified for DEMO testing.");return;}
 if(p[0]=="ERR"){g_licenseActive=false;g_connStage="ACTIVATION REJECTED";g_lastExecution="ACTIVATION: "+(n>=2?p[1]:"DENIED");Print("SignalBridge: activation rejected: ",n>=2?p[1]:"DENIED");DisconnectCloud();return;}
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

void RenderPanel(){if(!InpShowPanel){DeletePanel();return;}int x=InpPanelX,y=InpPanelY,w=MathMax(370,InpPanelWidth),h=g_compact?132:300;Rect("root",x,y,w,h,C_BG,C_BORDER);Rect("head",x+1,y+1,w-2,44,C_BG2,C_BORDER);Label("title",x+12,y+8,"SignalBridge EA v0.25.1 · "+_Symbol,10,C_TEXT);Label("acct",x+12,y+25,AccountInfoString(ACCOUNT_SERVER)+" · #"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+" · "+MarginMode(),7,C_MUTED,"Consolas");Label("conn",x+w-124,y+9,g_licenseActive?"● LICENSE ACTIVE":"● LOCKED / OFFLINE",8,g_licenseActive?C_GREEN:C_RED,"Consolas");Button("compact",x+w-102,y+24,88,17,g_compact?"EXPAND":"COMPACT");if(g_compact){Label("c1",x+12,y+58,"Equity  "+F2(AccountInfoDouble(ACCOUNT_EQUITY)),9,C_TEXT,"Consolas");Label("c2",x+12,y+80,"Last  "+g_lastSignal,8,C_CYAN,"Consolas");Label("c3",x+12,y+102,"Exec  "+g_lastExecution,8,C_MUTED,"Consolas");ChartRedraw(0);return;}int yy=y+58;Label("k1",x+12,yy,"BALANCE",7,C_MUTED,"Consolas");Label("v1",x+12,yy+16,F2(AccountInfoDouble(ACCOUNT_BALANCE)),11,C_TEXT,"Consolas");Label("k2",x+110,yy,"EQUITY",7,C_MUTED,"Consolas");Label("v2",x+110,yy+16,F2(AccountInfoDouble(ACCOUNT_EQUITY)),11,C_TEXT,"Consolas");Label("k3",x+205,yy,"FLOAT",7,C_MUTED,"Consolas");Label("v3",x+205,yy+16,F2(AccountInfoDouble(ACCOUNT_PROFIT)),11,AccountInfoDouble(ACCOUNT_PROFIT)>=0?C_GREEN:C_RED,"Consolas");Label("k4",x+298,yy,"OPEN",7,C_MUTED,"Consolas");Label("v4",x+298,yy+16,IntegerToString(CountMyPositions()),11,C_CYAN,"Consolas");yy+=68;Label("l1",x+14,yy,"Latest signal",8,C_MUTED);Label("r1",x+130,yy,g_lastSignal,8,C_CYAN,"Consolas");Label("l2",x+14,yy+23,"Execution",8,C_MUTED);Label("r2",x+130,yy+23,g_lastExecution,8,C_TEXT,"Consolas");Label("l3",x+14,yy+46,"Ticket",8,C_MUTED);Label("r3",x+130,yy+46,g_lastTicket,8,C_TEXT,"Consolas");Label("l4",x+14,yy+69,"Account",8,C_MUTED);Label("r4",x+130,yy+69,AccountMode()+" · "+MarginMode(),8,AccountMode()=="DEMO"?C_GREEN:C_AMBER,"Consolas");Label("l5",x+14,yy+92,"Demo execution",8,C_MUTED);Label("r5",x+130,yy+92,InpEnableDemoExecution?"ENABLED":"LOCKED",8,InpEnableDemoExecution?C_AMBER:C_GREEN,"Consolas");Rect("foot",x+12,y+h-42,w-24,28,C_BG2,C_BORDER);Label("foot_t",x+22,y+h-34,g_licenseActive?"LICENSE ACTIVE · expires "+g_licenseExpires:g_connStage,7,g_licenseActive?C_GREEN:C_AMBER,"Consolas");ChartRedraw(0);}

int OnInit(){MathSrand((int)(GetTickCount64()^(ulong)AccountInfoInteger(ACCOUNT_LOGIN)));Print("SignalBridge EA v0.25.1 starting. Account: ",AccountMode(),"; server: ",InpCloudHost," (no secret printed).");if(!ValidActivationCode(InpActivationCode)){g_connStage=InpActivationCode==""?"ACTIVATION CODE REQUIRED":"INVALID ACTIVATION CODE";Print("SignalBridge: activation code missing or invalid; obtain a 43-character code from your DrFX client portal.");}if(AccountInfoInteger(ACCOUNT_TRADE_MODE)!=ACCOUNT_TRADE_MODE_DEMO)Print("SignalBridge: non-DEMO account detected. Trade execution will remain BLOCKED.");g_compact=InpCompact;PendingLoad();ReceiptLoad();trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.LogLevel(LOG_LEVEL_ERRORS);int ms=InpTimerMs;if(ms<20)ms=20;if(ms>1000)ms=1000;if(!EventSetMillisecondTimer(ms)){PrintFormat("SignalBridge: timer initialization failed (%d)",GetLastError());return INIT_FAILED;}EnsureCloud();RenderPanel();return INIT_SUCCEEDED;}
void OnDeinit(const int reason){EventKillTimer();DisconnectCloud();DeletePanel();ChartRedraw(0);}
void OnTick(){}
void OnTimer(){EnsureCloud();PumpCloud();ulong now=GetTickCount64();if(CloudConnected()&&now-g_lastHb>30000)SendHeartbeat();if(CloudConnected()&&now-g_lastPing>60000){g_lastPing=now;g_pingStarted=now;SendLine("PING|"+N64((long)now));}if(CloudConnected()&&now-g_lastReconcile>2000){g_lastReconcile=now;FlushReceipts();if(HasPending())ReconcilePending();}if(now-g_lastUiUpdate>=750){g_lastUiUpdate=now;RenderPanel();}}
void OnTradeTransaction(const MqlTradeTransaction &trans,const MqlTradeRequest &request,const MqlTradeResult &result){
 if(trans.type!=TRADE_TRANSACTION_DEAL_ADD||trans.deal==0)return;if(!HistoryDealSelect(trans.deal))return;if((long)HistoryDealGetInteger(trans.deal,DEAL_MAGIC)!=InpMagic)return;
 string comment=HistoryDealGetString(trans.deal,DEAL_COMMENT);if(StringFind(comment,"SB:")!=0&&StringFind(request.comment,"SB:")==0)comment=request.comment;if(StringFind(comment,"SB:")!=0)return;
 string tag=StringSubstr(comment,3);int colon=StringFind(tag,":");if(colon>0)tag=StringSubstr(tag,0,colon);
 long pid=HistoryDealGetInteger(trans.deal,DEAL_POSITION_ID);if(pid>0){GlobalVariableSet(GVPosId(tag),(double)pid);FlushTradeIdentity();}
 if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(trans.deal,DEAL_ENTRY)!=DEAL_ENTRY_IN)return;
 ulong ticket=0;string sym="";double volume=0,open=0,sl=0,tp=0;if(FindPosition(tag,ticket,sym,volume,open,sl,tp))RememberPositionIdentity(tag,ticket);
 string id=ResolvePending(tag);if(id=="")return;Receipt(id,"FILLED",N64((long)trans.deal),0,"broker deal confirmed");
}
void OnChartEvent(const int id,const long &lparam,const double &dparam,const string &sparam){if(id==CHARTEVENT_OBJECT_CLICK&&sparam==SBP+"compact"){g_compact=!g_compact;DeletePanel();RenderPanel();}}
//+------------------------------------------------------------------+
