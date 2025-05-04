interface User {
    index: number;
    username: string;
    email: string;
    friends: string;
    role: string;
    start_date: string;
    location: string;
    games_played: string;
    profile_img: string;
}

function createUserListItem(user: User): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "flex items-center gap-4 px-4 py-3";

    li.innerHTML = `
      <div class="text-4xl font-thin text-neutral-400 tabular-nums w-10">
        ${user.index}
      </div>
      <div>
        <img class="w-10 h-10 rounded-md object-cover" src="${user.profile_img}" alt="${user.username}" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="truncate">${user.username}</div>
      </div>
    `;

    return li;
}


export function createHistory(users : User[]) : void {
      const listContainer = document.getElementById('history-list');
      
      if (listContainer) {
        users.forEach(user => {
          const li = createUserListItem(user);
          listContainer.appendChild(li);
        });
      }
}