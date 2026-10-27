//+------------------------------------------------------------------+
//|                            DrFX_SignalBridge_EA_v0.20.mq5        |
//|    Low-latency localhost Agent bridge + DEMO-only execution      |
//+------------------------------------------------------------------+
#property copyright "DrFXAi"
#property link      "https://github.com/drfxai/Signal-Bridge"
#property version   "0.20"
#property strict
#property description "SignalBridge MT5 test EA. Persistent local TCP Agent transport."
#property description "DEMO execution only. Live accounts are always refused."
#property description "Add 127.0.0.1 to MT5 allowed network addresses before use."

#include <Trade\Trade.mqh>

input group "=== SignalBridge Agent ==="
input string InpAgentHost = "127.0.0.1";
input int    InpAgentPort = 17777;
input int    InpTimerMs   = 50;

input group "=== DEMO Execution Safety ==="
input bool   InpEnableDemoExecution = false;
input long   InpMagic               = 770425;
input double InpMaxLot              = 0.10;
input double InpMaxRiskPercent      = 1.00;
input double InpMaxPriceDeviationPct= 0.75;
input int    InpMaxOpenTrades       = 4;
input int    InpMaxSpreadPoints     = 80;
input int    InpSlippagePoints      = 20;
input string InpSymbolPrefix        = "";
input string InpSymbolSuffix        = "";

input group "=== Live Panel ==="
input bool             InpShowPanel   = true;
input bool             InpCompact     = false;
input ENUM_BASE_CORNER InpCorner      = CORNER_LEFT_UPPER;
input int              InpPanelX      = 16;
input int              InpPanelY      = 22;
input int              InpPanelWidth  = 380;

#define SBP "SB20_"
#define MAX_PENDING 32

CTrade trade;
int g_socket=INVALID_HANDLE;
string g_rx="";
ulong g_lastConnectTry=0;
ulong g_lastHb=0;
bool g_compact=false;
string g_lastSignal="WAITING";
string g_lastExecution="NO COMMAND";
string g_lastTicket="-";
string g_pendingTag[MAX_PENDING];
string g_pendingId[MAX_PENDING];

color C_BG=C'9,15,25',C_BG2=C'15,25,42',C_BORDER=C'43,65,93',C_TEXT=C'234,245,255';
color C_MUTED=C'139,160,184',C_CYAN=C'82,215,255',C_GREEN=C'69,213,161',C_AMBER=C'243,189,98',C_RED=C'255,111,125';

string N64(long v){return IntegerToString(v);}
string F2(double v){return DoubleToString(v,2);}
string Safe(string s){StringReplace(s,"|","/");StringReplace(s,"\r"," ");StringReplace(s,"\n"," ");return s;}

int CountMyPositions()
{
 int n=0;
 for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t>0&&PositionSelectByTicket(t)&&PositionGetInteger(POSITION_MAGIC)==InpMagic)n++;}
 return n;
}

string MarginMode()
{
 long m=AccountInfoInteger(ACCOUNT_MARGIN_MODE);
 if(m==ACCOUNT_MARGIN_MODE_RETAIL_HEDGING)return "HEDGING";
 if(m==ACCOUNT_MARGIN_MODE_RETAIL_NETTING)return "NETTING";
 if(m==ACCOUNT_MARGIN_MODE_EXCHANGE)return "EXCHANGE";
 return "UNKNOWN";
}

string AccountMode()
{
 long m=AccountInfoInteger(ACCOUNT_TRADE_MODE);
 if(m==ACCOUNT_TRADE_MODE_DEMO)return "DEMO";
 if(m==ACCOUNT_TRADE_MODE_REAL)return "LIVE";
 if(m==ACCOUNT_TRADE_MODE_CONTEST)return "CONTEST";
 return "UNKNOWN";
}

void DeletePanel()
{
 for(int i=ObjectsTotal(0,0,-1)-1;i>=0;i--){string n=ObjectName(0,i,0,-1);if(StringFind(n,SBP)==0)ObjectDelete(0,n);}
}

