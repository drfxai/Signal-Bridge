// DrFX SignalBridge broker-deal replay v1.
// Include from the EA after RiskHash, CloudConnected, LicenseReady, SendLine and N64.
// Opt-in only: does not send raw broker comments, credentials or alter orders.
long g_dealAckMs=0,g_dealBatchMs=0;
ulong g_dealAckTicket=0,g_dealBatchTicket=0,g_dealLastTry=0;
int g_dealBatchCount=0;
string g_dealBatchId="",g_dealBatchLine="";
string DealCursorFile(){return "SignalBridge_deals_"+N64(AccountInfoInteger(ACCOUNT_LOGIN))+"_"+StringFormat("%08X",RiskHash(AccountInfoString(ACCOUNT_SERVER)))+".csv";}
void DealCursorLoad(){
 int days=InpDealHistoryDays;if(days<1)days=1;if(days>90)days=90;
 g_dealAckMs=((long)TimeCurrent()-days*86400)*1000;g_dealAckTicket=0;
 int f=FileOpen(DealCursorFile(),FILE_COMMON|FILE_READ|FILE_CSV,',');
 if(f!=INVALID_HANDLE){
  string stamp=FileReadString(f),ticket=FileReadString(f);FileClose(f);
  long ms=StringToInteger(stamp);
  if(ms>g_dealAckMs&&ms<(long)TimeCurrent()*1000+172800000){g_dealAckMs=ms;g_dealAckTicket=(ulong)StringToInteger(ticket);}
 }
}
void DealCursorSave(){
 int f=FileOpen(DealCursorFile(),FILE_COMMON|FILE_WRITE|FILE_CSV,',');
 if(f==INVALID_HANDLE){Print("SignalBridge deals: unable to save cursor; duplicate replay remains safe.");return;}
 FileWrite(f,N64(g_dealAckMs),N64((long)g_dealAckTicket));FileFlush(f);FileClose(f);
}
string DealSignalTag(ulong deal,long pid){
 string note=HistoryDealGetString(deal,DEAL_COMMENT);
 if(StringFind(note,"SB:")==0&&StringLen(note)>=15)return StringSubstr(note,3,12);
 for(int i=GlobalVariablesTotal()-1;i>=0;i--){
  string key=GlobalVariableName(i);
  if(StringFind(key,"SBP_")!=0||StringLen(key)!=16)continue;
  if((long)GlobalVariableGet(key)==pid)return StringSubstr(key,4,12);
 }
 return "-";
}
void SendDealBatch(){
 if(!InpEnableDealHistory||!CloudConnected()||!LicenseReady())return;
 ulong now=GetTickCount64();if(g_dealLastTry>0&&now-g_dealLastTry<15000)return;
 g_dealLastTry=now;
 if(g_dealBatchId!=""){SendLine(g_dealBatchLine);return;}
 int days=InpDealHistoryDays;if(days<1)days=1;if(days>90)days=90;
 long oldest=(long)TimeCurrent()-days*86400;
 if(!HistorySelect((datetime)MathMax(oldest,g_dealAckMs/1000-2),TimeCurrent()))return;
 string rows="";int count=0;long lastMs=0;ulong lastTicket=0;
 for(int i=0;i<HistoryDealsTotal()&&count<8;i++){
  ulong deal=HistoryDealGetTicket(i);if(deal==0)continue;
  long typ=HistoryDealGetInteger(deal,DEAL_TYPE);
  if(typ!=DEAL_TYPE_BUY&&typ!=DEAL_TYPE_SELL)continue;
  long ms=HistoryDealGetInteger(deal,DEAL_TIME_MSC);
  if(ms<g_dealAckMs||(ms==g_dealAckMs&&deal<=g_dealAckTicket))continue;
  long pid=HistoryDealGetInteger(deal,DEAL_POSITION_ID),order=HistoryDealGetInteger(deal,DEAL_ORDER);
  if(pid<=0||ms<=0)continue;
  long entry=HistoryDealGetInteger(deal,DEAL_ENTRY);
  string kind=entry==DEAL_ENTRY_IN?"I":entry==DEAL_ENTRY_OUT?"O":entry==DEAL_ENTRY_INOUT?"R":entry==DEAL_ENTRY_OUT_BY?"C":"";
  if(kind=="")continue;
  string symbol=HistoryDealGetString(deal,DEAL_SYMBOL),tag=DealSignalTag(deal,pid);
  string row=N64((long)deal)+","+N64(pid)+","+N64(order)+","+N64(ms)+","+
   (typ==DEAL_TYPE_BUY?"B":"S")+","+kind+","+symbol+","+
   DoubleToString(HistoryDealGetDouble(deal,DEAL_VOLUME),8)+","+
   DoubleToString(HistoryDealGetDouble(deal,DEAL_PRICE),8)+","+
   DoubleToString(HistoryDealGetDouble(deal,DEAL_PROFIT),8)+","+
   DoubleToString(HistoryDealGetDouble(deal,DEAL_COMMISSION),8)+","+
   DoubleToString(HistoryDealGetDouble(deal,DEAL_SWAP),8)+","+
   DoubleToString(HistoryDealGetDouble(deal,DEAL_FEE),8)+","+tag;
  rows+=(count>0?";":"")+row;count++;lastMs=ms;lastTicket=deal;
 }
 if(count==0)return;
 g_dealBatchId=N64((long)TimeCurrent())+"_"+N64((long)lastTicket);
 g_dealBatchMs=lastMs;g_dealBatchTicket=lastTicket;g_dealBatchCount=count;
 g_dealBatchLine="DEAL_BATCH|"+g_dealBatchId+"|"+rows;
 if(StringLen(g_dealBatchLine)>8000){g_dealBatchId="";g_dealBatchLine="";return;}
 SendLine(g_dealBatchLine);
}
void HandleDealBatchAck(string &p[]){
 if(ArraySize(p)<3||p[1]!=g_dealBatchId||g_dealBatchId=="")return;
 if(p[0]=="DEAL_ACK"&&(int)StringToInteger(p[2])==g_dealBatchCount){
  g_dealAckMs=g_dealBatchMs;g_dealAckTicket=g_dealBatchTicket;
  DealCursorSave();g_dealBatchId="";g_dealBatchLine="";g_dealBatchCount=0;g_dealLastTry=0;
 }else if(p[0]=="DEAL_NACK"){
  Print("SignalBridge deal history refused: ",p[2]);g_dealLastTry=GetTickCount64();
 }
}
