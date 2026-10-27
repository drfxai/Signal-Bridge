//+------------------------------------------------------------------+
//|                                      DrFX_SignalBridge_EA.mq5    |
//|          SignalBridge MT5 live panel / telemetry foundation      |
//+------------------------------------------------------------------+
#property copyright "DrFXAi"
#property link      "https://github.com/drfxai/Signal-Bridge"
#property version   "0.10"
#property strict
#property description "SignalBridge MT5 live chart panel and telemetry foundation."
#property description "Trade transport/execution is intentionally disabled in this milestone."

input group "=== SignalBridge UI ==="
input bool             InpShowPanel    = true;
input bool             InpCompactPanel = false;
input ENUM_BASE_CORNER InpPanelCorner  = CORNER_LEFT_UPPER;
input int              InpPanelX       = 16;
input int              InpPanelY       = 22;
input int              InpPanelWidth   = 356;
input int              InpRefreshMs    = 500;

input group "=== Future transport (not active yet) ==="
input string InpEndpoint      = "";
input string InpAgentKey      = "";
input bool   InpEnableTrading = false;
input long   InpMagic         = 770425;

#define SB_PREFIX "SBP_"
#define SB_EVENT_ROWS 4

struct SBTheme
{
   color bg;
   color bg2;
   color border;
   color text;
   color muted;
   color cyan;
   color green;
   color amber;
   color red;
};

SBTheme g_theme;
bool g_compact=false;
string g_lastSignal="WAITING FOR SIGNALBRIDGE";
string g_lastExecution="TRANSPORT NOT CONNECTED";
string g_lastPosition="NO SIGNALBRIDGE POSITION";
string g_lastRisk="LOCAL UI READY";
string g_events[SB_EVENT_ROWS];
datetime g_eventTimes[SB_EVENT_ROWS];

string Num(const long v){ return IntegerToString(v); }

string Money(const double v)
{
   string sign=(v>0.0?"+":"");
   return sign+AccountInfoString(ACCOUNT_CURRENCY)+" "+DoubleToString(v,2);
}

string MarginMode()
{
   long mode=AccountInfoInteger(ACCOUNT_MARGIN_MODE);
   if(mode==ACCOUNT_MARGIN_MODE_RETAIL_HEDGING) return "HEDGING";
   if(mode==ACCOUNT_MARGIN_MODE_RETAIL_NETTING) return "NETTING";
   if(mode==ACCOUNT_MARGIN_MODE_EXCHANGE) return "EXCHANGE";
   return "UNKNOWN";
}

string AccountType()
{
   long mode=AccountInfoInteger(ACCOUNT_TRADE_MODE);
   if(mode==ACCOUNT_TRADE_MODE_REAL) return "LIVE";
   if(mode==ACCOUNT_TRADE_MODE_DEMO) return "DEMO";
   if(mode==ACCOUNT_TRADE_MODE_CONTEST) return "CONTEST";
   return "UNKNOWN";
}

int CountPositionsByMagic()
{
   int count=0;
   for(int i=0;i<PositionsTotal();i++)
   {
      ulong ticket=PositionGetTicket(i);
      if(ticket==0 || !PositionSelectByTicket(ticket)) continue;
      if((long)PositionGetInteger(POSITION_MAGIC)==InpMagic) count++;
   }
   return count;
}

void AddEvent(const string text)
{
   for(int i=SB_EVENT_ROWS-1;i>0;i--)
   {
      g_events[i]=g_events[i-1];
      g_eventTimes[i]=g_eventTimes[i-1];
   }
   g_events[0]=text;
   g_eventTimes[0]=TimeCurrent();
}

string EventLine(const int i)
{
   if(i<0 || i>=SB_EVENT_ROWS || g_events[i]=="") return "-";
   return TimeToString(g_eventTimes[i],TIME_SECONDS)+"  "+g_events[i];
}

void InitTheme()
{
   g_theme.bg=C'9,15,25';
   g_theme.bg2=C'15,25,42';
   g_theme.border=C'43,65,93';
   g_theme.text=C'234,245,255';
   g_theme.muted=C'139,160,184';
   g_theme.cyan=C'82,215,255';
   g_theme.green=C'69,213,161';
   g_theme.amber=C'243,189,98';
   g_theme.red=C'255,111,125';
}

void DeletePanel()
{
   int total=ObjectsTotal(0,0,-1);
   for(int i=total-1;i>=0;i--)
   {
      string name=ObjectName(0,i,0,-1);
      if(StringFind(name,SB_PREFIX)==0) ObjectDelete(0,name);
   }
}

