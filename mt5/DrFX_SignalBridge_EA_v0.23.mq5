//+------------------------------------------------------------------+
//|                            DrFX_SignalBridge_EA_v0.23.mq5        |
//| Low-latency localhost bridge, replay-safe, DEMO-only execution   |
//+------------------------------------------------------------------+
#property copyright "DrFXAi"
#property link      "https://github.com/drfxai/Signal-Bridge"
#property version   "0.23"
#property strict
#property description "SignalBridge MT5 test EA. Persistent localhost TCP Agent transport."
#property description "DEMO execution only. Live accounts are always refused."
#property description "Add 127.0.0.1 to Tools > Options > Expert Advisors allowed addresses."

#include <Trade\Trade.mqh>

input group "=== SignalBridge Agent ==="
input string InpAgentHost="127.0.0.1";
input int InpAgentPort=17777;
input int InpTimerMs=50;

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

#define SBP "SB23_"
#define MAX_PENDING 32
CTrade trade;
int g_socket=INVALID_HANDLE;
string g_rx="",g_lastSignal="WAITING",g_lastExecution="NO COMMAND",g_lastTicket="-";
ulong g_lastConnectTry=0,g_lastHb=0,g_lastReconcile=0;
bool g_compact=false;
string g_pendingTag[MAX_PENDING],g_pendingId[MAX_PENDING];
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

