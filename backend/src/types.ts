import fastifyWebsocket from '@fastify/websocket';

declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (request: any, reply: any) => Promise<void>;
	}
	interface FastifyRequest {
		userRefresh?: string;
	}
}

export type ChatMsg = {
	type: 'message',
	data: {
		chat_id: number;
		content: string;
		sender_id: number;
		created_at: string;
	};
}

export type ChatConnection = {
	id: number,
	socket: fastifyWebsocket.WebSocket,
};

export type User = {
	id: number;
	username: string;
	display_name: string;
	email: string;
	password: string;
	has2fa: boolean;
	online: boolean;
	last_login: Date;
	totp_secret: string;
	avatar_url: string;
	created_at: Date;
};