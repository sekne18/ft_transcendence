/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initChat(): void {
    // open a new websocket connection for chat
    const chatManager = new ChatManager("ws://localhost:8080/api/chat/ws");
    // fetch unread messages (amount of unread messages)
    // /api/chat => returns all chats the user is in
    // /api/chat/<chat_id>/unread-count => returns the amount of unread messages
    //for every chat fetch the first x messages
    // /api/chat/<chat_id>/messages?limit=<x>&before=<timestamp> => returns the first x messages before the timestamp
    // /api/chat/<chat_id>/mark-as-read => mark all messages as read
    //when user scrolls to the top, fetch more messages
    //handle new incoming messages
    chatSocket.addEventListener("message", (event: MessageEvent) => {
        handleIncomingMessage(event);
    });
    //handle sending messages

    console.log("Chat initialized");
    const chatToggle = document.getElementById("chat-toggle") as HTMLButtonElement;
    const chatWindow = document.getElementById("chat-window") as HTMLDivElement;
    chatToggle.classList.remove("invisible");
    //chatToggle.classList.add("transition-all", "duration-300");
    //chatWindow.classList.add("transition-all", "duration-300");

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

class ChatManager {
    private SelectedChatId: number | null = null;
    private ChatSocket: WebSocket;

    constructor(chatUrl: string) {
        this.ChatSocket = new WebSocket(chatUrl);
        this.ChatSocket.addEventListener("message", (event: MessageEvent) => {
            this.handleIncomingMessage(event);
        }
        );
    }

    private createChatListField(chatId: number, displayName: string, avatarUrl: string): HTMLDivElement {
        const chatListField = document.createElement("div");
        chatListField.className = "chat-list-field";
        chatListField.id = `chat-${chatId}`;
        chatListField.addEventListener("click", () => {
            this.SelectedChatId = chatId;
            // Handle chat selection
            console.log(`Selected chat ID: ${chatId}`);
        });
        chatListField.innerHTML = `
            <img src="${avatarUrl}" alt="${displayName}" class="avatar">
            <span class="display-name">${displayName}</span>
        `;
        return chatListField;
    }

    private handleIncomingMessage(event: MessageEvent): void {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);
        // Handle the incoming message here
    }

    private sendMessage(chatSocket: WebSocket, message: string, chat_id: number): void {
        const msg = {
            type: "message",
            data: {
                content: message,
                chat_id: chat_id
            }
        };
        chatSocket.send(JSON.stringify(msg));
    }

}