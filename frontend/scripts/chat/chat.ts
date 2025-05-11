import { ChatMessage } from "./ChatTypes";

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
    //handle sending messages

    console.log("Chat initialized");
    const chatToggle = document.getElementById("chat-toggle") as HTMLButtonElement;
    const chatWindow = document.getElementById("chat-window") as HTMLDivElement;
    chatToggle.classList.remove("invisible");
    //chatToggle.classList.add("transition-all", "duration-300");
    //chatWindow.classList.add("transition-all", "duration-300");
}

class ChatManager {
    private SelectedChatId: number | null = null;
    private SelectedUserId: number | null = null;
    private ChatSocket: WebSocket;
    private isOpen: boolean = false;
    private chatList: HTMLDivElement;
    private chatWindow: HTMLDivElement;
    private messageContainer: HTMLDivElement;
    private chatInput: HTMLInputElement;
    private chatToggle: HTMLButtonElement;
    private chatBadge: HTMLSpanElement;
    private messages: Record<number, ChatMessage[]> = {};
    private newMessages: Record<number, number> = {};

    constructor(chatUrl: string) {
        this.chatList = document.getElementById("chat-items") as HTMLDivElement;
        this.chatWindow = document.getElementById("chat-window") as HTMLDivElement;
        this.messageContainer = document.getElementById("message-container") as HTMLDivElement;
        this.chatInput = document.getElementById("chat-input") as HTMLInputElement;
        this.chatToggle = document.getElementById("chat-toggle") as HTMLButtonElement;
        this.chatBadge = document.getElementById("chat-badge") as HTMLSpanElement;
        this.messageContainer.addEventListener("scroll", () => {
            if (this.messageContainer.scrollTop === 0 && this.SelectedChatId !== null) {
                const firstMessage = this.messageContainer.querySelector("div");
                console.log("firstMessage", firstMessage);
                if (firstMessage) {
                    if (firstMessage.id === "loading-messages") {
                        return;
                    }
                    const firstMessageDate = parseInt((firstMessage.querySelector("span") as HTMLSpanElement).dataset.timestamp || "0");
                    console.log("firstMessageDate", firstMessageDate);
                    this.renderOlderMessages(this.SelectedChatId, firstMessageDate);
                }
            }
        });
        this.chatInput.addEventListener("keydown", (event: KeyboardEvent) => {
            this.handleChatInput(event);
        });
        this.chatToggle.addEventListener("click", () => {
            this.handleChatToggle();
        });
        this.ChatSocket = new WebSocket(chatUrl);
        this.ChatSocket.addEventListener("message", (event: MessageEvent) => {
            this.handleIncomingMessage(event);  
        });
        this.ChatSocket.addEventListener("error", (event: Event) => {
            console.error("WebSocket error:", event);
        });
        this.ChatSocket.addEventListener("close", (event: CloseEvent) => {
            console.log("WebSocket closed:", event);
        });
        this.ChatSocket.addEventListener("open", () => {
            console.log("Chat socket opened");
            this.fetchChatList();
        });
        this.ChatSocket.addEventListener("close", () => {
            console.log("Chat socket closed");
        });

    }

    private createChatItem(chatId: number, displayName: string, avatarUrl: string, userId: number): HTMLLIElement {
        const chatItem = document.createElement("li");
        chatItem.className = "flex items-center justify-between rounded-full";
        chatItem.id = `chat-${chatId}`;
        chatItem.dataset.userId = `${userId}`;
        chatItem.dataset.chatId = `${chatId}`;
        chatItem.innerHTML = `
            <div class="flex items-center space-x-1">
                <a href="http://localhost:5173/api/profile?id=${userId}" target="_blank" class="text-blue-600 hover:underline">
                    <img src="${avatarUrl}" alt="${displayName}" class="w-4 h-4 rounded-full">
                </a>
                <span class="text-sm">${displayName}</span>
            </div>
            <span id="badge-${chatId}" class="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full hidden">0</span>
        `;
        chatItem.addEventListener("click", () => {
            this.selectChat(chatId);
        });
        return chatItem;
    }

    private async fetchChatList(): Promise<void> {
        const response = await fetch("/api/chat");
        if (response.ok) {
            const chats = (await response.json() as any).chats;
            console.log("Fetched chat list:", chats);
            if (chats.length === 0) {
                console.log("No chats found");
                return;
            }
            chats.forEach((chat: { chat_id: number; user_id: number, display_name: string, avatar_url: string }) => {
                this.addChat(chat.chat_id, chat.display_name, chat.avatar_url, chat.user_id);
                this.fetchUnreadCount(chat.chat_id).then((count: number) => {
                    this.updateChatBadges(chat.chat_id, count);
                }).catch((error) => {
                    console.error(`Error updating unread count for chat ${chat.chat_id}:`, error);
                });
            });
        } else {
            console.error("Failed to fetch chat list");
        }
    }