bool AgentConnected(){return g_socket!=INVALID_HANDLE&&SocketIsConnected(g_socket);}
bool SendLine(string line){if(!AgentConnected())return false;uchar data[];int n=StringToCharArray(line+"\n",data,0,WHOLE_ARRAY,CP_UTF8);if(n<=1)return false;return SocketSend(g_socket,data,(uint)(n-1))==n-1;}
void SendHello(){SendLine("HELLO|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions()));g_lastHb=GetTickCount64();}
void SendHeartbeat(){if(SendLine("HB|"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"|"+Safe(AccountInfoString(ACCOUNT_SERVER))+"|"+AccountMode()+"|"+F2(AccountInfoDouble(ACCOUNT_BALANCE))+"|"+F2(AccountInfoDouble(ACCOUNT_EQUITY))+"|"+IntegerToString(CountMyPositions())))g_lastHb=GetTickCount64();}
bool Receipt(string id,string status,string ticket,long retcode,string detail){bool sent=SendLine("RCPT|"+Safe(id)+"|"+Safe(status)+"|"+Safe(ticket)+"|"+N64(retcode)+"|"+Safe(detail));g_lastExecution=status+" · "+detail;if(ticket!="")g_lastTicket=ticket;return sent;}
void DisconnectAgent(){if(g_socket!=INVALID_HANDLE){SocketClose(g_socket);g_socket=INVALID_HANDLE;}g_rx="";}
void EnsureAgent(){if(AgentConnected())return;ulong now=GetTickCount64();if(now-g_lastConnectTry<1000)return;g_lastConnectTry=now;DisconnectAgent();g_socket=SocketCreate(SOCKET_DEFAULT);if(g_socket==INVALID_HANDLE)return;SocketTimeouts(g_socket,100,100);if(!SocketConnect(g_socket,InpAgentHost,(uint)InpAgentPort,200)){DisconnectAgent();return;}SendHello();}

string PendingFile(){return "SignalBridge_pending_"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+".txt";}
void PendingSave(){int h=FileOpen(PendingFile(),FILE_COMMON|FILE_WRITE|FILE_TXT|FILE_ANSI);if(h==INVALID_HANDLE)return;for(int i=0;i<MAX_PENDING;i++)if(g_pendingId[i]!=""&&g_pendingTag[i]!="")FileWriteString(h,Safe(g_pendingTag[i])+"|"+Safe(g_pendingId[i])+"\r\n");FileFlush(h);FileClose(h);}
void PendingLoad(){for(int i=0;i<MAX_PENDING;i++){g_pendingTag[i]="";g_pendingId[i]="";}int h=FileOpen(PendingFile(),FILE_COMMON|FILE_READ|FILE_TXT|FILE_ANSI);if(h==INVALID_HANDLE)return;int slot=0;while(!FileIsEnding(h)&&slot<MAX_PENDING){string line=FileReadString(h);StringTrimLeft(line);StringTrimRight(line);if(line=="")continue;int p=StringFind(line,"|");if(p<=0)continue;string tag=StringSubstr(line,0,p),id=StringSubstr(line,p+1);if(StringLen(tag)!=12||id=="")continue;g_pendingTag[slot]=tag;g_pendingId[slot]=id;slot++;}FileClose(h);}
bool RegisterPending(string tag,string id){for(int i=0;i<MAX_PENDING;i++){if(g_pendingTag[i]==tag){g_pendingId[i]=id;PendingSave();return true;}}for(int i=0;i<MAX_PENDING;i++){if(g_pendingId[i]==""){g_pendingTag[i]=tag;g_pendingId[i]=id;PendingSave();return true;}}return false;}
string ResolvePending(string tag){for(int i=0;i<MAX_PENDING;i++)if(g_pendingTag[i]==tag)return g_pendingId[i];return "";}
void ClearPending(string tag){bool changed=false;for(int i=0;i<MAX_PENDING;i++)if(g_pendingTag[i]==tag){g_pendingTag[i]="";g_pendingId[i]="";changed=true;}if(changed)PendingSave();}
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
 return false;
}
bool HasAnyPositionOnSymbol(string sym){
 for(int i=0;i<PositionsTotal();i++){ulong t=PositionGetTicket(i);if(t==0||!PositionSelectByTicket(t))continue;if(PositionGetString(POSITION_SYMBOL)==sym)return true;}
 return false;
}
bool HistoryHasTag(string tag,ulong &dealOut){string want="SB:"+tag;if(!HistorySelect(TimeCurrent()-7*86400,TimeCurrent()+60))return false;for(int i=HistoryDealsTotal()-1;i>=0;i--){ulong d=HistoryDealGetTicket(i);if(d==0)continue;if((long)HistoryDealGetInteger(d,DEAL_MAGIC)!=InpMagic)continue;if(StringFind(HistoryDealGetString(d,DEAL_COMMENT),want)==0){dealOut=d;return true;}}return false;}
void ReconcilePending(){if(!AgentConnected()||!HasPending())return;for(int i=0;i<MAX_PENDING;i++){string tag=g_pendingTag[i],id=g_pendingId[i];if(tag==""||id=="")continue;ulong ticket=0;string sym="";double volume=0,open=0,sl=0,tp=0;if(FindPosition(tag,ticket,sym,volume,open,sl,tp)){if(Receipt(id,"FILLED",N64((long)ticket),0,"reconciled open position after terminal restart"))ClearPending(tag);continue;}ulong deal=0;if(HistoryHasTag(tag,deal)){if(Receipt(id,"FILLED",N64((long)deal),0,"reconciled broker history after terminal restart"))ClearPending(tag);}}}
bool DemoGate(string id){if(AccountInfoInteger(ACCOUNT_TRADE_MODE)!=ACCOUNT_TRADE_MODE_DEMO){Receipt(id,"ACCOUNT_MISMATCH","",0,"DEMO execution refused on non-demo account");return false;}if(!InpEnableDemoExecution){Receipt(id,"REJECTED","",0,"enable InpEnableDemoExecution first");return false;}if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)||!MQLInfoInteger(MQL_TRADE_ALLOWED)){Receipt(id,"REJECTED","",0,"Algo Trading disabled");return false;}return true;}

