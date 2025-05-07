import Fastify from 'fastify';
import { createUser, getUserByEmail, getUserById, getUserByUsername, getUserProfileById, updateUser } from './db/queries/user.js';
import { FastifyInstance } from 'fastify';
import { initializeDatabase } from './db/schema.js';
import * as argon2 from "argon2";
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { readFile } from 'fs/promises';
import { getStatsByUserId } from './db/queries/stats.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import './types.ts';

const fastify: FastifyInstance = Fastify({
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
		cookie: {
			cookieName: 'access',
			signed: false,
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
		fastify.log.error('JWT verification failed:', err);
		fastify.log.error('Request headers:', request.headers);
		fastify.log.error('Request body:', request.body);
		fastify.log.error('Request query:', request.query);
		fastify.log.error('Request params:', request.params);
		return reply.code(401).send({ error: 'Unauthorized' });
	}
});

fastify.post('/api/login', async (req, reply) => {
	const { email, password } = req.body as {
		email: string;
		password: string;
	};

	// Find user by username
	const user = await getUserByEmail(email) as { id: number; email: string; password: string; has2fa: boolean; };
	if (!user) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid username or password'
		});
	}

	try {
		if (await argon2.verify(user.password, password)) {
			fastify.log.info('Password verified');
			if (user.has2fa) {
				// Don't authenticate yet — send short-lived temp token
				const tempToken = fastify.jwt.sign(
					{ id: user.id, twoFA: true },
					{ expiresIn: '5m' } // Short-lived token
				);

				return reply.code(200).send({
					success: true,
					twoFA: true,
					tempToken
				});
			}
			const token = fastify.jwt.sign({ id: user.id });
			fastify.log.info('Token generated:', token);
			// password match
			return reply.code(200).setCookie('access', token, {
				httpOnly: true,
				secure: false, // Set to true in production (requires HTTPS)
				maxAge: 15 * 60, // * 60, // 15 min
				sameSite: 'strict'
			}).send({
				success: true,
				twoFA: false
			});
		} else {
			// password did not match
			fastify.log.info('Password did not match');
			return reply.code(401).send({
				success: false,
				message: 'Invalid username or password'
			});
		}
	} catch (err) {
		// internal failure
		fastify.log.error('Error verifying password:', err);
		return reply.code(500).send({
			success: false,
			message: 'Internal server error'
		});
	}
});

fastify.post('/api/2fa/verify', async (req, reply) => {
	const { code } = req.body as { code: string };
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		return reply.code(401).send({ success: false, message: 'Missing temp token' });
	}

	try {
		const payload = fastify.jwt.verify(token) as { id: number, twoFA: boolean };

		if (!payload.twoFA) {
			return reply.code(400).send({ success: false, message: 'Invalid token context' });
		}

		const user = await getUserById(payload.id) as { id: number; totp_secret: string; };
		if (!user || !user.totp_secret) {
			return reply.code(400).send({ success: false, message: '2FA not configured' });
		}

		const valid = speakeasy.totp.verify({
			secret: user.totp_secret,
			encoding: 'base32',
			token: code
		});

		if (!valid) {
			return reply.code(401).send({ success: false, message: 'Invalid 2FA code' });
		}

		const finalToken = fastify.jwt.sign({ id: payload.id });
		return reply.code(200).setCookie('access', finalToken, {
			httpOnly: true,
			secure: false, // Set to true in production (requires HTTPS)
			maxAge: 15, //* 60, // 15 min
			sameSite: 'strict'
		}).send({ success: true });

	} catch (err) {
		fastify.log.error('2FA verification failed:', err);
		return reply.code(401).send({ success: false, message: 'Invalid or expired temp token' });
	}
});

fastify.get('/api/2fa/setup', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const user = await getUserById(id);
	if (!user) return reply.code(404).send({ success: false, message: 'User not found' });

	// Generate a new TOTP secret
	const secret = speakeasy.generateSecret({
		name: 'pongy',
		length: 32
	});

	// Store the base32 secret temporarily (you could store it permanently if you skip confirmation)
	await updateUser(id, { totp_secret: secret.base32 }); // Securely store base32

	// Create QR code from otpauth URL
	const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url as string);

	return reply.send({
		success: true,
		qrCode: qrCodeDataURL,
		secret: secret.base32 // optionally send this if needed for manual entry
	});
});