void Rect(const string id,const int x,const int y,const int w,const int h,const color bg,const color border)
{
   string name=SB_PREFIX+id;
   if(ObjectFind(0,name)<0) ObjectCreate(0,name,OBJ_RECTANGLE_LABEL,0,0,0);
   ObjectSetInteger(0,name,OBJPROP_CORNER,InpPanelCorner);
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,name,OBJPROP_XSIZE,w);
   ObjectSetInteger(0,name,OBJPROP_YSIZE,h);
   ObjectSetInteger(0,name,OBJPROP_BGCOLOR,bg);
   ObjectSetInteger(0,name,OBJPROP_COLOR,border);
   ObjectSetInteger(0,name,OBJPROP_BORDER_TYPE,BORDER_FLAT);
   ObjectSetInteger(0,name,OBJPROP_BACK,false);
   ObjectSetInteger(0,name,OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0,name,OBJPROP_HIDDEN,true);
   ObjectSetInteger(0,name,OBJPROP_ZORDER,20);
}

void Label(const string id,const int x,const int y,const string text,const int size,const color col,const string font="Segoe UI")
{
   string name=SB_PREFIX+id;
   if(ObjectFind(0,name)<0) ObjectCreate(0,name,OBJ_LABEL,0,0,0);
   ObjectSetInteger(0,name,OBJPROP_CORNER,InpPanelCorner);
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,name,OBJPROP_FONTSIZE,size);
   ObjectSetInteger(0,name,OBJPROP_COLOR,col);
   ObjectSetInteger(0,name,OBJPROP_ANCHOR,ANCHOR_LEFT_UPPER);
   ObjectSetInteger(0,name,OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0,name,OBJPROP_HIDDEN,true);
   ObjectSetInteger(0,name,OBJPROP_ZORDER,30);
   ObjectSetString(0,name,OBJPROP_FONT,font);
   ObjectSetString(0,name,OBJPROP_TEXT,text);
}

void Button(const string id,const int x,const int y,const int w,const int h,const string text)
{
   string name=SB_PREFIX+id;
   if(ObjectFind(0,name)<0) ObjectCreate(0,name,OBJ_BUTTON,0,0,0);
   ObjectSetInteger(0,name,OBJPROP_CORNER,InpPanelCorner);
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,name,OBJPROP_XSIZE,w);
   ObjectSetInteger(0,name,OBJPROP_YSIZE,h);
   ObjectSetInteger(0,name,OBJPROP_BGCOLOR,g_theme.bg);
   ObjectSetInteger(0,name,OBJPROP_COLOR,g_theme.muted);
   ObjectSetInteger(0,name,OBJPROP_BORDER_COLOR,g_theme.border);
   ObjectSetInteger(0,name,OBJPROP_FONTSIZE,8);
   ObjectSetInteger(0,name,OBJPROP_HIDDEN,true);
   ObjectSetInteger(0,name,OBJPROP_ZORDER,40);
   ObjectSetString(0,name,OBJPROP_FONT,"Segoe UI");
   ObjectSetString(0,name,OBJPROP_TEXT,text);
}

void Metric(const string key,const int x,const int y,const string title,const string value,const color col)
{
   Rect("metric_"+key,x,y,78,54,g_theme.bg2,g_theme.border);
   Label("metric_k_"+key,x+8,y+7,title,7,g_theme.muted,"Consolas");
   Label("metric_v_"+key,x+8,y+24,value,10,col,"Consolas");
}

void KV(const string key,const int x,const int y,const string left,const string right,const color col)
{
   Label("kv_l_"+key,x,y,left,8,g_theme.muted);
   Label("kv_r_"+key,x+118,y,right,8,col,"Consolas");
}

