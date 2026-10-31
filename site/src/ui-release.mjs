// Bump with member UI deployments so existing browser caches cannot mix releases.
export const UI_RELEASE='20261031-reference-9';
export function versionUiAssets(html){
 return html.replace(/((?:src|href)=["'])(\/assets\/(?:app\.(?:js|css)|design\.js|i18n\.js|telegram-mini\.js|tailwind\.css))(?:\?[^"']*)?(["'])/g,(_,prefix,path,quote)=>prefix+path+'?v='+UI_RELEASE+quote);
}
