// State checks are deliberately shared by the website and Telegram Mini App.
export function demoReadiness(d,{timedTest=false}={}){
 if(d.license!=='active'||d.agent_status!=='active'||!d.license_unexpired)return 'LICENSE_INACTIVE';
 if(!d.live_socket_verified||!d.terminal_online||!d.fresh)return 'EA_NOT_READY';
 if(d.mt5_mode!=='DEMO')return 'DEMO_ACCOUNT_REQUIRED';
 if(timedTest&&!d.capabilities?.includes('timed-test-v1'))return 'DEMO_TRADE_TEST_REQUIRES_UPDATED_EA';
 return null;
}
export function makeConnectionTest(id,now=Date.now()){
 return {external_signal_id:id,correlation_id:id,action:'TEST',side:'BUY',symbol:'XAUUSD',
 order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:0.01},stop_loss:0,take_profits:[]},
 occurred_at:new Date(now).toISOString(),expires_at:new Date(now+15000).toISOString()};
}
