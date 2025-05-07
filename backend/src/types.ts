declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (request: any, reply: any) => Promise<void>;
	}
	interface FastifyRequest {
		userRefresh?: string;
	}
}