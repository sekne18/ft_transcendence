import './styles.css'
import { initRouter } from './scripts/router/router';
import { setupLangDropdown } from './scripts/i18n';


// Initial page load
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  setupLangDropdown();
});