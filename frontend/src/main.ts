import './styles.css';
import App from './App';
import { languageService } from './scripts/components/i18n/language';
import { router } from './scripts/components/navbar/router';

document.getElementById('app')!.innerHTML = App();

function setupLangDropdown() {
  const button = document.getElementById("langDropdownButton");
  const menu = document.getElementById("langDropdownMenu");

  if (!button || !menu) return;

  button.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });

  // Close dropdown if user clicks outside
  document.addEventListener("click", (e) => {
    if (!button.contains(e.target as Node) && !menu.contains(e.target as Node)) {
      menu.classList.add("hidden");
    }
  });
}

// Initialize language service
document.addEventListener('DOMContentLoaded', () => {
    languageService.init();
    router.init();
    setupLangDropdown();
  });