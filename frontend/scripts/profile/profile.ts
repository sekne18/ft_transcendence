import { createHistory } from "./historyList";


/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initProfile(): void {
    insertData();
    getHistory();
}

function getHistory(): void {
    const users = [
        {
            index: 1, username: "Jan Sekne",
            email: "email@student.s19.be",
            friends: "55",
            role: "Expert",
            start_date: "Joined March 2021",
            location: "Belgium, Antwerpen",
            games_played: "341",
            profile_img: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5"
        },
        {
            index: 2, username: "Flynn Mol",
            email: "email@student.s19.be",
            friends: "55",
            role: "Professional",
            start_date: "Joined April 2025",
            location: "Belgium, Belgium",
            games_played: "73",
            profile_img: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5"
        },
        {
            index: 3, username: "Felix Daems",
            email: "email@student.s19.be",
            friends: "55",
            role: "Amateur",
            start_date: "Joined February 2022",
            location: "Belgium, Lier",
            games_played: "16",
            profile_img: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5"
        },
    ];
    createHistory(users);
}

function insertData(): void {
    const user = {
        username: "Jan Sekne",
        email: "email@student.s19.be",
        friends: "55",
        role: "Amateur",
        start_date: "Joined March 2021",
        location: "Belgium, Antwerpen",
        games_played: "341",
        profile_img: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5"
    };

    if (user.username) {
        const usernameElement = document.getElementById("username");
        if (usernameElement) {
            usernameElement.innerHTML = user.username;
        }
    }

    if (user.profile_img) {
        const usernameElement = document.getElementById("profile_img");
        if (usernameElement) {
            (usernameElement as HTMLImageElement).src = user.profile_img;
        }
    }

    if (user.email) {
        const emailElement = document.getElementById("email");
        if (emailElement) {
            emailElement.innerHTML = user.email;
        }
    }

    if (user.friends) {
        const scoreElement = document.getElementById("friends");
        if (scoreElement) {
            scoreElement.innerHTML = user.friends;
        }
    }

    if (user.games_played) {
        const scoreElement = document.getElementById("games_played");
        if (scoreElement) {
            scoreElement.innerHTML = user.games_played;
        }
    }

    if (user.start_date) {
        const scoreElement = document.getElementById("start_date");
        if (scoreElement) {
            scoreElement.innerHTML = user.start_date;
        }
    }
    if (user.location) {
        const scoreElement = document.getElementById("location");
        if (scoreElement) {
            scoreElement.innerHTML = user.location;
        }
    }
    if (user.role) {
        const scoreElement = document.getElementById("role");
        if (scoreElement) {
            scoreElement.innerHTML = user.role;
        }
    }
}