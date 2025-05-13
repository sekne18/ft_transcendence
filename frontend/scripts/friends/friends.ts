import { loadContent } from "../router/router";
import { getElement } from "../utils";

export function initFriends() {
    // const user = 1; // Should be BOT
    // // get button
    // const button = getElement('friend_btn') as HTMLButtonElement;
    // // add event listener
    // button.addEventListener('click', () => {
    //     fetch('/api/user/profile', {method: 'POST',
    //         credentials: 'include',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({ id: user }),
    //     }).then((res) => {
    //             if (res.status === 401) {
    //                 window.location.href = '/auth';
    //                 return null;
    //             }
    //             return res.json();
    //         }).then((res) => {
    //             if (res.success) {
    //                 history.pushState(null, '', `/profile/${user}`);
    //                 loadContent(`/profile/${user}`);

    //             } else {
    //                 console.error('Error fetching user profile:', res.message);
    //             }
    //         });
    //     // loadContent('/profile', NOSCRIPT);
    // });

    
}