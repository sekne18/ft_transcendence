/**
 * Simple router for handling page navigation
 */
export const router = {
    currentPage: 'game',
    
    init(): void {
      // Set initial page (check URL hash or default to game)
      const hash = window.location.hash.replace('#', '') || 'game';
      this.navigateTo(hash);
      
      // Listen for hash changes
      window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#', '');
        this.showPage(page);
      });
      
      // Attach click handlers to navigation links
      this.attachNavListeners();
    },
    
    /**
     * Attach click handlers to navigation links
     */
    attachNavListeners(): void {
      document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click',  (e) => {
          e.preventDefault();
          const page = (link as HTMLElement).dataset.page!;
          this.navigateTo(page);
        });
      });
    },
    
    /**
     * Navigate to a specific page
     */
    navigateTo(page: string): void {
      // Update URL hash
      window.location.hash = page;
      
      // Show the page
      this.showPage(page);
    },
    
    /**
     * Show a specific page and hide others
     */
    showPage(page: string): void {
      if (!['game', 'leaderboard', 'chat'].includes(page)) {
        page = 'game';
      }
      
      this.currentPage = page;
      
      // Hide all pages
      document.querySelectorAll('.page-content').forEach(pageEl => {
        (pageEl as HTMLElement).style.display = 'none';
      });
      
      // Show the selected page
      const selectedPage = document.getElementById(`page-${page}`);
      if (selectedPage) {
        selectedPage.style.display = 'flex';
      }
      
      // Update active state in navigation
      document.querySelectorAll('[data-page]').forEach(link => {
        if ((link as HTMLElement).dataset.page === page) {
          link.classList.add('active-nav-link');
          link.classList.remove('hover:text-blue-500');
          link.classList.add('bg-blue-500');
        } else {
          link.classList.remove('active-nav-link');
          link.classList.remove('bg-blue-500');
          link.classList.add('hover:text-blue-500');
        }
      });
    }
  };