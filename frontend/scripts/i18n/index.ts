export { languageService } from './language';
export { translations } from './translations';

/* Dropdown language events */
export function setupLangDropdown() {
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