void HandleOpen(string id,string mode,string side,string requested,string tag,string volumeMode,double volumeValue,double referencePrice,double sl,double tp1,double tp2,double tp3,long expiresMs){
 if(expiresMs>0&&(long)TimeGMT()*1000>expiresMs){Receipt(id,"EXPIRED","",0,"command expired");return;}
 if(side!="BUY"&&side!="SELL"){Receipt(id,"REJECTED","",0,"invalid side");return;}
 ulong existing=0;string ps="";double pv=0,po=0,psl=0,ptp=0;if(FindPosition(tag,existing,ps,pv,po,psl,ptp)){Receipt(id,"DUPLICATE",N64((long)existing),0,"position already exists");ClearPending(tag);return;}ulong oldDeal=0;if(HistoryHasTag(tag,oldDeal)){Receipt(id,"DUPLICATE",N64((long)oldDeal),0,"broker history already contains this signal");ClearPending(tag);return;}string unresolved=ResolvePending(tag);if(unresolved!=""){Receipt(id,"ERROR","",0,"unresolved prior broker submission; automatic replay blocked");return;}
 string sym=ResolveSymbol(requested);if(sym==""){Receipt(id,"REJECTED","",0,"symbol not found");return;}bool buy=(side=="BUY");MqlTick tick;if(!SymbolInfoTick(sym,tick)){Receipt(id,"REJECTED","",0,"no broker quote");return;}double current=buy?tick.ask:tick.bid;if(referencePrice>0&&MathAbs(current-referencePrice)/referencePrice*100.0>InpMaxPriceDeviationPct){Receipt(id,"REJECTED","",0,"price deviation too large");return;}
 long marginMode=AccountInfoInteger(ACCOUNT_MARGIN_MODE);
 if((marginMode==ACCOUNT_MARGIN_MODE_RETAIL_NETTING||marginMode==ACCOUNT_MARGIN_MODE_EXCHANGE)&&HasAnyPositionOnSymbol(sym)){Receipt(id,"REJECTED","",0,"netting account already has a position on this symbol; merge risk blocked");return;}
 double lots=(volumeMode=="RISK_PERCENT")?LotsForRisk(sym,buy,sl,volumeValue):NormalizeVolume(sym,volumeValue);if(lots<=0){Receipt(id,"REJECTED","",0,"position size invalid or below broker minimum");return;}double finalTp=(tp3>0?tp3:(tp2>0?tp2:tp1));if(finalTp<=0||!StopsValid(sym,buy,sl,finalTp)){Receipt(id,"REJECTED","",0,"SL/TP/spread validation failed");return;}
 if(mode=="dry_run"){Receipt(id,"PREVIEWED","",0,"preview accepted by MT5");return;}if(mode!="demo_execute"){Receipt(id,"REJECTED","",0,"unknown execution mode");return;}if(!DemoGate(id))return;if(CountMyPositions()>=InpMaxOpenTrades){Receipt(id,"REJECTED","",0,"max open trades reached");return;}
 if(!RegisterPending(tag,id)){Receipt(id,"ERROR","",0,"persistent pending-command ledger is full");return;}trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.SetTypeFillingBySymbol(sym);bool ok=buy?trade.Buy(lots,sym,0.0,sl,finalTp,"SB:"+tag):trade.Sell(lots,sym,0.0,sl,finalTp,"SB:"+tag);long rc=(long)trade.ResultRetcode();if(!ok){if(Receipt(id,"BROKER_REJECTED","",rc,trade.ResultRetcodeDescription()))ClearPending(tag);return;}GlobalVariableSet(GVVol(tag),lots);FlushTradeIdentity();
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
 else if(marginMode==ACCOUNT_MARGIN_MODE_RETAIL_NETTING||marginMode==ACCOUNT_MARGIN_MODE_EXCHANGE){
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

void HandleCommand(string parts[]){
 if(ArraySize(parts)<16)return;string id=parts[1],mode=parts[2],action=parts[3],event=parts[4],side=parts[5],requested=parts[6],tag=parts[7],volumeMode=parts[8];double volumeValue=StringToDouble(parts[9]),referencePrice=StringToDouble(parts[10]),sl=StringToDouble(parts[11]),tp1=StringToDouble(parts[12]),tp2=StringToDouble(parts[13]),tp3=StringToDouble(parts[14]);long expiresMs=(long)StringToInteger(parts[15]);if(StringLen(tag)!=12){Receipt(id,"REJECTED","",0,"invalid correlation tag");return;}g_lastSignal=action+" "+event+" "+side+" "+requested;
 if(action=="OPEN"){HandleOpen(id,mode,side,requested,tag,volumeMode,volumeValue,referencePrice,sl,tp1,tp2,tp3,expiresMs);return;}if(action=="MANAGE"){HandleManage(id,mode,event,tag);return;}Receipt(id,"REJECTED","",0,"unsupported command action");
}
void ProcessLine(string line){string p[];ushort sep=StringGetCharacter("|",0);int n=StringSplit(line,sep,p);if(n>0&&p[0]=="CMD")HandleCommand(p);}
void PumpAgent(){if(!AgentConnected())return;uint readable=SocketIsReadable(g_socket);if(readable==0)return;if(readable>32768)readable=32768;uchar buf[];int n=SocketRead(g_socket,buf,readable,2);if(n<=0){DisconnectAgent();return;}g_rx+=CharArrayToString(buf,0,n,CP_UTF8);for(;;){int pos=StringFind(g_rx,"\n");if(pos<0)break;string line=StringSubstr(g_rx,0,pos);g_rx=StringSubstr(g_rx,pos+1);StringTrimLeft(line);StringTrimRight(line);if(line!="")ProcessLine(line);}}

void RenderPanel(){if(!InpShowPanel){DeletePanel();return;}int x=InpPanelX,y=InpPanelY,w=MathMax(370,InpPanelWidth),h=g_compact?132:300;Rect("root",x,y,w,h,C_BG,C_BORDER);Rect("head",x+1,y+1,w-2,44,C_BG2,C_BORDER);Label("title",x+12,y+8,"SignalBridge EA v0.23 · "+_Symbol,10,C_TEXT);Label("acct",x+12,y+25,AccountInfoString(ACCOUNT_SERVER)+" · #"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+" · "+MarginMode(),7,C_MUTED,"Consolas");Label("conn",x+w-124,y+9,AgentConnected()?"● AGENT LIVE":"● AGENT OFFLINE",8,AgentConnected()?C_GREEN:C_RED,"Consolas");Button("compact",x+w-102,y+24,88,17,g_compact?"EXPAND":"COMPACT");if(g_compact){Label("c1",x+12,y+58,"Equity  "+F2(AccountInfoDouble(ACCOUNT_EQUITY)),9,C_TEXT,"Consolas");Label("c2",x+12,y+80,"Last  "+g_lastSignal,8,C_CYAN,"Consolas");Label("c3",x+12,y+102,"Exec  "+g_lastExecution,8,C_MUTED,"Consolas");ChartRedraw(0);return;}int yy=y+58;Label("k1",x+12,yy,"BALANCE",7,C_MUTED,"Consolas");Label("v1",x+12,yy+16,F2(AccountInfoDouble(ACCOUNT_BALANCE)),11,C_TEXT,"Consolas");Label("k2",x+110,yy,"EQUITY",7,C_MUTED,"Consolas");Label("v2",x+110,yy+16,F2(AccountInfoDouble(ACCOUNT_EQUITY)),11,C_TEXT,"Consolas");Label("k3",x+205,yy,"FLOAT",7,C_MUTED,"Consolas");Label("v3",x+205,yy+16,F2(AccountInfoDouble(ACCOUNT_PROFIT)),11,AccountInfoDouble(ACCOUNT_PROFIT)>=0?C_GREEN:C_RED,"Consolas");Label("k4",x+298,yy,"OPEN",7,C_MUTED,"Consolas");Label("v4",x+298,yy+16,IntegerToString(CountMyPositions()),11,C_CYAN,"Consolas");yy+=68;Label("l1",x+14,yy,"Latest signal",8,C_MUTED);Label("r1",x+130,yy,g_lastSignal,8,C_CYAN,"Consolas");Label("l2",x+14,yy+23,"Execution",8,C_MUTED);Label("r2",x+130,yy+23,g_lastExecution,8,C_TEXT,"Consolas");Label("l3",x+14,yy+46,"Ticket",8,C_MUTED);Label("r3",x+130,yy+46,g_lastTicket,8,C_TEXT,"Consolas");Label("l4",x+14,yy+69,"Account",8,C_MUTED);Label("r4",x+130,yy+69,AccountMode()+" · "+MarginMode(),8,AccountMode()=="DEMO"?C_GREEN:C_AMBER,"Consolas");Label("l5",x+14,yy+92,"Demo execution",8,C_MUTED);Label("r5",x+130,yy+92,InpEnableDemoExecution?"ENABLED":"LOCKED",8,InpEnableDemoExecution?C_AMBER:C_GREEN,"Consolas");Rect("foot",x+12,y+h-42,w-24,28,C_BG2,C_BORDER);Label("foot_t",x+22,y+h-34,AgentConnected()?"50ms local loop · replay-safe cloud path":"Start Windows Agent on 127.0.0.1",7,AgentConnected()?C_GREEN:C_AMBER,"Consolas");ChartRedraw(0);}

int OnInit(){g_compact=InpCompact;PendingLoad();trade.SetExpertMagicNumber(InpMagic);trade.SetDeviationInPoints(InpSlippagePoints);trade.LogLevel(LOG_LEVEL_ERRORS);int ms=InpTimerMs;if(ms<20)ms=20;if(ms>1000)ms=1000;EventSetMillisecondTimer(ms);EnsureAgent();RenderPanel();return INIT_SUCCEEDED;}
void OnDeinit(const int reason){EventKillTimer();DisconnectAgent();DeletePanel();ChartRedraw(0);}
void OnTick(){}
void OnTimer(){EnsureAgent();PumpAgent();ulong now=GetTickCount64();if(AgentConnected()&&now-g_lastHb>2000)SendHeartbeat();if(AgentConnected()&&HasPending()&&now-g_lastReconcile>2000){g_lastReconcile=now;ReconcilePending();}RenderPanel();}
void OnTradeTransaction(const MqlTradeTransaction &trans,const MqlTradeRequest &request,const MqlTradeResult &result){
 if(trans.type!=TRADE_TRANSACTION_DEAL_ADD||trans.deal==0)return;if(!HistoryDealSelect(trans.deal))return;if((long)HistoryDealGetInteger(trans.deal,DEAL_MAGIC)!=InpMagic)return;
 string comment=HistoryDealGetString(trans.deal,DEAL_COMMENT);if(StringFind(comment,"SB:")!=0)return;
 string tag=StringSubstr(comment,3);int colon=StringFind(tag,":");if(colon>0)tag=StringSubstr(tag,0,colon);
 long pid=HistoryDealGetInteger(trans.deal,DEAL_POSITION_ID);if(pid>0){GlobalVariableSet(GVPosId(tag),(double)pid);FlushTradeIdentity();}
 if((ENUM_DEAL_ENTRY)HistoryDealGetInteger(trans.deal,DEAL_ENTRY)!=DEAL_ENTRY_IN)return;
 ulong ticket=0;string sym="";double volume=0,open=0,sl=0,tp=0;if(FindPosition(tag,ticket,sym,volume,open,sl,tp))RememberPositionIdentity(tag,ticket);
 string id=ResolvePending(tag);if(id=="")return;if(Receipt(id,"FILLED",N64((long)trans.deal),0,"broker deal confirmed"))ClearPending(tag);
}
void OnChartEvent(const int id,const long &lparam,const double &dparam,const string &sparam){if(id==CHARTEVENT_OBJECT_CLICK&&sparam==SBP+"compact"){g_compact=!g_compact;DeletePanel();RenderPanel();}}
//+------------------------------------------------------------------+
