
export function Navbar() {
    const container = document.createElement("div");

    container.innerHTML = `
    <nav class="flex items-center justify-between bg-gray-800 px-4 py-4 shadow-sm">
      <!-- Navbar Start -->
      <div class="flex items-center">
        <a href="#" class="ml-4 text-xl font-semibold text-white" data-i18n="nav_title"></a>
      </div>

      <!-- Navbar Center (hidden on mobile) -->
      <div class="hidden lg:flex space-x-4">
        <a href="#" class="px-3 py-2 font-bold text-white hover:text-gray-700 rounded" data-i18n="nav_game">Item</a>
        <a href="#" class="px-3 py-2 font-bold text-white hover:text-gray-700 rounded" data-i18n="nav_leaderboard">Item</a>
        <a href="#" class="px-3 py-2 font-bold text-white hover:text-gray-700 rounded" data-i18n="nav_chat">as</a>
      </div>

      <!-- Navbar End -->
      <div class="flex">
        <a href="#" class="inline-block bg-indigo-600 text-white w-12 h-12 rounded-full hover:bg-indigo-700"></a>
      </div>
    </nav>

    `;

    return container.outerHTML;
}

function logout() {
    console.log("Logging out...");
    // Add logout logic
    window.location.href = "/";
}