void Rect(string id,int x,int y,int w,int h,color bg,color border)
{
 string n=SBP+id;if(ObjectFind(0,n)<0)ObjectCreate(0,n,OBJ_RECTANGLE_LABEL,0,0,0);
 ObjectSetInteger(0,n,OBJPROP_CORNER,InpCorner);ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);
 ObjectSetInteger(0,n,OBJPROP_XSIZE,w);ObjectSetInteger(0,n,OBJPROP_YSIZE,h);ObjectSetInteger(0,n,OBJPROP_BGCOLOR,bg);ObjectSetInteger(0,n,OBJPROP_COLOR,border);
 ObjectSetInteger(0,n,OBJPROP_BORDER_TYPE,BORDER_FLAT);ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,n,OBJPROP_HIDDEN,true);
}
void Label(string id,int x,int y,string text,int size,color col,string font="Segoe UI")
{
 string n=SBP+id;if(ObjectFind(0,n)<0)ObjectCreate(0,n,OBJ_LABEL,0,0,0);
 ObjectSetInteger(0,n,OBJPROP_CORNER,InpCorner);ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);
 ObjectSetInteger(0,n,OBJPROP_FONTSIZE,size);ObjectSetInteger(0,n,OBJPROP_COLOR,col);ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_LEFT_UPPER);
 ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,n,OBJPROP_HIDDEN,true);ObjectSetString(0,n,OBJPROP_FONT,font);ObjectSetString(0,n,OBJPROP_TEXT,text);
}
void Button(string id,int x,int y,int w,int h,string text)
{
 string n=SBP+id;if(ObjectFind(0,n)<0)ObjectCreate(0,n,OBJ_BUTTON,0,0,0);
 ObjectSetInteger(0,n,OBJPROP_CORNER,InpCorner);ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);
 ObjectSetInteger(0,n,OBJPROP_XSIZE,w);ObjectSetInteger(0,n,OBJPROP_YSIZE,h);ObjectSetInteger(0,n,OBJPROP_BGCOLOR,C_BG);ObjectSetInteger(0,n,OBJPROP_COLOR,C_MUTED);
 ObjectSetInteger(0,n,OBJPROP_BORDER_COLOR,C_BORDER);ObjectSetInteger(0,n,OBJPROP_FONTSIZE,8);ObjectSetString(0,n,OBJPROP_TEXT,text);ObjectSetString(0,n,OBJPROP_FONT,"Segoe UI");
}

bool AgentConnected(){return g_socket!=INVALID_HANDLE && SocketIsConnected(g_socket);}

bool SendLine(string line)
{
 if(!AgentConnected())return false;
 uchar data[];int n=StringToCharArray(line+"\n",data,0,WHOLE_ARRAY,CP_UTF8);if(n<=1)return false;
 return SocketSend(g_socket,data,(uint)(n-1))==n-1;
}

void SendHello()
{
 string s="HELLO|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+
          F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions());
 SendLine(s);g_lastHb=GetTickCount64();
}
void SendHeartbeat()
{
 string s="HB|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+
          F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions());
 if(SendLine(s))g_lastHb=GetTickCount64();
}
void Receipt(string id,string status,string ticket,long retcode,string detail)
{
 SendLine("RCPT|"+Safe(id)+"|"+Safe(status)+"|"+Safe(ticket)+"|"+N64(retcode)+"|"+Safe(detail));
 g_lastExecution=status+" · "+detail;if(ticket!="")g_lastTicket=ticket;
}

void DisconnectAgent()
{
 if(g_socket!=INVALID_HANDLE){SocketClose(g_socket);g_socket=INVALID_HANDLE;}g_rx="";
}

void EnsureAgent()
{
 if(AgentConnected())return;
 ulong now=GetTickCount64();if(now-g_lastConnectTry<1000)return;g_lastConnectTry=now;
 DisconnectAgent();g_socket=SocketCreate(SOCKET_DEFAULT);if(g_socket==INVALID_HANDLE)return;
 SocketTimeouts(g_socket,100,100);
 if(!SocketConnect(g_socket,InpAgentHost,(uint)InpAgentPort,200)){DisconnectAgent();return;}
 SendHello();
}

string ShortTag(string id){string s=id;StringReplace(s,"-","");return StringSubstr(s,0,12);}
void RegisterPending(string tag,string id)
{
 for(int i=0;i<MAX_PENDING;i++){if(g_pendingId[i]==""||g_pendingTag[i]==tag){g_pendingTag[i]=tag;g_pendingId[i]=id;return;}}
 g_pendingTag[0]=tag;g_pendingId[0]=id;
}
string ResolvePending(string tag)
{
 for(int i=0;i<MAX_PENDING;i++)if(g_pendingTag[i]==tag)return g_pendingId[i];
 return "";
}

