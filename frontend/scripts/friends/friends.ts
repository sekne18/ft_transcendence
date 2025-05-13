import { FriendListPlayer, renderFriendslist } from "./friendsList";

export function initFriends() {
    console.log("Friends page initialized");
    getData();
    setupTabs();
}

function setupTabs(): void{

    const friendslist_nav_buttons = document.querySelectorAll<HTMLButtonElement>('#tabs button');

    friendslist_nav_buttons.forEach((button) => {
        
        button.addEventListener('click', () => {
          // Remove active styles from all buttons
          friendslist_nav_buttons.forEach((btn) => {
            btn.classList.remove('bg-gray-600', 'bg-green-600', 'bg-yellow-600', 'bg-red-600', 'text-white');
      
            // Reset to default text color
            btn.classList.add('text-gray-500', 'dark:text-gray-300');
          });
      
          // Apply active styles to the clicked button
          const tab = button.getAttribute('data-tab');
          if (tab === 'all_friends') {
            button.classList.add('bg-gray-600');
          } else if (tab === 'online') {
            button.classList.add('bg-green-600');
          } else if (tab === 'pending') {
            button.classList.add('bg-yellow-600');
          } else if (tab === 'blocked') {
            button.classList.add('bg-red-600');
          }
      
          button.classList.remove('text-gray-500', 'dark:text-gray-300');
          button.classList.add('text-white');
        });
    });
    document.querySelector<HTMLButtonElement>('#tabs button[data-tab="all_friends"]')?.click();
}




async function getData(): Promise<void> {
  try {
      const response = await fetch('/api/friends', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              // Add authorization headers if needed (e.g., for JWT tokens)
              //'Authorization': `Bearer ${yourToken}`
          },
      });

      if (!response.ok) {
          throw new Error('Failed to fetch friends data');
      }

      const friendsListData: FriendListPlayer[] = await response.json();
      console.log(friendsListData);

      renderFriendslist(friendsListData); // Call the render function with the fetched data
  } catch (error) {
      console.error('Error fetching friends list:', error);
  }
}