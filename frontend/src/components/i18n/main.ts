import { translations } from "./i18n";

function setLanguage(lang: string) {
    const texts = translations[lang];
    if (!texts) return;
  
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n!;
      if (texts[key]) {
        el.innerText = texts[key];
      }
    });
  
    localStorage.setItem('lang', lang);
  }
  
  function initLanguage() {
    const savedLang = localStorage.getItem('lang') || 'en';
    setLanguage(savedLang);
  
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = (btn as HTMLElement).dataset.lang!;
        setLanguage(lang);
      });
    });
  }
  
  document.addEventListener('DOMContentLoaded', initLanguage);