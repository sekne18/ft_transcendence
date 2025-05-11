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