void RenderPanel()
{
   if(!InpShowPanel){ DeletePanel(); return; }

   int x=InpPanelX,y=InpPanelY;
   int w=(InpPanelWidth<356?356:InpPanelWidth);
   int h=(g_compact?132:326);

   Rect("root",x,y,w,h,g_theme.bg,g_theme.border);
   Rect("head",x+1,y+1,w-2,44,g_theme.bg2,g_theme.border);

   string broker=AccountInfoString(ACCOUNT_COMPANY);
   string server=AccountInfoString(ACCOUNT_SERVER);
   long login=AccountInfoInteger(ACCOUNT_LOGIN);
   bool termAllowed=(bool)TerminalInfoInteger(TERMINAL_TRADE_ALLOWED);
   bool mqlAllowed=(bool)MQLInfoInteger(MQL_TRADE_ALLOWED);
   bool connected=(bool)TerminalInfoInteger(TERMINAL_CONNECTED);

   Label("title",x+12,y+8,"SignalBridge EA · "+_Symbol,10,g_theme.text);
   Label("account",x+12,y+25,broker+" · #"+Num(login)+" · "+MarginMode(),7,g_theme.muted,"Consolas");
   Label("status",x+w-120,y+10,(connected?"● CONNECTED":"● OFFLINE"),8,(connected?g_theme.green:g_theme.red),"Consolas");
   Button("compact",x+w-98,y+24,82,17,(g_compact?"EXPAND":"COMPACT"));

   if(g_compact)
   {
      Label("compact_eq",x+12,y+59,"Equity  "+Money(AccountInfoDouble(ACCOUNT_EQUITY)),9,g_theme.text,"Consolas");
      double pnl=AccountInfoDouble(ACCOUNT_PROFIT);
      Label("compact_pnl",x+12,y+80,"Floating  "+Money(pnl),9,(pnl>=0?g_theme.green:g_theme.red),"Consolas");
      Label("compact_last",x+12,y+101,"Last  "+g_lastSignal,8,g_theme.cyan,"Consolas");
      ChartRedraw(0);
      return;
   }

   int my=y+56;
   double equity=AccountInfoDouble(ACCOUNT_EQUITY);
   double balance=AccountInfoDouble(ACCOUNT_BALANCE);
   double pnl=AccountInfoDouble(ACCOUNT_PROFIT);

   Metric("equity",x+12,my,"EQUITY",Money(equity),g_theme.text);
   Metric("balance",x+96,my,"BALANCE",Money(balance),g_theme.text);
   Metric("open",x+180,my,"OPEN",Num(CountPositionsByMagic()),g_theme.cyan);
   Metric("pnl",x+264,my,"FLOAT",Money(pnl),(pnl>=0?g_theme.green:g_theme.red));

   int by=my+69;
   KV("signal",x+14,by,"Latest signal",g_lastSignal,g_theme.cyan);
   KV("exec",x+14,by+22,"Execution",g_lastExecution,g_theme.text);
   KV("position",x+14,by+44,"Position",g_lastPosition,g_theme.text);
   KV("risk",x+14,by+66,"Risk gate",g_lastRisk,(InpEnableTrading?g_theme.amber:g_theme.green));
   KV("algo",x+14,by+88,"Algo trading",(termAllowed&&mqlAllowed?"ENABLED":"DISABLED"),(termAllowed&&mqlAllowed?g_theme.green:g_theme.red));
   KV("type",x+14,by+110,"Account",AccountType()+" · "+server,g_theme.muted);

   Rect("events",x+12,by+136,w-24,93,g_theme.bg2,g_theme.border);
   Label("events_title",x+22,by+144,"LIVE TERMINAL EVENTS",7,g_theme.muted,"Consolas");
   for(int i=0;i<SB_EVENT_ROWS;i++)
      Label("event_"+IntegerToString(i),x+22,by+160+i*17,EventLine(i),7,(i==0?g_theme.text:g_theme.muted),"Consolas");

   Label("mode",x+12,y+h-19,
      InpEnableTrading?"TRADING INPUT ON · EXECUTION TRANSPORT NOT IMPLEMENTED":"SAFE UI MILESTONE · ORDER EXECUTION DISABLED",
      7,InpEnableTrading?g_theme.amber:g_theme.green,"Consolas");

   ChartRedraw(0);
}

int OnInit()
{
   InitTheme();
   g_compact=InpCompactPanel;
   AddEvent("Transport milestone pending");
   AddEvent("Account "+Num(AccountInfoInteger(ACCOUNT_LOGIN))+" detected");
   AddEvent("EA UI initialized");
   if(InpEnableTrading) AddEvent("WARNING: execution path is disabled in v0.10");

   int ms=InpRefreshMs;
   if(ms<250) ms=250;
   if(ms>5000) ms=5000;
   EventSetMillisecondTimer(ms);
   RenderPanel();
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   DeletePanel();
   ChartRedraw(0);
}

void OnTimer(){ RenderPanel(); }
void OnTick(){}

void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
{
   string info="Trade event type="+Num((long)trans.type);
   if(result.retcode>0) info+=" retcode="+Num((long)result.retcode);
   AddEvent(info);
   g_lastExecution=info;
   RenderPanel();
}

void OnChartEvent(const int id,const long &lparam,const double &dparam,const string &sparam)
{
   if(id!=CHARTEVENT_OBJECT_CLICK) return;
   if(sparam==SB_PREFIX+"compact")
   {
      g_compact=!g_compact;
      DeletePanel();
      AddEvent(g_compact?"Panel switched to compact mode":"Panel expanded");
      RenderPanel();
   }
}
//+------------------------------------------------------------------+
