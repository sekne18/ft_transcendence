// i18n/language.ts
import { translations } from "./translations";

/**
 * Language service for handling translations
 */
export const languageService = {
  /**
   * Initialize language functionality
   */
  init(): void {
    // Apply saved language from localStorage or default to English
    const savedLang = localStorage.getItem('lang') || 'en';
    this.setLanguage(savedLang);
    
    // Attach event listeners after DOM is ready
    setTimeout(() => {
      this.attachLanguageSwitchers();
    }, 0);
  },
  
  /**
   * Set the active language and apply translations
   */
  setLanguage(lang: string): void {
    const texts = translations[lang];
    if (!texts) return;
    
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n!;
      if (texts[key]) {
        el.innerText = texts[key];
      }
    });
    
    localStorage.setItem('lang', lang);
  },
  
  /**
   * Attach click handlers to language switcher buttons
   */
  attachLanguageSwitchers(): void {
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = (btn as HTMLElement).dataset.lang!;
        this.setLanguage(lang);
      });
    });
  }
};