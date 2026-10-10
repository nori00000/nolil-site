export const languages=[['ko','한국어','ko'],['en','English','en'],['zh','中文','zh-Hans'],['ja','日本語','ja'],['es','Español','es'],['fr','Français','fr']];
export const languageCode=value=>value==='zh-Hans'?'zh':languages.some(x=>x[0]===value)?value:'ko';
export const localePrefix=lang=>lang==='ko'?'':'/'+lang;
export function languageMenu(lang,route){
 const current=languages.find(x=>x[0]===lang)||languages[0];
 return `<details class="language-menu"><summary aria-label="${{ko:'언어 선택',en:'Choose language',zh:'选择语言',ja:'言語を選択',es:'Elegir idioma',fr:'Choisir la langue'}[lang]}">${current[1]} <span aria-hidden="true">⌄</span></summary><nav class="language-options" aria-label="${current[1]}">${languages.map(([key,label,code])=>key===lang?`<span aria-current="true" lang="${code}">${label}</span>`:`<a data-language-link href="${localePrefix(key)+route}" hreflang="${code}" lang="${code}">${label}</a>`).join('')}</nav></details>`;
}
