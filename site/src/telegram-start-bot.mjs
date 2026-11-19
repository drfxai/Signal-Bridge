import {onboardingView,widgetText} from './telegram-onboarding.mjs';
import {STAR_PLANS,TELEGRAM_STORE_PLANS,starPlanLabel,starPrice} from './telegram-commerce.mjs';
import {START_COPY,START_LANGUAGES,DOWNLOADS,SUPPORT_URL,COMMUNITY_URL} from './telegram-start.mjs';

const MINI='https://drfx.company/telegram';
const nav=(text,page,style)=>({text,callback_data:'native:'+page,...(style?{style}:{})});
const app=(text,view='',plan='')=>({text,web_app:{url:MINI+(view?'?view='+view:'')+(plan?'&plan='+plan:'')}});
const link=(text,url)=>({text,url});
const planButton=(label,plan,scalper)=>scalper?app(label,'plans',plan):{text:label,callback_data:'stars:'+plan};

export function startBotPage(env,language,page,membership,admin=false){
 const c=START_COPY[language]||START_COPY.en;
 const back=[nav(c.menu,'home')];
 let text,rows;
 switch(page){
  case 'language':
   text=c.language;
   rows=START_LANGUAGES.map(([id,text])=>[{text,callback_data:'lang:'+id,...(id===language?{style:'primary'}:{})}]);
   break;
  case 'onboarding':
   if(membership!=='member'){
    const view=onboardingView(page,language,membership);
    text=[widgetText(language,view.title),widgetText(language,view.subtitle)].filter(Boolean).join('\n\n');
    rows=view.buttons.map(b=>[b.url?link(widgetText(language,b.label),b.url):nav(widgetText(language,b.label),'onboarding','primary')]);
    break;
   }
   // A verified member lands directly on the menu.
  case 'home':
   text='DrFXAi · Signal Bridge\n\n'+c.intro;
   rows=[
    [nav('↓ '+c.downloads,'downloads','primary'),nav('✦ '+c.trial,'free','success')],
    [nav('▤ '+c.setup,'setup'),nav('★ '+c.buy,'shop')],
    [link(c.support,SUPPORT_URL),link(c.community,COMMUNITY_URL)],
    [app(c.portal,'account'),nav(c.language,'language')],
    ...(admin?[[nav(widgetText(language,'Admin Console'),'admin')]]:[])
   ];
   break;
  case 'downloads':
   text=c.downloads+' · MetaTrader 5';
   rows=[[link('Signal Bridge · EX5',DOWNLOADS.signalbridge.url)],[link('Scalper Pro · EX5',DOWNLOADS.scalper.url)],back];
   break;
  case 'free':
   text=c.trial+'\n\n'+c.bridgeTrial+'\n'+c.scalperTrial;
   rows=[[nav(c.getCode,'bridgecode','primary')],[app(c.claim,'trial')],back];
   break;
  case 'setup':
   text=c.setup+'\n\n'+c.steps.map(([title,body],i)=>(i+1)+'. '+title+'\n'+body).join('\n\n');
   rows=[[app(c.portal,'account'),nav(c.downloads,'downloads')],back];
   break;
  case 'shop': {
   const prices=TELEGRAM_STORE_PLANS.map(plan=>[plan,starPrice(env,plan)]);
   text=c.buy+'\n\n'+prices.map(([plan,price])=>starPlanLabel(language,plan)+' · '+(price?price+' ★':c.unavailable)).join('\n');
   rows=[...prices.flatMap(([plan,price])=>price?[[planButton(starPlanLabel(language,plan)+' · '+price+' ★',plan,!!STAR_PLANS[plan].days)]]:[]),[nav(widgetText(language,'My Orders'),'orders:0')],back];
   break;
  }
  default:return null;
 }
 for(const button of rows.flat())if(button.web_app){
  const url=new URL(button.web_app.url);
  url.searchParams.set('lang',language);
  button.web_app.url=url.href;
 }
 return {text,reply_markup:{inline_keyboard:rows},protect_content:true,link_preview_options:{is_disabled:true}};
}
