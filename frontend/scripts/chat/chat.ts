import { networkConfig } from "../wsConfig";
import { ChatMessage } from "./ChatTypes";
import { getStatusColor } from "../friends/friendsList";
import { showToast } from "../utils";
import { loadContent } from "../router/router";
import { State } from "../state/State";
import { languageService } from "../i18n";

export let chatManager: ChatManager | null = null;

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initChat(): void {
    // open a new websocket connection for chat
    if (chatManager) {
        return;
    }
    chatManager = new ChatManager(`${networkConfig.wsScheme}://${networkConfig.host}/api/chat/ws`);
    const chatToggle = document.getElementById("chat-toggle") as HTMLButtonElement;
    const chatWindow = document.getElementById("chat-window") as HTMLDivElement;
    chatToggle.classList.remove("invisible");
    //chatToggle.classList.add("transition-all", "duration-300");
    //chatWindow.classList.add("transition-all", "duration-300");
}

class ChatManager {
    private SelectedChatId: number | null = null;
    private SelectedUserId: number | null = null;
    private inviteId: number | null = null;
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
                if (firstMessage) {
                    if (firstMessage.id === "loading-messages") {
                        return;
                    }
                    const firstMessageDate = parseInt((firstMessage.querySelector("span") as HTMLSpanElement).dataset.timestamp || "0");
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
            //console.error("WebSocket error:", event);
        });
        this.ChatSocket.addEventListener("close", (event: CloseEvent) => {
            //console.log("WebSocket closed:", event);
        });
        this.ChatSocket.addEventListener("open", () => {
            this.fetchChatList();
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
                <img id="chat-avatar-${userId}" src="${avatarUrl}" alt="${displayName}" class="w-4 h-4 rounded-full border-2 border-gray-500">
                <span class="text-sm">${displayName}</span>
            </div>
            <span id="badge-${chatId}" class="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full hidden">0</span>
        `;
        chatItem.addEventListener("click", () => {
            this.selectChat(chatId);
        });
        const chatAvatar = chatItem.querySelector(`#chat-avatar-${userId}`) as HTMLImageElement;
        chatAvatar.addEventListener("click", (event) => {
            event.stopPropagation();
            this.handleChatToggle();
            loadContent(`/profile/${userId}`);
        });
        return chatItem;
    }

    private async fetchChatList(): Promise<void> {
        this.chatList = document.getElementById("chat-items") as HTMLDivElement;
        this.chatWindow = document.getElementById("chat-window") as HTMLDivElement;
        this.messageContainer = document.getElementById("message-container") as HTMLDivElement;
        this.chatInput = document.getElementById("chat-input") as HTMLInputElement;
        this.chatToggle = document.getElementById("chat-toggle") as HTMLButtonElement;
        this.chatBadge = document.getElementById("chat-badge") as HTMLSpanElement;
        const response = await fetch("/api/chat");
        if (response.ok) {
            this.chatList.innerHTML = "";
            const chats = (await response.json() as any).chats;
            if (chats.length === 0) {
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
            this.updateOnlineStatus();
        } else {
            console.error("Failed to fetch chat list");
        }
    }

    private updateChatBadges(chatId: number, count: number): void {
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

    private createInviteMessageElement(message: ChatMessage, other: boolean): HTMLDivElement {
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `flex items-center mb-2 justify-center`;
        const messageElement = document.createElement("div");
        messageElement.className = `flex flex-col max-w-[70%] text-center`;
        const dateElement = document.createElement("span");
        dateElement.className = "text-[10px] text-gray-400 mb-1";
        dateElement.dataset.timestamp = `${message.created_at}`;
        dateElement.textContent = new Date(message.created_at).toLocaleString();
        const messageContent = document.createElement("div");
        messageContent.className = `text-sm bg-violet-600 rounded p-2`;
        messageElement.appendChild(dateElement);
        messageElement.appendChild(messageContent);
        msgWrapper.appendChild(messageElement);
        if (!message.expires_at || message.expires_at <= Date.now()) {
            messageContent.textContent = "Invite expired";
            return msgWrapper;
        }
        const inviteBtn = document.createElement("button");
        inviteBtn.className = "bg-blue-500 text-white rounded px-2 py-1";
        inviteBtn.textContent = "Join Lobby";
        inviteBtn.addEventListener("click", () => {
            State.setState('lobby', {
                id: message.chat_id,
                expiresAt: message.expires_at! - Date.now()
            });
            this.handleChatToggle();
            loadContent("/game");
        });
        messageContent.appendChild(inviteBtn);
        const timer = document.createElement("span");
        timer.className = "text-sm text-gray-400 text-white";
        const timeLeft = message.expires_at - Date.now();
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
        timer.textContent = ` ${minutesLeft}:${secondsLeft < 10 ? "0" : ""}${secondsLeft}`;
        messageContent.appendChild(timer);
        if (this.inviteId) {
            clearInterval(this.inviteId!);
        }
        this.inviteId = setInterval(() => {
            const now = Date.now();
            if (message.expires_at && now > message.expires_at) {
                clearInterval(this.inviteId!);
                this.inviteId = null;
                messageContent.textContent = "Invite expired";
            } else {
                const timeLeft = message.expires_at ? message.expires_at - now : 0;
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
                timer.textContent = ` ${minutesLeft}:${secondsLeft < 10 ? "0" : ""}${secondsLeft}`;
            }
        }, 500);
        return msgWrapper;
    }

    private createMessageElement(message: ChatMessage, other: boolean): HTMLDivElement {
        if (message.is_invite) {
            return this.createInviteMessageElement(message, other);
        }
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `flex items-center ${other ? "justify-end" : "justify-start"} mb-2`;
        const messageElement = document.createElement("div");
        messageElement.className = `flex flex-col max-w-[70%] ${other ? "text-right" : "text-left"}`;
        const dateElement = document.createElement("span");
        dateElement.className = "text-[10px] text-gray-400 mb-1";
        dateElement.dataset.timestamp = `${message.created_at}`;
        dateElement.textContent = new Date(message.created_at).toLocaleString();
        const messageContent = document.createElement("div");
        messageContent.className = `text-sm ${other ? "bg-green-600" : "bg-blue-600"} rounded p-2`;
        messageContent.textContent = `${message.content}`;
        messageElement.appendChild(dateElement);
        messageElement.appendChild(messageContent);
        msgWrapper.appendChild(messageElement);
        return msgWrapper;
    }

    private async fetchMessages(chatId: number, before?: number): Promise<ChatMessage[] | null> {
        const date = before ? before : Date.now();
        const response = await fetch(`/api/chat/${chatId}/messages?limit=10&before=${date}`);
        if (response.ok) {
            const data = await response.json();
            return data.messages.map((message: any) => ({
                chat_id: message.chat_id,
                content: message.content,
                sender_id: message.sender_id,
                created_at: message.created_at,
                is_invite: message.is_invite || false,
                expires_at: message.expires_at || null,
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
            loadingElement.textContent = "";
            return loadingElement;
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
                    if (this.messageContainer.scrollHeight <= this.messageContainer.clientHeight && this.SelectedChatId !== null) {
                        const firstMessage = this.messageContainer.querySelector("div");
                        if (firstMessage) {
                            if (firstMessage.id === "loading-messages") {
                                return;
                            }
                            const firstMessageDate = parseInt((firstMessage.querySelector("span") as HTMLSpanElement).dataset.timestamp || "0");
                            this.renderOlderMessages(this.SelectedChatId, firstMessageDate);
                        }
                    }
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
                const messageElement = this.createMessageElement(message, message.sender_id === this.SelectedUserId);
                this.messageContainer.insertAdjacentElement("afterbegin", messageElement);
            });
            if (this.messageContainer.scrollHeight <= this.messageContainer.clientHeight && this.SelectedChatId !== null) {
                const firstMessage = this.messageContainer.querySelector("div");
                if (firstMessage) {
                    if (firstMessage.id === "loading-messages") {
                        return;
                    }
                    const firstMessageDate = parseInt((firstMessage.querySelector("span") as HTMLSpanElement).dataset.timestamp || "0");
                    this.renderOlderMessages(this.SelectedChatId, firstMessageDate);
                }
            }
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
    }

    private renderOlderMessages(chatId: number, before: number): void {
        const loadingElement = this.setLoadingElement(false, "Loading older messages...");
        this.fetchMessages(chatId, before).then((messages) => {
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
        this.messageContainer.innerHTML = "";
        this.setLoadingElement(true, "Loading messages...");
        this.SelectedChatId = chatId;
        this.SelectedUserId = parseInt((this.chatList.querySelector(`#chat-${chatId}`) as HTMLElement)?.dataset.userId || "0");
        const chatItems = this.chatList.querySelectorAll("li");
        chatItems.forEach((item) => {
            item.classList.remove("bg-gray-600");
        });
        const selectedItem = document.getElementById(`chat-${chatId}`);
        if (selectedItem) {
            selectedItem.classList.add("bg-gray-600");
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
            if (!response.ok) {
                console.error("Failed to mark messages as read");
                return;
            }
            //console.log("Marked messages as read for chat ID:", chatId);
        }).catch((error) => {
            //console.error("Error marking messages as read:", error);
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

    private async updateOnlineStatus(): Promise<void> {
        const chatItems = this.chatList.querySelectorAll("li");
        chatItems.forEach((item) => {
            const userId = parseInt(item.dataset.userId || "0");
            fetch(`/api/user/${userId}/status`).then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        const status = data.status;
                        console.log("Status:", status, "for user ID:", userId);
                        const chatAvatar = item.querySelector("img");
                        console.log("Chat Avatar:", chatAvatar);
                        if (chatAvatar) {
                            const [statusColor, statusText] = getStatusColor(status);
                            chatAvatar.classList.remove(
                                "border-gray-500",
                                'border-[#45D483]',
                                'border-[#F4407F]',
                                'border-[#F4A440]',
                            );
                            chatAvatar.classList.add(statusColor);
                        }

                    });
                } else {
                    console.error("Failed to fetch user status");
                }
            });
        });
    }

    public handleChatToggle(open: boolean | null = null): void {
        if (open !== null) {
            this.isOpen = !open;
        }
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.chatWindow.classList.remove("w-0", "h-0", "scale-0");
            this.chatWindow.classList.add("w-[480px]", "h-[300px]", "animate-grow-bounce");
            this.renderChatWindow();
        } else {
            this.SelectedChatId = null;
            this.SelectedUserId = null;
            this.chatWindow.classList.remove("w-[480px]", "h-[300px]", "animate-grow-bounce");
            this.chatWindow.classList.add("w-0", "h-0", "scale-0");
        }
    }

    private renderChatWindow(): void {
        this.messageContainer.innerHTML = "";
        this.fetchChatList();
        this.SelectedChatId === null
        // if (this.SelectedChatId !== null) {
        //     this.selectChat(this.SelectedChatId);
        // }
    }

    private handleIncomingMessage(event: MessageEvent): void {
        const message = JSON.parse(event.data);
        // Handle the incoming message here
        switch (message.type) {
            case "message":
                this.handleNewMessage(message.data);
                break;
            case "user_left":
                this.updateOnlineStatus();
                break;
            case "user_joined":
                this.updateOnlineStatus();
                break;
            case "accepted_game":
                break;
            default:
                console.error("Unknown message type:", message.type);
                break;
        }
    }

    private handleNewMessage(data: { content: string; chat_id: number, sender_id: number, created_at: number, expires_at?: number | null, is_invite: boolean }): void {
        const chatId = data.chat_id;
        const message: ChatMessage = {
            chat_id: chatId,
            content: data.content,
            sender_id: data.sender_id,
            created_at: data.created_at,
            expires_at: data.expires_at || null,
            is_invite: data.is_invite || false,
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
        const isInvite = (message === "/invite");
        if (isInvite && this.inviteId) {
            showToast(languageService.retrieveValue("toast_limit_inv"), languageService.retrieveValue('toast_limit_inv_desc'), "warning");
            return;
        }
        const msgObj: ChatMessage = {
            chat_id: chat_id,
            content: message,
            sender_id: 0, // Replaced with actual sender ID on backend
            created_at: Date.now(),
            expires_at: isInvite ? Date.now() + 10000 : null, // 1 minute expiration for invite links
            is_invite: isInvite,
        };
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