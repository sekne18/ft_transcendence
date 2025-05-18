
import { TournamentConnection } from "../tournament/Types.js";
import {PlayerSocket, wsMsg } from "./GameTypes.js";

/* Handles forwarding of filtered messages for tournaments */
export class ProxyPlayer implements PlayerSocket{
	private callbacks: { [key: string]: (data?: any) => void } = {};
	private eventBuffer: { key: string, data: any }[] = [];
	private messageFilter: Map<string, boolean>;
	private playerConnection: TournamentConnection;
	private _id;


	constructor(messageFilter: Map<string, boolean>, playerConnection: TournamentConnection) {
		this._id = playerConnection.id;
		this.messageFilter = messageFilter;
		this.playerConnection = playerConnection;
		/* NOT NECESSARY IS HANDLED BY TOURNAMENTMANAGER */
		// this.playerConnection.socket.on("message", (msg: string) => {
		// 	this.onIncoming("message", msg);
		// });
		// this.playerConnection.socket.on("error", (error: Error) => {
		// 	this.onIncoming("error", error);
		// 	this.playerConnection.socket.close();
		// });
		// this.playerConnection.socket.on("close", (event) => {
		// 	this.onIncoming("close", event);
		// 	this.playerConnection.socket.close();
		// });
	}

	get id(): number {
		return this._id;
	}

	private onIncoming(key: string, data: any): void {
		if (this.callbacks[key]) {
			this.callbacks[key](data);
		} else {
			this.eventBuffer.push({ key, data });
		}
	}

	public setMessageFilter(filter: Map<string, boolean>): void {
		this.messageFilter = filter;
	}


	// you have to set the type of the message you don't want to send as key and the value as true
	// for example: { "game_state": true, "game_event": false }
	// this will filter out all game_state messages and send all game_event messages
	// if you want to send a msg type you have to set the value to false or not set it at all
	private filterMessage(msg: string): boolean {
		const parsedMsg = JSON.parse(msg) as wsMsg;
		if (this.messageFilter.has(parsedMsg.type)) {
			return this.messageFilter.get(parsedMsg.type) || false;
		}
		return false;
	}

	public send(msg: string): void {
		if (!this.filterMessage(msg) && this.playerConnection.socket) {
			this.playerConnection.socket.send(msg);
		}
	}

	public on(event: string, callback: (data: any) => void): void {
		this.callbacks[event] = callback;
		if (this.eventBuffer.length > 0) {
			this.eventBuffer.forEach((eventObj) => {
				if (eventObj.key === event) {
					callback(eventObj.data);
				}
			});
			this.eventBuffer = this.eventBuffer.filter((eventObj) => eventObj.key !== event);
		}
	}

	public close(): void {
		this.callbacks = {};
		//this.playerConnection.socket.close();
	}
};
