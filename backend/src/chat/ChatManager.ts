import { ChatConnection, ChatMsg } from '../types.js';
import { updateUser } from '../db/queries/user.js';
import { createMessage } from '../db/queries/chat.js';
import { MatchmakingManager } from '../game/MatchmakingManager.js';

export class ChatManager {
	private connections: Map<number, ChatConnection> = new Map(); //stores active players
	private chats: Map<number, number[]> = new Map(); //stores active players for active chats
	private matchmaker: MatchmakingManager

	constructor(matchmaker: MatchmakingManager) {
		this.matchmaker = matchmaker;
		// Initialize the chat manager
	}

	public addConnection(ws: ChatConnection): void {
		const existingConnection = this.connections.get(ws.id);
		if (existingConnection) {
			//console.error(`Connection with id ${ws.id} already exists, closing old one.`);
			this.leave(existingConnection);
		}
		this.connections.set(ws.id, ws);
		ws.socket.on('close', () => {
			this.leave(ws);
			updateUser(ws.id, { status: 'offline' });
		});
		ws.socket.on('error', (err) => {
			this.leave(ws);
			updateUser(ws.id, { status: 'offline' });
		});
		ws.socket.on('message', (msg: string) => {
			const parsedMsg = JSON.parse(msg);
			switch (parsedMsg.type) {
				case 'message':
					// Handle chat message
					const content = parsedMsg.data.content;
					const chatId = parsedMsg.data.chat_id;
					const createdAt = parsedMsg.data.created_at;
					const isInvite = parsedMsg.data.is_invite;
					const expiresAt = parsedMsg.data.expires_at;
					createMessage(chatId, ws.id, content, createdAt, isInvite, expiresAt);
					if (isInvite) {
						this.matchmaker.createLobby(chatId, expiresAt);
					}
					this.forwardMessage(chatId, ws.id, parsedMsg);
					break;
				default:
					//console.error(`Unknown message type: ${parsedMsg.type}`);
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
		if (this.chats.get(chatId)?.includes(ws.id)) {
			//console.error(`Connection with id ${ws.id} already in chat ${chatId}`);
			return;
		}
		this.chats.get(chatId)?.forEach(id => {
			const connection = this.connections.get(id);
			if (connection) {
				connection.socket.send(JSON.stringify({
					type: 'user_joined',
					data: { chat_id: chatId, user_id: ws.id },
				}));
			}
		});
		this.chats.get(chatId)?.push(ws.id);
	}

	public getChatConnection(id: number): ChatConnection | undefined {
		return this.connections.get(id);
	}

	public leave(ws: ChatConnection): void {
		ws.socket.close();
		this.connections.delete(ws.id);
		this.chats.forEach((connections, chatId) => {
			const index = connections.indexOf(ws.id);
			if (index !== -1) {
				connections.splice(index, 1);
				if (connections.length === 0) {
					this.chats.delete(chatId);
				}
			}
			connections.forEach(id => {
				const connection = this.connections.get(id);
				if (connection) {
					connection.socket.send(JSON.stringify({
						type: 'user_left',
						data: { chat_id: chatId, user_id: ws.id },
					}));
				}
			});
		});
	}

	public forwardMessage(chatId: number, senderId: number, msg: ChatMsg): void {
		const msgToSend = {
			type: 'message',
			data: {
				chat_id: chatId,
				content: msg.data.content,
				sender_id: senderId,
				created_at: msg.data.created_at,
				is_invite: msg.data.is_invite,
				expires_at: msg.data.expires_at,
			},
		};
		const chatConnections = this.chats.get(chatId);
		if (chatConnections) {
			chatConnections.forEach(id => {
				if (id === senderId) return;
				const connection = this.connections.get(id);
				if (connection) {
					connection.socket.send(JSON.stringify(msgToSend));
				}
			});
		}
	}
};