    private updateChatBadges(chatId: number, count: number): void {
        console.log("Updating chat badges for chat ID:", chatId, "with count:", count);
        const badge = document.getElementById(`badge-${chatId}`);
        if (badge) {
            if (count > 0) {
                badge.classList.remove("hidden");
                badge.textContent = count.toString();
            } else {
                badge.classList.add("hidden");
                badge.textContent = "";
            }
        } else {
            console.error("Badge not found for chat ID:", chatId);
            return;
        }
        this.newMessages[chatId] = count;
        const totalUnreadCount = Object.values(this.newMessages).reduce((acc, count) => acc + count, 0);
        if (totalUnreadCount > 0) {
            this.chatBadge.classList.remove("hidden");
            this.chatBadge.textContent = totalUnreadCount.toString();
        } else {
            this.chatBadge.classList.add("hidden");
            this.chatBadge.textContent = "";
        }
    }

    private createMessageElement(message: ChatMessage, other: boolean): HTMLDivElement {
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `flex items-center ${other ? "justify-end" : "justify-start"} mb-2`;
        const messageElement = document.createElement("div");
        messageElement.className = `flex flex-col max-w-[70%] ${other ? "text-right" : "text-left"}`;
        const dateElement = document.createElement("span");
        dateElement.className = "text-[10px] text-gray-400 mb-1";
        dateElement.dataset.timestamp = `${message.created_at}`;
        dateElement.textContent = new Date(message.created_at).toLocaleString();
        const messageContent = document.createElement("div");
        messageContent.className = `text-sm ${other ? "bg-green-100" : "bg-blue-100"} rounded p-2`;
        messageContent.textContent = `${message.content}`;
        messageElement.appendChild(dateElement);
        messageElement.appendChild(messageContent);
        msgWrapper.appendChild(messageElement);
        return msgWrapper;
    }

    private async fetchMessages(chatId: number, before?: number): Promise<ChatMessage[] | null> {
        console.log("Fetching messages for chat ID:", chatId);
        const date = before ? before : Date.now();
        const response = await fetch(`/api/chat/${chatId}/messages?limit=10&before=${date}`);
        if (response.ok) {
            const data = await response.json();
            return data.messages.map((message: any) => ({
                chat_id: message.chat_id,
                content: message.content,
                sender_id: message.sender_id,
                created_at: message.created_at
            })) as ChatMessage[];
        } else {
            console.error("Failed to fetch chat messages");
            return null;
        }
    }

    private setLoadingElement(hide: boolean, text: string): HTMLDivElement {
        let loadingElement = this.messageContainer.querySelector("#loading-messages") as HTMLDivElement;
        if (loadingElement && hide) {
            loadingElement.classList.add("hidden");
        }
        if (loadingElement && !hide) {
            loadingElement.classList.remove("hidden");
            loadingElement.textContent = text;
            return loadingElement;
        }
        loadingElement = document.createElement("div");
        loadingElement.id = "loading-messages";
        loadingElement.className = "text-gray-500 text-center";
        loadingElement.textContent = text;
        this.messageContainer.insertAdjacentElement("afterbegin", loadingElement);
        return loadingElement;
    }

