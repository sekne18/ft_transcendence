import { ChatConnection, ChatMsg } from '../types.js';
import { updateUser } from '../db/queries/user.js';
import { createMessage } from '../db/queries/chat.js';

export class ChatManager {
	private connections: Map<number, ChatConnection> = new Map(); //stores active players
	private chats: Map<number, number[]> = new Map(); //stores active players for active chats

	constructor() {
		// Initialize the chat manager
	}

	public addConnection(ws: ChatConnection): void {
		this.connections.set(ws.id, ws);
		ws.socket.on('close', () => {
			console.log('Socket closed:', ws.id);
			this.leave(ws.id, ws);
			updateUser(ws.id, { online: false });
		});
		ws.socket.on('error', (err) => {
			console.error('Socket error:', err);
			this.leave(ws.id, ws);
			updateUser(ws.id, { online: false });
		});
		ws.socket.on('message', (msg: string) => {
			const parsedMsg = JSON.parse(msg);
			switch (parsedMsg.type) {
				case 'message':
					// Handle chat message
					const content = parsedMsg.data.content;
					const chatId = parsedMsg.data.chat_id;
					createMessage(chatId, ws.id, content);
					this.forwardMessage(chatId, ws.id, parsedMsg);
					break;
				default:
					console.error(`Unknown message type: ${parsedMsg.type}`);
					break;
			}
		});
	}

	public join(chatId: number, ws: ChatConnection): void {
		if (!this.connections.has(ws.id)) {
			this.connections.set(ws.id, ws);
		}
		if (!this.chats.has(chatId)) {
			this.chats.set(chatId, []);
		}
		this.chats.get(chatId)?.push(ws.id);
	}

	public getChatConnection(id: number): ChatConnection | undefined {
		return this.connections.get(id);
	}

	public leave(chatId: number, ws: ChatConnection): void {
		this.connections.delete(ws.id);
		if (this.chats.has(chatId)) {
			const chatSockets = this.chats.get(chatId);
			if (chatSockets) {
				this.chats.set(chatId, chatSockets.filter(socket => socket !== ws.id));
			}
		}
		if (this.chats.get(chatId)?.length === 0) {
			this.chats.delete(chatId);
		}
	}

	public forwardMessage(chatId: number, senderId: number, msg: ChatMsg): void {
		const chatConnections = this.chats.get(chatId);
		if (chatConnections) {
			chatConnections.forEach(id => {
				if (id === senderId) return;
				const connection = this.connections.get(id);
				if (connection) {
					connection.socket.send(JSON.stringify(msg));
				}
			});
		}
	}
};