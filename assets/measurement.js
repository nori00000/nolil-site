// Explicit, optional analytics. 2026-10-10 v11. No successful-signup event.
export const measurementId='G-RQBVMTZLN5';
export const consentKey='hf-analytics-20261010-v11';
export function measurablePath(path){
 return /^\/(?:en\/|zh\/|ja\/|es\/|fr\/)?(?:(?:facts|visit|preparation|introduction|presentation|principles|wiki)\/|projects\/(?:[a-z-]+\/)?)?$/.test(path);
}
export function eventFor(href,origin){
 const url=new URL(href,origin);
 if(url.origin!==origin)return null;
 if(/^\/(?:en\/|zh\/|ja\/|es\/|fr\/)?news\/$/.test(url.pathname))return 'news_interest';
 if(/^\/downloads\/hackerfarm-(introduction|presentation)-(ko|en)_20261010_v09\.(pdf|pptx)$/.test(url.pathname))return 'material_download';
 return null;
}
export function mountMeasurement(w,d){
 const panel=d.querySelector('[data-analytics]');if(!panel)return;
 const allowed=w.location.hostname==='playworkgrow.club'&&measurablePath(w.location.pathname)&&w.top===w.self;
 let active=false,loaded=false;
 const key=consentKey;
 const read=()=>{try{const v=JSON.parse(w.localStorage.getItem(key));return v&&v.expires>Date.now()?v.allowed:null;}catch{return null;}};
 const write=value=>{try{w.localStorage.setItem(key,JSON.stringify({allowed:value,expires:Date.now()+90*86400000}));}catch{}};
 const status=value=>{for(const b of panel.querySelectorAll('[data-analytics-choice]'))b.setAttribute('aria-pressed',String((b.dataset.analyticsChoice==='yes')===value));};
 function enable(){
  active=true;status(true);if(!allowed)return;
  w['ga-disable-'+measurementId]=false;if(loaded)return;
  loaded=true;
  w.dataLayer=w.dataLayer||[];w.gtag=function(){w.dataLayer.push(arguments);};
  w.gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
  w.gtag('js',new Date());
  w.gtag('config',measurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:w.location.origin+w.location.pathname,page_referrer:'',page_title:d.title,cookie_expires:7776000});
  w.gtag('event','page_view',{page_location:w.location.origin+w.location.pathname,page_referrer:'',page_title:d.title});
  const script=d.createElement('script');script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;script.async=true;script.referrerPolicy='no-referrer';d.head.append(script);
 }
 function disable(){
  active=false;w['ga-disable-'+measurementId]=true;status(false);
  for(const cookie of d.cookie.split(';')){const name=cookie.split('=')[0].trim();if(!/^_ga(?:_|$)/.test(name))continue;for(const domain of ['',w.location.hostname,'.'+w.location.hostname])d.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'');}
 }
 for(const button of panel.querySelectorAll('[data-analytics-choice]'))button.addEventListener('click',()=>{const yes=button.dataset.analyticsChoice==='yes';write(yes);yes?enable():disable();});
 w.addEventListener('storage',event=>{if(event.key===key){if(read()===true)enable();else disable();}});
 d.addEventListener('click',event=>{if(!active||!allowed||!loaded)return;const link=event.target.closest?.('a[href]');if(!link)return;const name=eventFor(link.href,w.location.origin);if(name)w.gtag('event',name,{page_location:w.location.origin+w.location.pathname,page_referrer:'',language:d.documentElement.lang});});
 if(read()===true)enable();else if(read()===false)disable();
}
if(typeof window!=='undefined')mountMeasurement(window,document);
