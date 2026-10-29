// State checks are deliberately shared by the website and Telegram Mini App.
export function demoReadiness(d,{timedTest=false}={}){
 if(d.license!=='active'||d.agent_status!=='active'||!d.license_unexpired)return 'LICENSE_INACTIVE';
 if(!d.live_socket_verified||!d.terminal_online||!d.fresh)return 'EA_NOT_READY';
 if(d.mt5_mode!=='DEMO')return 'DEMO_ACCOUNT_REQUIRED';
 if(timedTest&&!d.capabilities?.includes('timed-test-v1'))return 'DEMO_TRADE_TEST_REQUIRES_UPDATED_EA';
 return null;
}
export function makeConnectionTest(id,now=Date.now(),account=null,settings=null){
 return {external_signal_id:id,correlation_id:id,action:'TEST',test_account:account,side:'BUY',symbol:settings?.symbol||'XAUUSD',
 order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:settings?.lots??0.01},stop_loss:0,take_profits:[]},
 occurred_at:new Date(now).toISOString(),expires_at:new Date(now+15000).toISOString()};
}

export function testReadiness(d){
 if(d.license!=='active'||d.agent_status!=='active'||!d.license_unexpired)return 'LICENSE_INACTIVE';
 if(!d.live_socket_verified||!d.terminal_online||!d.fresh)return 'EA_NOT_READY';
 if(!['DEMO','LIVE'].includes(d.mt5_mode))return 'UNSUPPORTED_ACCOUNT_MODE';
 const capability=d.mt5_mode==='LIVE'?'live-test-v2':'timed-test-v2';
 if(d.telemetry?.risk?.state==='HIT')return 'DAILY_DRAWDOWN_HIT';
 if(!d.capabilities?.includes(capability))return 'TEST_CAPABILITY_REQUIRED';
 return null;
}
