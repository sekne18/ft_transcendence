import { loadContent } from "../router/router";
import { getElement } from "../utils";

export function initFriends() {
    onProfileClick();
}

function onProfileClick() {
    const user = 1; // BOT ID
    const button = getElement('friend_btn') as HTMLButtonElement;
    // add event listener
    button.addEventListener('click', () => {
        loadContent(`/profile/${user}`);
    });
}