fastify.post('/api/2fa/confirm', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const { code } = req.body as { code: string };

	const user = await getUserById(id) as { id: number; totp_secret: string; };
	if (!user || !user.totp_secret) {
		return reply.code(400).send({ success: false, message: 'TOTP secret not found' });
	}

	const verified = speakeasy.totp.verify({
		secret: user.totp_secret,
		encoding: 'base32',
		token: code
	});

	if (!verified) {
		return reply.code(401).send({ success: false, message: 'Invalid 2FA code' });
	}

	// Mark 2FA as enabled
	await updateUser(id, { has2fa: true });

	return reply.send({ success: true });
});

fastify.get('/api/auth/status', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	return reply.send({
		success: true,
	});
});

fastify.post('/api/register', async (req, reply) => {
	const { username, email, password, repassword } = req.body as { username: string; email: string; password: string; repassword: string };

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
			display_name: username,
			email,
			hash,
			avatarUrl: 'https://land.campus19.be/wp-content/uploads/2024/08/Design-sans-titre-26-150x150.png' // TODO: Replace with actual avatar URL
		});

		if (!userId) {
			return reply.code(400).send({
				success: false,
				message: 'User already exists'
			});
		}

		return reply.send({ success: true });
	} catch (err) {
		console.error('Error creating user:', err);
		return reply.code(500).send({
			success: false,
			message: 'Internal server error'
		});
	}
});

fastify.post('/api/user/update', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const { display_name, currentPassword, newPassword, confirmPassword, avatarUrl } = req.body as {
		display_name?: string;
		currentPassword?: string;
		newPassword?: string;
		confirmPassword?: string;
		avatarUrl?: string;
	};

	if (!id) {
		return reply.code(400).send({
			success: false,
			message: 'Missing user ID'
		});
	}

	const updateData: Record<string, string> = {};
	
	// Validate the password if provided
	if (currentPassword && newPassword && confirmPassword) {
		console.log(currentPassword, newPassword, confirmPassword);
		if (newPassword !== confirmPassword) {
			return reply.code(400).send({
				success: false,
				message: 'New passwords do not match'
			});
		}
		else if (newPassword.trim() !== '') {
			updateData.password = await argon2.hash(newPassword.trim());
		}
	}

	// Build the update object dynamically since we don't know which fields will be updated
	if (display_name && display_name.trim() !== '') updateData.display_name = display_name.trim();
	if (avatarUrl && avatarUrl.trim() !== '') updateData.avatarUrl = avatarUrl.trim();

	if (Object.keys(updateData).length === 0) {
		return reply.code(400).send({
			success: false,
			message: 'No valid fields to update'
		});
	}

	console.log('Updating user with data:', updateData);
	updateUser(id, updateData);

	return reply.send({ success: true });
});

fastify.get('/api/user',
	{ onRequest: [fastify.authenticate] },
	async (req, reply) => {
		const id = (req.user as { id: number }).id;

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

		return reply.send({ success: true, user });
	});

fastify.get('/api/user/profile',
	{ onRequest: [fastify.authenticate] },
	async (req, reply) => {
		const id = (req.user as { id: number }).id;

		if (!id || isNaN(Number(id))) {
			return reply.code(400).send({ success: false, message: 'Invalid user ID' });
		}

		const user = getUserProfileById(Number(id));

		if (!user) {
			return reply.code(404).send({ success: false, message: 'User not found' });
		}

		return reply.send({ success: true, user });
	});

fastify.get('/api/user/stats',
	{ onRequest: [fastify.authenticate] },
	async (req, reply) => {
		const id = (req.user as { id: number }).id;

		// Validate and convert to number
		if (!id || isNaN(Number(id))) {
			return reply.code(400).send({
				success: false,
				message: 'Invalid user ID'
			});
		}

		const stats = await getStatsByUserId(Number(id));

		// Handle case where user isn't found
		if (!stats) {
			return reply.code(404).send({
				success: false,
				message: 'Stats not found'
			});
		}

		return reply.send({ success: true, stats });
	});

// Run the server!
try {
	initializeDatabase();
	await fastify.listen({ port: 3000 })
} catch (err) {
	fastify.log.error(err)
	process.exit(1)
}