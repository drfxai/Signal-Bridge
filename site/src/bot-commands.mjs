// Telegram menu commands contain lowercase letters and underscores only.
// Accept the owner's human-readable /Signal Bridge message as an exact alias.
export function normalizeBotCommand(value){
 const text=String(value||'').trim();
 if(/^\/signal\s+bridge(?:@[a-z0-9_]+)?\s*$/i.test(text)||/^\/signal(?:@[a-z0-9_]+)?\s+bridge\s*$/i.test(text))return '/signalbridge';
 const command=text.split(/\s+/)[0].split('@')[0].toLowerCase();
 return command==='/signal_bridge'?'/signalbridge':command;
}
export const BOT_MENU_COMMANDS=Object.freeze([
 {command:'start',description:'Choose language and open your DrFX account'},
 {command:'language',description:'Change bot language · 6 options'},
 {command:'app',description:'Open Telegram Mini App'},
 {command:'widget',description:'View your private Signal Bridge status widget'},
 {command:'signal',description:'View your last recorded TradingView signal'},
 {command:'scalperwidget',description:'View your private Scalper Pro license summary'},
 {command:'signalbridge',description:'Signal Bridge · Retrieve your private EA license'},
 {command:'scalper',description:'Scalper Pro · Retrieve your own license keys'},
 {command:'login',description:'View your permanent website login code'},
 {command:'resetlogin',description:'Revoke and replace your website login code'},
 {command:'me',description:'View membership status'},
 {command:'code',description:'Retrieve your private EA activation code'},
 {command:'link',description:'Link an already-verified email account'},
 {command:'channels',description:'TradingView webhook for your channel or group'}
]);
