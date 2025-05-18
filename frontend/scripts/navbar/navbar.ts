import { getElement } from "../utils";

export function setEventHandlers() {
    setupLangDropdown();
    setProfileEvents();
}

function setProfileEvents() {

    const avatar = getElement("user-avatar") as HTMLImageElement;
    const dropdown = getElement("dropdown-menu") as HTMLDivElement;
    const dropdownWrapper = getElement("user-dropdown") as HTMLDivElement;
    const logoutBtn = getElement("logout-btn");

    // Toggle dropdown
    avatar.addEventListener("click", () => {
        dropdown.classList.toggle("hidden");
    });

    // Hide dropdown on outside click
    document.addEventListener("click", (e) => {
        if (!dropdownWrapper.contains(e.target as Node)) {
            dropdown.classList.add("hidden");
        }
    });

    logoutBtn?.addEventListener("click", () => {
        // Your logout logic here
        fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        }).then(() => {
            window.location.href = "/auth";
        });
    });
}

function setupLangDropdown() {
    const button = getElement("langDropdownButton");
    const menu = getElement("langDropdownMenu");

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