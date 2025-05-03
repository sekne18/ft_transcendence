
export function Navbar() {
    const container = document.createElement("div");

    container.innerHTML = `
    <div class="flex items-center justify-between bg-white px-4 py-4 shadow-sm">
      <div class="flex items-center">
        <a href="#" class="ml-4 text-xl font-semibold text-white" data-i18n="nav_title"></a>
      </div>
      <div class="flex space-x-4">
        <a href="#" class="px-3 py-2 font-bold text-white hover:text-gray-700 rounded" data-i18n="nav_game">Item</a>
        <a href="#" class="px-3 py-2 font-bold text-white hover:text-gray-700 rounded" data-i18n="nav_leaderboard">Item</a>
        <a href="#" class="px-3 py-2 font-bold text-white hover:text-gray-700 rounded" data-i18n="nav_chat">as</a>
      </div>
      <div class="flex justify-end gap-2 mb-4">
        <button data-lang="en" class="px-2 py-1 bg-blue-500 text-white rounded">EN</button>
        <button data-lang="nl" class="px-2 py-1 bg-blue-500 text-white rounded">NL</button>
        <button data-lang="sl" class="px-2 py-1 bg-blue-500 text-white rounded">SL</button>
      </div>
      <div class="flex">
        <a href="#" class="inline-block bg-indigo-600 text-white w-12 h-12 rounded-full hover:bg-indigo-700"></a>
      </div>
    </div>

    `;

    return container.innerHTML;
}

function logout() {
    console.log("Logging out...");
    // Add logout logic
    window.location.href = "/";
}