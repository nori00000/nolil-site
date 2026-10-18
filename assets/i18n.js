import {syncNewsLanguageLinks} from './news-interest.js';
import {languageCode,localePrefix} from './languages.js';
import {englishCopy} from './i18n-en.js';
export const lang=typeof document!=='undefined'?languageCode(document.documentElement.lang):'ko';
export const prefix=localePrefix(lang);
export const t=text=>lang==='en'?(englishCopy[text]??text):text;

export function syncLanguageLinks(){
 if(syncNewsLanguageLinks(document,location.href))return;
 for(const link of document.querySelectorAll('[data-language-link]')){
  const next=new URL(link.href),here=new URL(location.href);
  for(const key of ['project','role','topic','q']){next.searchParams.delete(key);if(here.searchParams.has(key))next.searchParams.set(key,here.searchParams.get(key));}
  next.searchParams.delete('interest');
  next.hash=here.hash;link.href=next.href;
 }
}
