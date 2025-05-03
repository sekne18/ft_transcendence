
export function Navbar() {
    const container = document.createElement("div");
    document.getElementById("menu-button")?.addEventListener("click", () => {
      const menu = document.getElementById("mobile-menu");
      if (menu) menu.classList.toggle("hidden");
    });


    container.innerHTML = `
    <nav class="flex items-center justify-between bg-white px-4 py-2 shadow-sm">
  <!-- Navbar Start -->
  <div class="flex items-center">
    <!-- Mobile Dropdown -->
    <div class="relative lg:hidden">
      <button id="menu-button" class="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      </button>
      <!-- Dropdown menu -->
      <ul id="mobile-menu" class="absolute left-0 z-10 mt-2 w-52 rounded-md bg-white p-2 shadow-lg hidden">
        <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 rounded">Item 1</a></li>
        <li class="relative group">
          <a href="#" class="block px-4 py-2 hover:bg-gray-100 rounded">Parent</a>
          <ul class="ml-4 mt-1 hidden group-hover:block">
            <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 rounded">Submenu 1</a></li>
            <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 rounded">Submenu 2</a></li>
          </ul>
        </li>
        <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 rounded">Item 3</a></li>
      </ul>
    </div>
    <!-- Brand -->
    <a href="#" class="ml-4 text-xl font-semibold text-gray-800">Inception</a>
  </div>

  <!-- Navbar Center (hidden on mobile) -->
  <div class="hidden lg:flex space-x-4">
    <a href="#" class="px-3 py-2 hover:bg-gray-100 rounded">Item 1</a>
    <div class="relative group">
      <button class="px-3 py-2 hover:bg-gray-100 rounded">Parent</button>
      <div class="absolute mt-2 hidden w-40 rounded-md bg-white shadow-lg group-hover:block">
        <a href="#" class="block px-4 py-2 hover:bg-gray-100 rounded">Submenu 1</a>
        <a href="#" class="block px-4 py-2 hover:bg-gray-100 rounded">Submenu 2</a>
      </div>
    </div>
    <a href="#" class="px-3 py-2 hover:bg-gray-100 rounded">Item 3</a>
  </div>

  <!-- Navbar End -->
  <div>
    <a href="#" class="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Button</a>
  </div>
</nav>

    `;

    return container.innerHTML;
}

function logout() {
    console.log("Logging out...");
    // Add logout logic
    window.location.href = "/";
}