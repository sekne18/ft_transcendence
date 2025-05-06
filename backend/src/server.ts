import Fastify from 'fastify';
import { createUser, getUserByEmail, getUserById, getUserByUsername } from './db/queries/user.js';
import { initializeDatabase } from './db/schema.js';
import * as argon2 from "argon2";
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { readFile } from 'fs/promises';


const fastify = Fastify({
	logger: true
});

await fastify.register(fastifyCookie);
{

	const privateKey = await readFile('jwtRS256.key', 'utf8');
	const publicKey = await readFile('jwtRS256.key.pub', 'utf8');

	await fastify.register(fastifyJwt, {
		secret: {
			private: privateKey,
			public: publicKey
		},
		sign: {
			algorithm: 'RS256'
		}
	});
}

fastify.decorate('authenticate', async function handler(request: any, reply: any) {
	try {
		await request.jwtVerify();
	} catch (err) {
		return reply.code(301).send({ error: 'Unauthorized' });
	}
});

fastify.post('/api/login', async (req, reply) => {
	const { email, password } = req.body as {
		email: string;
		password: string;
	};

	// Find user by username
	const user = await getUserByEmail(email) as { id: number; email: string; password: string };
	if (!user) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid username or password'
		});
	}

	try {
		if (await argon2.verify(user.password, password)) {
			// password match
			return reply.code(200).send({
				success: true
			});
		} else {
			// password did not match
			return reply.code(401).send({
				success: false,
				message: 'Invalid username or password'
			});
		}
	} catch (err) {
		// internal failure
		return reply.code(500).send({
			success: false,
			message: 'Internal server error'
		});
	}
});

fastify.post('/api/register', async (req, reply) => {
	const { username, email, password, repassword } = req.body as { username: string; email: string; password: string; repassword: string };

	console.log('Password: ', password);
	if (password !== repassword) {
		return reply.code(400).send({
			success: false,
			message: 'Passwords do not match'
		});
	}

	try {
		const hash = await argon2.hash(password);

		const userId = await createUser({
			username,
			email,
			hash,
			avatarUrl: '' // TODO: Replace with actual avatar URL
		});

		if (!userId) {
			return reply.code(400).send({
				success: false,
				message: 'User already exists'
			});
		}

		//TODO: JWT with user ID?
		return reply.send({ success: true }); // ADD token to return
	} catch (err) {
		console.error('Error creating user:', err);
		return reply.code(500).send({
			success: false,
			message: 'Internal server error'
		});
	}
});

fastify.get('/api/user/:id', {
	onRequest: [fastify?.authenticate]
}, async (req, reply) => {
	const { id } = req.query as { id: string };

	// Validate and convert to number
	if (!id || isNaN(Number(id))) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid user ID'
		});
	}

	const user = await getUserById(Number(id));

	// Handle case where user isn't found
	if (!user) {
		return reply.code(404).send({
			success: false,
			message: 'User not found'
		});
	}

	reply.send(user);
});


// Run the server!
try {
	initializeDatabase();
	await fastify.listen({ port: 3000 })
} catch (err) {
	fastify.log.error(err)
	process.exit(1)
}