import './styles.css'
import { languageService } from './scripts/i18n/language';
import { initRouter } from './scripts/router/router';
import { setupLangDropdown } from './scripts/i18n';


// Initial page load
document.addEventListener('DOMContentLoaded', () => {
  languageService.init();
  setupLangDropdown();
  initRouter();
});