string ResolveSymbol(string requested)
{
 string s=InpSymbolPrefix+requested+InpSymbolSuffix;
 if(SymbolSelect(s,true))return s;
 if(SymbolSelect(requested,true))return requested;
 return "";
}

double NormalizeVolume(string sym,double v)
{
 double step=SymbolInfoDouble(sym,SYMBOL_VOLUME_STEP),mn=SymbolInfoDouble(sym,SYMBOL_VOLUME_MIN),mx=SymbolInfoDouble(sym,SYMBOL_VOLUME_MAX);
 if(step<=0||mn<=0||mx<=0)return 0;
 double cap=(InpMaxLot>0?MathMin(mx,InpMaxLot):mx);
 double lots=MathFloor(v/step+1e-9)*step;
 if(lots<mn-1e-9||lots>cap+1e-9)return 0;
 int digits=(int)MathMax(0,MathCeil(-MathLog10(step)));
 return NormalizeDouble(lots,digits);
}

double LotsForRisk(string sym,bool buy,double sl,double riskPct)
{
 if(riskPct<=0)return 0;
 if(riskPct>InpMaxRiskPercent)riskPct=InpMaxRiskPercent;
 MqlTick tick;if(!SymbolInfoTick(sym,tick))return 0;
 double entry=buy?tick.ask:tick.bid,dist=MathAbs(entry-sl);
 double tickSize=SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_SIZE);
 double tickValue=SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_VALUE_LOSS);
 if(tickValue<=0)tickValue=SymbolInfoDouble(sym,SYMBOL_TRADE_TICK_VALUE);
 if(dist<=0||tickSize<=0||tickValue<=0)return 0;
 double riskMoney=AccountInfoDouble(ACCOUNT_BALANCE)*riskPct/100.0;
 double lossPerLot=(dist/tickSize)*tickValue;
 if(riskMoney<=0||lossPerLot<=0)return 0;
 return NormalizeVolume(sym,riskMoney/lossPerLot);
}

bool StopsValid(string sym,bool buy,double sl,double tp)
{
 MqlTick tick;if(!SymbolInfoTick(sym,tick))return false;
 double price=buy?tick.ask:tick.bid,point=SymbolInfoDouble(sym,SYMBOL_POINT);
 int stops=(int)SymbolInfoInteger(sym,SYMBOL_TRADE_STOPS_LEVEL);double minDist=stops*point;
 if(buy){if(sl>=price||tp<=price)return false;if(price-sl<minDist||tp-price<minDist)return false;}
 else{if(sl<=price||tp>=price)return false;if(sl-price<minDist||price-tp<minDist)return false;}
 if(point>0&&InpMaxSpreadPoints>0&&(tick.ask-tick.bid)/point>InpMaxSpreadPoints)return false;
 return true;
}