    private renderMessages(chatId: number): void {
        const chatMessages = this.messages[chatId];
        console.log("chatMessages", chatMessages);
        if (!chatMessages || chatMessages.length === 0) {
            this.setLoadingElement(false, "Loading messages...");
            this.fetchMessages(chatId).then((data) => {
                if (data) {
                    if (data.length === 0) {
                        this.setLoadingElement(false, "Beginning of this chat.");
                        return;
                    }
                    this.messages[chatId] = data;
                    this.renderMessages(chatId);
                } else {
                    this.setLoadingElement(false, "Error loading messages");
                }
            }
            ).catch((error) => {
                console.error("Error fetching messages:", error);
                this.setLoadingElement(false, "Error loading messages");
            }
            );
        } else {
            this.messageContainer.innerHTML = "";
            chatMessages.forEach((message) => {
                console.log("creating message element", message.sender_id, this.SelectedUserId);
                const messageElement = this.createMessageElement(message, message.sender_id === this.SelectedUserId);
                this.messageContainer.insertAdjacentElement("afterbegin", messageElement);
            });
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
    }

    private renderOlderMessages(chatId: number, before: number): void {
        const loadingElement = this.setLoadingElement(false, "Loading older messages...");
        console.log("Loading older messages before", before, new Date(before).toISOString());
        this.fetchMessages(chatId, before).then((messages) => {
            console.log("Fetched older messages:", messages);
            if (messages) {
                if (messages.length === 0) {
                    loadingElement.textContent = "Beginning of this chat.";
                    return;
                }
                messages.forEach((message) => {
                    if (!this.messages[chatId]) {
                        this.messages[chatId] = [];
                    }
                    this.messages[chatId].push(message);
                });
                const prevScrollHeight = this.messageContainer.scrollHeight;
                this.renderMessages(chatId);
                const newScrollHeight = this.messageContainer.scrollHeight;
                const scrollDiff = newScrollHeight - prevScrollHeight;
                this.messageContainer.scrollTop = scrollDiff;
            }
            else {
                loadingElement.textContent = "Error fetching older messages";
            }
        }).catch((error) => {
            console.error("Error fetching older messages:", error);
            loadingElement.textContent = "Error loading older messages";
        }
        );
    }
        

    private async fetchUnreadCount(chatId: number): Promise<number> {
        const response = await fetch(`/api/chat/${chatId}/unread-count`);
        if (response.ok) {
            const data = await response.json();
            console.log("Fetched unread count:", data.count);
            return data.count;
        } else {
            console.error("Failed to fetch unread count");
            return 0;
        }
    }

    private addChat(chatId: number, displayName: string, avatarUrl: string, userId: number): HTMLLIElement {
        const chatItem = this.createChatItem(chatId, displayName, avatarUrl, userId);
        this.chatList.appendChild(chatItem);
        return chatItem;
    }

    private removeChat(chatId: number): void {
        const chatItem = document.getElementById(`chat-${chatId}`);
        if (chatItem) {
            this.chatList.removeChild(chatItem);
        }
    }

    private selectChat(chatId: number): void {
        this.SelectedChatId = chatId;
        this.SelectedUserId = parseInt((this.chatList.querySelector(`#chat-${chatId}`) as HTMLElement)?.dataset.userId || "0");
        const chatItems = this.chatList.querySelectorAll("li");
        chatItems.forEach((item) => {
            item.classList.remove("bg-gray-200");
        });
        const selectedItem = document.getElementById(`chat-${chatId}`);
        if (selectedItem) {
            selectedItem.classList.add("bg-gray-200");
        }
        this.chatInput.focus();
        this.renderMessages(chatId);
        // Mark messages as read
        this.markMessagesAsRead(chatId);
        this.updateChatBadges(chatId, 0);
    }

    private markMessagesAsRead(chatId: number): void {
        fetch(`/api/chat/${chatId}/mark-as-read`, {
            method: "POST"
        }).then((response) => {
            if (response.ok) {
                console.log("Marked messages as read for chat ID:", chatId);
            } else {
                console.error("Failed to mark messages as read");
            }
        }).catch((error) => {
            console.error("Error marking messages as read:", error);
        });
    }

    private handleChatInput(event: KeyboardEvent): void {
        if (event.key === "Enter" && this.SelectedChatId !== null) {
            const message = this.chatInput.value;
            if (message.trim() !== "") {
                this.sendMessage(this.ChatSocket, message, this.SelectedChatId);
                this.chatInput.value = "";
            }
        }
    }

    private handleChatToggle(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.chatWindow.classList.remove("w-0", "h-0", "scale-0");
            this.chatWindow.classList.add("w-[480px]", "h-[300px]", "animate-grow-bounce");
            this.renderChatWindow();
        } else {
            this.chatWindow.classList.remove("w-[480px]", "h-[300px]", "animate-grow-bounce");
            this.chatWindow.classList.add("w-0", "h-0", "scale-0");
        }
    }

    private renderChatWindow(): void {
        if (this.SelectedChatId !== null) {
            this.selectChat(this.SelectedChatId);
        }
    }

    private handleIncomingMessage(event: MessageEvent): void {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);
        // Handle the incoming message here
        switch (message.type) {
            case "message":
                this.handleNewMessage(message.data);
                break;
            default:
                console.error("Unknown message type:", message.type);
                break;
        }
    }

    private handleNewMessage(data: { content: string; chat_id: number, sender_id: number, created_at: number}): void {
        const chatId = data.chat_id;
        const message: ChatMessage = {
            chat_id: chatId,
            content: data.content,
            sender_id: data.sender_id,
            created_at: data.created_at
        };
        if (!this.messages[chatId]) {
            this.messages[chatId] = [];
        }
        this.messages[chatId].unshift(message);
        if (!(this.SelectedChatId === chatId && this.isOpen)) {
            this.updateChatBadges(chatId, this.newMessages[chatId] + 1);
        }
        else {
            this.renderMessages(chatId);
            this.markMessagesAsRead(chatId);
        }
    }

    private sendMessage(chatSocket: WebSocket, message: string, chat_id: number): void {
        const msgObj: ChatMessage = {
            chat_id: chat_id,
            content: message,
            sender_id: 0, // Replaced with actual sender ID on backend
            created_at: Date.now()
        };
        console.log("Sending message at", new Date(msgObj.created_at).toISOString());
        const msg = {
            type: "message",
            data: msgObj
        };
        chatSocket.send(JSON.stringify(msg));
        if (!this.messages[chat_id]) {
            this.messages[chat_id] = [];
        }
        this.messages[chat_id].unshift(msgObj);
        this.renderMessages(chat_id);
    }

}