

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initChat(): void {
    // open a new websocket connection for chat
    const chatSocket = new WebSocket("ws://localhost:8080/api/chat/ws");
    // fetch unread messages (amount of unread messages)
    //for every chat fetch the first x messages
    //when user scrolls to the top, fetch more messages
    //handle new incoming messages
    //handle sending messages
    console.log("Chat initialized");
    const chatToggle = document.getElementById("chat-toggle") as HTMLButtonElement;
    const chatWindow = document.getElementById("chat-window") as HTMLDivElement;

    let isOpen = false;

    chatToggle.addEventListener("click", () => {
        isOpen = !isOpen;

        if (isOpen) {
            // Open with bounce animation
            chatWindow.classList.remove("w-0", "h-0", "scale-0");
            chatWindow.classList.add("w-[480px]", "h-[300px]", "animate-grow-bounce");
        } else {
            // Reset to collapsed
            chatWindow.classList.remove("w-[480px]", "h-[300px]", "animate-grow-bounce");
            chatWindow.classList.add("w-0", "h-0", "scale-0");
        }
    });
}