void HandleCommand(string parts[])
{
 if(ArraySize(parts)<14)return;
 string id=parts[1],mode=parts[2],action=parts[3],side=parts[4],requested=parts[5],volumeMode=parts[6];
 double volumeValue=StringToDouble(parts[7]),referencePrice=StringToDouble(parts[8]),sl=StringToDouble(parts[9]),tp1=StringToDouble(parts[10]),tp2=StringToDouble(parts[11]),tp3=StringToDouble(parts[12]);
 long expiresMs=(long)StringToInteger(parts[13]);
 g_lastSignal=side+" "+requested+" "+volumeMode+" "+DoubleToString(volumeValue,2);

 if((long)TimeGMT()*1000>expiresMs){Receipt(id,"EXPIRED","",0,"command expired");return;}
 if(action!="OPEN"||(side!="BUY"&&side!="SELL")){Receipt(id,"REJECTED","",0,"unsupported command");return;}

 string sym=ResolveSymbol(requested);if(sym==""){Receipt(id,"REJECTED","",0,"symbol not found");return;}
 bool buy=(side=="BUY");MqlTick tick;if(!SymbolInfoTick(sym,tick)){Receipt(id,"REJECTED","",0,"no broker quote");return;}
 double current=buy?tick.ask:tick.bid;
 if(referencePrice>0 && MathAbs(current-referencePrice)/referencePrice*100.0>InpMaxPriceDeviationPct){Receipt(id,"REJECTED","",0,"price deviation too large");return;}
 double lots=(volumeMode=="RISK_PERCENT")?LotsForRisk(sym,buy,sl,volumeValue):NormalizeVolume(sym,volumeValue);
 if(lots<=0){Receipt(id,"REJECTED","",0,"position size invalid or below broker minimum");return;}
 double finalTp=(tp3>0?tp3:(tp2>0?tp2:tp1));
 if(finalTp<=0||!StopsValid(sym,buy,sl,finalTp)){Receipt(id,"REJECTED","",0,"SL/TP/spread validation failed");return;}

 if(mode=="dry_run"){Receipt(id,"PREVIEWED","",0,"preview accepted by MT5");return;}
 if(mode!="demo_execute"){Receipt(id,"REJECTED","",0,"unknown execution mode");return;}
 if(AccountInfoInteger(ACCOUNT_TRADE_MODE)!=ACCOUNT_TRADE_MODE_DEMO){Receipt(id,"ACCOUNT_MISMATCH","",0,"DEMO execution refused on non-demo account");return;}
 if(!InpEnableDemoExecution){Receipt(id,"REJECTED","",0,"enable InpEnableDemoExecution first");return;}
 if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)||!MQLInfoInteger(MQL_TRADE_ALLOWED)){Receipt(id,"REJECTED","",0,"Algo Trading disabled");return;}
 if(CountMyPositions()>=InpMaxOpenTrades){Receipt(id,"REJECTED","",0,"max open trades reached");return;}

 string tag=ShortTag(id);RegisterPending(tag,id);
 trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.SetTypeFillingBySymbol(sym);
 bool ok=buy?trade.Buy(lots,sym,0.0,sl,finalTp,"SB:"+tag):trade.Sell(lots,sym,0.0,sl,finalTp,"SB:"+tag);
 long rc=(long)trade.ResultRetcode();
 if(!ok){Receipt(id,"BROKER_REJECTED","",rc,trade.ResultRetcodeDescription());return;}
 string ticket=N64((long)trade.ResultOrder());
 Receipt(id,"SUBMITTED",ticket,rc,trade.ResultRetcodeDescription());
}

void ProcessLine(string line)
{
 string p[];ushort sep=StringGetCharacter("|",0);int n=StringSplit(line,sep,p);
 if(n>0&&p[0]=="CMD")HandleCommand(p);
}

void PumpAgent()
{
 if(!AgentConnected())return;
 uint readable=SocketIsReadable(g_socket);if(readable==0)return;if(readable>32768)readable=32768;
 uchar buf[];int n=SocketRead(g_socket,buf,readable,2);if(n<=0){DisconnectAgent();return;}
 g_rx+=CharArrayToString(buf,0,n,CP_UTF8);
 for(;;){int pos=StringFind(g_rx,"\n");if(pos<0)break;string line=StringSubstr(g_rx,0,pos);g_rx=StringSubstr(g_rx,pos+1);StringTrimLeft(line);StringTrimRight(line);if(line!="")ProcessLine(line);}
}

void RenderPanel()
{
 if(!InpShowPanel){DeletePanel();return;}
 int x=InpPanelX,y=InpPanelY,w=MathMax(360,InpPanelWidth),h=g_compact?132:300;
 Rect("root",x,y,w,h,C_BG,C_BORDER);Rect("head",x+1,y+1,w-2,44,C_BG2,C_BORDER);
 Label("title",x+12,y+8,"SignalBridge EA · "+_Symbol,10,C_TEXT);
 Label("acct",x+12,y+25,AccountInfoString(ACCOUNT_SERVER)+" · #"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+" · "+MarginMode(),7,C_MUTED,"Consolas");
 Label("conn",x+w-124,y+9,AgentConnected()?"● AGENT LIVE":"● AGENT OFFLINE",8,AgentConnected()?C_GREEN:C_RED,"Consolas");
 Button("compact",x+w-102,y+24,88,17,g_compact?"EXPAND":"COMPACT");

 if(g_compact){
  Label("c1",x+12,y+58,"Equity  "+F2(AccountInfoDouble(ACCOUNT_EQUITY)),9,C_TEXT,"Consolas");
  Label("c2",x+12,y+80,"Last  "+g_lastSignal,9,C_CYAN,"Consolas");
  Label("c3",x+12,y+102,"Exec  "+g_lastExecution,8,C_MUTED,"Consolas");ChartRedraw(0);return;
 }
 int yy=y+58;
 string bal=F2(AccountInfoDouble(ACCOUNT_BALANCE)),eq=F2(AccountInfoDouble(ACCOUNT_EQUITY)),pnl=F2(AccountInfoDouble(ACCOUNT_PROFIT));
 Label("k1",x+12,yy,"BALANCE",7,C_MUTED,"Consolas");Label("v1",x+12,yy+16,bal,11,C_TEXT,"Consolas");
 Label("k2",x+110,yy,"EQUITY",7,C_MUTED,"Consolas");Label("v2",x+110,yy+16,eq,11,C_TEXT,"Consolas");
 Label("k3",x+205,yy,"FLOAT",7,C_MUTED,"Consolas");Label("v3",x+205,yy+16,pnl,11,AccountInfoDouble(ACCOUNT_PROFIT)>=0?C_GREEN:C_RED,"Consolas");
 Label("k4",x+298,yy,"OPEN",7,C_MUTED,"Consolas");Label("v4",x+298,yy+16,IntegerToString(CountMyPositions()),11,C_CYAN,"Consolas");
 yy+=55;Rect("sep",x+12,yy,w-24,1,C_BORDER,C_BORDER);yy+=13;
 Label("l1",x+14,yy,"Latest signal",8,C_MUTED);Label("r1",x+130,yy,g_lastSignal,8,C_CYAN,"Consolas");
 Label("l2",x+14,yy+23,"Execution",8,C_MUTED);Label("r2",x+130,yy+23,g_lastExecution,8,C_TEXT,"Consolas");
 Label("l3",x+14,yy+46,"Ticket",8,C_MUTED);Label("r3",x+130,yy+46,g_lastTicket,8,C_TEXT,"Consolas");
 Label("l4",x+14,yy+69,"Account",8,C_MUTED);Label("r4",x+130,yy+69,AccountMode()+" · "+MarginMode(),8,AccountMode()=="DEMO"?C_GREEN:C_AMBER,"Consolas");
 Label("l5",x+14,yy+92,"Demo execution",8,C_MUTED);Label("r5",x+130,yy+92,InpEnableDemoExecution?"ENABLED":"LOCKED",8,InpEnableDemoExecution?C_AMBER:C_GREEN,"Consolas");
 Rect("foot",x+12,y+h-42,w-24,28,C_BG2,C_BORDER);
 Label("foot_t",x+22,y+h-34,AgentConnected()?"50ms local loop · WebSocket cloud path":"Start Windows Agent on 127.0.0.1",7,AgentConnected()?C_GREEN:C_AMBER,"Consolas");
 ChartRedraw(0);
}

int OnInit()
{
 g_compact=InpCompact;
 trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.LogLevel(LOG_LEVEL_ERRORS);
 int ms=InpTimerMs;if(ms<20)ms=20;if(ms>1000)ms=1000;EventSetMillisecondTimer(ms);
 EnsureAgent();RenderPanel();return INIT_SUCCEEDED;
}
void OnDeinit(const int reason){EventKillTimer();DisconnectAgent();DeletePanel();ChartRedraw(0);}
void OnTick(){}

void OnTimer()
{
 EnsureAgent();PumpAgent();
 if(AgentConnected()&&GetTickCount64()-g_lastHb>2000)SendHeartbeat(); // local only; Windows Agent throttles cloud heartbeat
 RenderPanel();
}

void OnTradeTransaction(const MqlTradeTransaction &trans,const MqlTradeRequest &request,const MqlTradeResult &result)
{
 if(trans.type!=TRADE_TRANSACTION_DEAL_ADD||trans.deal==0)return;
 if(!HistoryDealSelect(trans.deal))return;
 if((long)HistoryDealGetInteger(trans.deal,DEAL_MAGIC)!=InpMagic)return;
 if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(trans.deal,DEAL_ENTRY)!=DEAL_ENTRY_IN)return;
 string comment=HistoryDealGetString(trans.deal,DEAL_COMMENT);if(StringFind(comment,"SB:")!=0)return;
 string tag=StringSubstr(comment,3),id=ResolvePending(tag);if(id=="")return;
 Receipt(id,"FILLED",N64((long)trans.deal),0,"broker deal confirmed");
}

void OnChartEvent(const int id,const long &lparam,const double &dparam,const string &sparam)
{
 if(id==CHARTEVENT_OBJECT_CLICK&&sparam==SBP+"compact"){g_compact=!g_compact;DeletePanel();RenderPanel();}
}
//+------------------------------------------------------------------+
