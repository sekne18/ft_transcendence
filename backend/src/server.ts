import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import fs from 'node:fs';
import { readFile } from 'fs/promises';
import { getChatsByUserId, getChatMessages, markMessagesAsRead, getUnreadCount, createChat } from './db/queries/chat.js';
import { createUser, getUserByEmail, getUserById, getUserProfileById, getUserUnsafeById, updateUser } from './db/queries/user.js';
import { getTokenByjti, pushTokenToDB, setUsedToken } from './db/queries/tokens.js';
import { getMatchById, getMatchesByUserId } from './db/queries/match.js';
import { initializeDatabase } from './db/schema.js';
import * as argon2 from "argon2";
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import './types.js';
import { MatchmakingManager } from './game/MatchmakingManager.js';
import { gameParams } from './game/GameParams.js';
import path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { TournamentManager } from './tournament/TournamentManager.js';
import { User } from './types.js';
import { ChatManager } from './chat/ChatManager.js';
import { getAllFriends, getOnlineFriends, getBlockedFriends, getPendingFriends, FriendListPlayer, getAllUsers, blockFriend, sendFriendRequest, acceptFriendRequest, declineFriendRequest, unblockFriend, getFriendshipStatus } from './db/queries/friends.js';
import { getLeaderboard } from './db/queries/leaderboard.js';
import { defaultAvatarPath } from './Config.js';
import { GameStore } from './game/GameStore.js';
import { getCompletedTournaments } from './db/queries/tournament.js';
import { Bracket } from './tournament/Types.js';
import { pipeline } from 'node:stream/promises';

const cookieOptions: { httpOnly: boolean, secure: boolean, sameSite: "strict" | "lax" | "none" } = {
	httpOnly: true,
	secure: false, // Set to true in production (requires HTTPS)
	sameSite: 'strict',
};

const access_exp = 15 * 60; // 15 minutes
const refresh_exp = 7 * 24 * 60 * 60; // 7 days

const gameStore = new GameStore();
const matchmaker = new MatchmakingManager(gameStore);
const tournamentManager = new TournamentManager(gameStore);
const chatManager = new ChatManager(matchmaker);

const fastify: FastifyInstance = Fastify({
	logger: true
});

dotenv.config();

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/avatars');

if (!existsSync(UPLOAD_DIR)) {
	mkdirSync(UPLOAD_DIR, { recursive: true });
}

{
	const __dirname = fileURLToPath(new URL('.', import.meta.url));

	await fastify.register(fastifyStatic, {
		root: path.join(__dirname, '../public/uploads'),
		prefix: '/uploads/', // this allows access like /avatars/default.png
	});
}

await fastify.register(fastifyCookie);
await fastify.register(fastifyWebsocket);
await fastify.register(fastifyMultipart, {
	limits: {
		fileSize: 10 * 1024 * 1024, // 10 MB
		files: 1 // Limit to 1 file per request
	}
});

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

function generateTokenPair(userId: number) {
	const token = fastify.jwt.sign({ id: userId }, { expiresIn: access_exp });
	const jti = crypto.randomUUID();
	const refreshToken = fastify.jwt.sign({ id: userId, jti: jti }, { expiresIn: refresh_exp });
	try {
		pushTokenToDB({
			user_id: userId,
			jti: jti,
			exp: Math.floor(Date.now() / 1000) + refresh_exp,
			iat: Math.floor(Date.now() / 1000)
		});
	}
	catch (err) {
		fastify.log.error('Error pushing token to DB:', err);
		throw new Error('Failed to store refresh token');
	}
	fastify.log.info('Token pair generated:', { token, refreshToken });
	return { token, refreshToken };
}

fastify.decorate('authenticate', async function handler(request: any, reply: any) {
	const accessToken = request.cookies.access;
	// First try to verify the access token
	if (accessToken) {
		try {
			request.user = await fastify.jwt.verify(accessToken);
			return;
		} catch (err) {
			fastify.log.warn('Access token invalid or expired');
			return reply.code(401).send({ success: false, message: 'Invalid access token' });
		}
	}
	else {
		return reply.code(401).send({ error: 'Unauthorized' });
	}
});

fastify.get('/api/login/google/callback', async (req, reply) => {
	const code = (req.query as any).code;
	if (!code) return reply.status(400).send({ success: false, message: 'Missing code' });

	try {
		// Step 1: Exchange code for access token
		const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				code,
				client_id: process.env.GOOGLE_CLIENT_ID!,
				client_secret: process.env.GOOGLE_CLIENT_SECRET!,
				redirect_uri: `${process.env.BACKEND_URL!}${process.env.GOOGLE_REDIRECT_URI!}`,
				grant_type: 'authorization_code',
			})
		});

		const tokenData = await tokenRes.json() as { access_token?: string };

		if (!tokenData.access_token) {
			return reply.code(401).send({ success: false, message: 'Failed to get access token' });
		}

		// Step 2: Get user info from Google
		const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` }
		});
		const googleUser = await userRes.json() as { email: string; id: string; name: string; picture: string };

		// Step 3: Get or create user in your DB
		let user = await getUserByEmail(googleUser.email) as User; // Same as your login
		let userId;

		if (!user) {
			// If user doesn't exist, create them
			userId = createUser({
				email: googleUser.email,
				hash: "",
				username: googleUser.name,
				display_name: googleUser.name,
				avatarUrl: googleUser.picture,
				role: 'google-user' // Mark as Google user
			});
		}

		// Step 4: Issue token pair
		const { token, refreshToken } = generateTokenPair(userId || user.id);

		// Step 5: Set same cookies as in password login
		reply
			.setCookie('access', token, {
				path: '/',
				httpOnly: cookieOptions.httpOnly,
				secure: cookieOptions.secure,
				sameSite: cookieOptions.sameSite,
				maxAge: access_exp,
			})
			.setCookie('refresh', refreshToken, {
				path: '/',
				httpOnly: cookieOptions.httpOnly,
				secure: cookieOptions.secure,
				sameSite: cookieOptions.sameSite,
				maxAge: refresh_exp
			})
			.redirect(`${process.env.FRONTEND_URL!}`); // After handling cookies, redirect the user to frontend
	} catch (err) {
		fastify.log.error('Google login error:', err);
		return reply.status(500).send({ success: false, message: 'Google login failed' });
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
					{ expiresIn: '15m' } // Short-lived token
				);

				return reply.code(200).send({
					success: true,
					twoFA: true,
					tempToken
				});
			}

			const { token, refreshToken } = generateTokenPair(user.id);

			await updateUser(user.id, {
				last_login: Date.now(),
				status: 'online'
			});
			// password match
			return reply.code(200)
				.setCookie('access', token, {
					path: '/',
					httpOnly: cookieOptions.httpOnly,
					secure: cookieOptions.secure,
					sameSite: cookieOptions.sameSite,
					maxAge: access_exp, // 15 min
				})
				.setCookie('refresh', refreshToken, {
					path: '/',
					httpOnly: cookieOptions.httpOnly,
					secure: cookieOptions.secure,
					sameSite: cookieOptions.sameSite,
					maxAge: refresh_exp // 7 days
				})
				.send({
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

fastify.post('/api/logout', async (req, reply) => {
	reply
		.clearCookie('access')
		.clearCookie('refresh')
		.send({ success: true });
});

fastify.post('/api/2fa/verify', async (req, reply) => {
	const { code } = req.body as { code: string };
	const tmp_token = req.headers.authorization?.split(' ')[1];

	if (!tmp_token) {
		return reply.code(401).send({ success: false, message: 'Missing temp token' });
	}

	try {
		const payload = fastify.jwt.verify(tmp_token) as { id: number, twoFA: boolean };

		if (!payload.twoFA) {
			return reply.code(400).send({ success: false, message: 'Invalid token context' });
		}

		const user = await getUserUnsafeById(payload.id) as { id: number; totp_secret: string; };
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

		const { token, refreshToken } = generateTokenPair(user.id);

		return reply.code(200)
			.setCookie('access', token, {
				path: '/',
				httpOnly: cookieOptions.httpOnly,
				secure: cookieOptions.secure,
				sameSite: cookieOptions.sameSite,
				maxAge: access_exp,
			})
			.setCookie('refresh', refreshToken, {
				path: '/',
				httpOnly: cookieOptions.httpOnly,
				secure: cookieOptions.secure,
				sameSite: cookieOptions.sameSite,
				maxAge: refresh_exp
			})
			.send({ success: true });

	} catch (err) {
		fastify.log.error('2FA verification failed:', err);
		return reply.code(401).send({ success: false, message: 'Invalid or expired temp token' });
	}
});

fastify.get('/api/2fa/setup', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const user = await getUserUnsafeById(id) as { id: number; has2fa: boolean; };
	if (!user) return reply.code(404).send({ success: false, message: 'User not found' });

	if (user.has2fa) {
		return reply.code(400).send({ success: false, message: '2FA already enabled' });
	}

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

	const user = await getUserUnsafeById(id) as { id: number; totp_secret: string; };
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

fastify.post('/api/token/refresh', async (req, reply) => {
	const refreshTokenCookie = req.cookies.refresh;

	// If access token fails, try to verify the refresh token
	if (refreshTokenCookie) {
		try {
			const verifiedRefreshToken = await fastify.jwt.verify(refreshTokenCookie) as { id: number, jti: string };

			if (!verifiedRefreshToken) {
				return reply.code(401).send({ success: false, message: 'Invalid refresh token' });
			}
			const dbToken = getTokenByjti(verifiedRefreshToken.jti) as { user_id: number; jti: string; exp: number; iat: number, last_used_at: number | undefined; };
			if (!dbToken) {
				return reply.code(401).send({ success: false, message: 'Invalid refresh token db' });
			}
			if (dbToken.exp < Math.floor(Date.now() / 1000)) {
				return reply.code(401).send({ success: false, message: 'Refresh token expired' });
			}
			if (dbToken.user_id !== verifiedRefreshToken.id) {
				return reply.code(401).send({ success: false, message: 'Invalid refresh token' });
			}
			if (dbToken.last_used_at) {
				return reply.code(401).send({ success: false, message: 'Refresh token already used' });
			}

			try {
				setUsedToken(verifiedRefreshToken.jti, Math.floor(Date.now() / 1000));
			}
			catch (err) {
				fastify.log.error('Error setting used token:', err);
				return reply.code(500).send({ success: false, message: 'Internal server error' });
			}

			// Rotate token: issue new one
			const { token, refreshToken } = generateTokenPair(verifiedRefreshToken.id);

			return reply
				.setCookie('access', token, {
					path: '/',
					httpOnly: cookieOptions.httpOnly,
					secure: cookieOptions.secure,
					sameSite: cookieOptions.sameSite,
					maxAge: access_exp
				})
				.setCookie('refresh', refreshToken, {
					path: '/',
					httpOnly: cookieOptions.httpOnly,
					secure: cookieOptions.secure,
					sameSite: cookieOptions.sameSite,
					maxAge: refresh_exp
				})
				.send({ success: true });
		} catch (err) {
			fastify.log.warn('Refresh token invalid or expired');
			return reply.code(401).send({ success: false, message: 'Invalid refresh token' });
		}
	}
	else {
		return reply.code(401).send({ success: false, message: 'Missing refresh token' });
	}
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
			avatarUrl: `${defaultAvatarPath}`
		});

		if (!userId) {
			return reply.code(400).send({
				success: false,
				message: 'User already exists'
			});
		}

		return reply.send({ success: true });
	} catch (err) {
		return reply.code(500).send({
			success: false,
			message: 'Internal server error'
		});
	}
});

fastify.post('/api/user/update', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const parts = req.parts();

    const updateData: Record<string, string | boolean> = {};
    let newAvatarUrl: string | undefined;
    let currentPassword = '';
    let newPassword = '';
    let confirmPassword = '';

	for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'avatar') {
        const allowedTypes = {
          'image/png': '.png',
          'image/jpeg': '.jpg',
          'image/webp': '.webp',
          'image/gif': '.gif'
        } as Record<string, string>;

        if (!(part.mimetype in allowedTypes)) {
          return reply.code(400).send({ success: false, message: 'Unsupported image type' });
        }

        const ext = allowedTypes[part.mimetype];
        const fileName = `${id}${ext}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
		await pipeline(part.file, fs.createWriteStream(filePath));
        newAvatarUrl = `/uploads/avatars/${fileName}?t=${Date.now()}`;
		updateData.avatarUrl = newAvatarUrl;
      } else if (part.type === 'field') {
        const { fieldname, value } = part as {fieldname: string, value: string};
        switch (fieldname) {
          case 'display_name':
            if (value.trim()) updateData.display_name = value.trim();
            break;
          case 'twoFA':
            updateData.has2fa = value === 'true';
            break;
          case 'currentPassword':
            currentPassword = value;
            break;
          case 'newPassword':
            newPassword = value;
            break;
          case 'confirmPassword':
            confirmPassword = value;
            break;
        }
      }
    }

	// Validate the password if provided
	if (currentPassword && newPassword && confirmPassword) {
		if (newPassword !== confirmPassword) {
			return reply.code(400).send({
				success: false,
				message: 'New passwords do not match'
			});
		} else if (currentPassword === newPassword) {
			return reply.code(400).send({
				success: false,
				message: 'New password cannot be the same as current password'
			});
		}
		const user = await getUserUnsafeById(id) as { id: number; password: string; };
		try {
			if (await argon2.verify(user.password, currentPassword)) {
				updateData.password = await argon2.hash(newPassword);
			} else {
				//fastify.log.info('Password did not match');
				return reply.code(400).send({
					success: false,
					message: 'Invalid password'
				});
			}
		} catch (err) {
			fastify.log.error('Error verifying password:', err);
			return reply.code(500).send({
				success: false,
				message: 'Internal server error'
			});
		}
	} else if (newPassword && confirmPassword) {
		return reply.code(400).send({
			success: false,
			message: 'Current password is required to change password'
		});
	}

	if (Object.keys(updateData).length === 0) {
		return reply.code(400).send({
			success: false,
			message: 'No valid fields to update'
		});
	}

	updateUser(id, { ...updateData });

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

fastify.get('/api/user/:id/status',
	{ onRequest: [fastify.authenticate] },
	async (req, reply) => {
		const id = parseInt((req.params as any).id);
		if (!id) {
			return reply.code(400).send({
				success: false,
				message: 'Invalid user ID'
			});
		}
		const user = await getUserById(id);
		if (!user) {
			return reply.code(404).send({ success: false, message: 'User not found' });
		}
		return reply.send({ success: true, status: user.status });
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

fastify.get('/api/user/profile/:id',
	{ onRequest: [fastify.authenticate] },
	async (req, reply) => {
		const id = parseInt((req.params as any).id);
		if (!id) {
			return reply.code(400).send({
				success: false,
				message: 'Invalid user ID'
			});
		}

		const user = await getUserProfileById(id);

		if (!user) {
			return reply.code(404).send({ success: false, message: 'User not found' });
		}

		return reply.send({ success: true, user });
	});

fastify.get('/api/user/recent-matches', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;

	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}

	const matches = getMatchesByUserId(id) as {
		id: number;
		player1_id: number;
		player2_id: number;
		winner_id: number | null;
		player1_score: number;
		player2_score: number;
		ended_at: string;
	}[];

	const matchHistory = matches.map(match => {
		const opponentId = match.player1_id === Number(id) ? match.player2_id : match.player1_id;
		const opponent = getUserById(opponentId) as { id: number; display_name: string; }
		return {
			id: match.id,
			opponent: opponent ? opponent.display_name : 'Unknown',
			result: match.winner_id === Number(id) ? 'win' : (match.winner_id === null ? 'ongoing' : 'loss'),
			score: `${match.player1_score}-${match.player2_score}`,
			date: match.ended_at
		};
	});
	return reply.send({ success: true, matchHistory });
});

fastify.get('/api/user/recent-matches/:id', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = parseInt((req.params as any).id);
	if (!id) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid match ID'
		});
	}
	const matches = getMatchesByUserId(id) as {
		id: number;
		player1_id: number;
		player2_id: number;
		winner_id: number | null;
		player1_score: number;
		player2_score: number;
		played_at: string;
	}[];

	const matchHistory = matches.map(match => {
		const opponentId = match.player1_id === Number(id) ? match.player2_id : match.player1_id;
		const opponent = getUserById(opponentId) as { id: number; display_name: string; }
		return {
			id: match.id,
			opponent: opponent ? opponent.display_name : 'Unknown',
			result: match.winner_id === Number(id) ? 'win' : (match.winner_id === null ? 'ongoing' : 'loss'),
			score: `${match.player1_score}-${match.player2_score}`,
			date: match.played_at
		};
	});

	return reply.send({ success: true, matchHistory });
});

fastify.get('/api/match/:id', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = parseInt((req.params as any).id);
	if (!id) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid match ID'
		});
	}
	const match = getMatchById(id);
	if (!match) {
		return reply.code(404).send({
			success: false,
			message: 'Match not found'
		});
	}
	return reply.send({ success: true, match });
});

fastify.get('/api/leaderboard', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const limit = parseInt((req.query as any).limit) || 10;
	const offset = parseInt((req.query as any).offset) || 0;
	const leaderboard = await getLeaderboard(limit, offset) as { user_id: number; display_name: string; avatar_url: string; wins: number; losses: number; games_played: number; }[];
	if (!leaderboard) {
		return reply.code(500).send({
			success: false,
			message: 'Failed to fetch leaderboard'
		});
	}
	return reply.send({ success: true, leaderboard });
});

fastify.get('/api/game/params', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	return reply.send({
		success: true,
		params: gameParams
	});
});

fastify.get('/api/game/ws', { onRequest: [fastify.authenticate], websocket: true }, (conn, req) => {
	const user = getUserProfileById((req.user as { id: number }).id) as { id: number, wins: number };
	if (!user) {
		//console.error('User not found');
		conn.close(1008, 'User not found');
		return;
	}
	const rating = user.wins || 0;
	matchmaker.enqueue({
		id: user.id,
		socket: conn
	}, rating);
});

fastify.get('/api/tournament/ws', { onRequest: [fastify.authenticate], websocket: true }, (conn, req) => {
	const user = getUserProfileById((req.user as { id: number }).id) as { id: number; };
	if (!user) {
		//console.error('User not found');
		conn.close(1008, 'User not found');
		return;
	}
	try {
		tournamentManager.connectPlayer({ id: user.id, socket: conn });
	} catch (err: any) {
		conn.close(1008, err.message);
	}
});

fastify.get('/api/tournament/:tId/ws', { onRequest: [fastify.authenticate], websocket: true }, (conn, req) => {
	const user = getUserById((req.user as { id: number }).id) as { id: number; };
	if (!user) {
		//console.error('User not found');
		conn.close(1008, 'User not found');
		return;
	}
	const tournamentId = parseInt((req.params as any).tId);
	if (!tournamentId) {
		//console.error('Tournament ID not found');
		conn.close(1008, 'Tournament ID not found');
		return;
	}
	try {
		tournamentManager.setPlayerReady(tournamentId, { id: user.id, socket: conn });
	} catch (err: any) {
		conn.close(1008, err.message);
	}
});

fastify.get('/api/chat/ws', { onRequest: [fastify.authenticate], websocket: true }, (conn, req) => {
	const user = getUserById((req.user as { id: number }).id) as { id: number; };
	if (!user) {
		fastify.log.error('User not found');
		conn.close(1008, 'User not found');
		return;
	}
	updateUser(user.id, {
		last_login: Date.now(),
		status: 'online'
	});
	chatManager.addConnection({ id: user.id, socket: conn });
});

fastify.get('/api/lobby/:id/ws', { onRequest: [fastify.authenticate], websocket: true }, async (conn, req) => {
	const lobbyId = parseInt((req.params as any).id);
	if (!lobbyId) {
		return conn.close(1008, 'Invalid lobby ID');
	}
	try {
		matchmaker.enqueueLobby(lobbyId, {
			id: (req.user as { id: number }).id,
			socket: conn
		});
	} catch (err: any) {
		fastify.log.error('Error adding user to lobby:', err);
		conn.close(1008, err.message);
	}
});

fastify.get('/api/tournament', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const tournaments = tournamentManager.getCurrentTournaments();
	return reply.send({ success: true, tournaments: tournaments });
});

fastify.get('/api/tournament/finished', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const limit = parseInt((req.query as any).limit) || 10;
	const before = parseInt((req.query as any).before) || Date.now();

	const tournaments = await getCompletedTournaments(limit, before) as {
		id: number; status: 'pending' | 'ongoing' | 'finished';
		max_players: number;
		created_at: number;
		ended_at: number | null;
		players: number[];
		bracket: string | null
	}[];
	if (!tournaments) {
		return reply.code(500).send({
			success: false,
			message: 'Failed to fetch tournaments'
		});
	}
	const tournamentsAltered = tournaments.map((tournament) => {
		const t2 = {
			id: tournament.id,
			status: tournament.status,
			maxPlayers: tournament.max_players,
			createdAt: tournament.created_at,
			endedAt: tournament.ended_at,
			players: [] as number[],
			bracket: null as Bracket | null
		};
		const bracket = JSON.parse(tournament.bracket!) as Bracket;
		if (bracket) {
			bracket.rounds[0].forEach((match) => {
				t2.players.push(match.playerIds.p1);
				t2.players.push(match.playerIds.p2);
			});
			t2.bracket = bracket;
		}
		return t2;
	});
	return reply.send({ success: true, tournaments: tournamentsAltered });
});

fastify.get('/api/chat', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const chats = await getChatsByUserId(id) as { chat_id: number; user_id: number, display_name: string, avatar_url: string }[];
	if (!chats) {
		return reply.code(500).send({
			success: false,
		});
	}
	const conn = chatManager.getChatConnection(id);
	if (!conn) {
		return reply.code(500).send({
			success: false,
			message: 'Invalid connection'
		});
	}
	chats.forEach((chat) => {
		chatManager.join(chat.chat_id, conn);
	});
	return reply.send({ success: true, chats });
});

fastify.post('/api/chat/register', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const otherId = parseInt((req.body as any).otherId);
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}

	// First check if the chat already exists
	const existingChat = await getChatsByUserId(id) as { chat_id: number; user_id: number, display_name: string, avatar_url: string }[];
	if (existingChat && existingChat.length > 0) {
		for (const chat of existingChat) {
			if (chat.user_id === otherId) {
				return reply.send({ success: true });
			}
		}
	}

	const chatId = createChat(id, otherId);
	if (!chatId) {
		return reply.code(500).send({
			success: false,
			message: 'Failed to create chat'
		});
	}
	const conn = chatManager.getChatConnection(id);
	if (!conn) {
		return reply.code(500).send({
			success: false,
			message: 'Invalid connection'
		});
	}
	await chatManager.join(chatId, conn);
	return reply.send({ success: true });
});

fastify.get('/api/chat/:chat_id/unread-count', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const chatId = parseInt((req.params as any).chat_id);
	if (!chatId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid chat ID'
		});
	}
	const count = await getUnreadCount(chatId, id) as { unread_count: number };
	if (count === null) {
		return reply.code(500).send({
			success: false,
		});
	}
	return reply.send({ success: true, count: count.unread_count });
});

fastify.get('/api/chat/:chat_id/messages', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const before = parseInt((req.query as any).before) as number;
	const limit = parseInt((req.query as any).limit) || 10;
	const chatId = parseInt((req.params as any).chat_id);
	if (!chatId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid chat ID'
		});
	}
	if (!before) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid before timestamp'
		});
	}
	let messages: any[] = await getChatMessages(chatId, limit, before);

	if (!messages) {
		return reply.code(500).send({
			success: false,
		});
	}

	return reply.send({ success: true, messages });
});

fastify.post('/api/chat/:chat_id/mark-as-read', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const chatId = parseInt((req.params as any).chat_id);
	if (!chatId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid chat ID'
		});
	}
	await markMessagesAsRead(chatId, id);
	return reply.send({ success: true });
});

fastify.get('/api/friends/all', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const searchVal = (req.query as any).name || '' || '';
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const friendsList: FriendListPlayer[] = await getAllFriends(id, searchVal);
	let users: FriendListPlayer[] | undefined = undefined;
	if (friendsList.length == 0)
		users = await getAllUsers(id, searchVal);
	if (friendsList.length !== 0)
		return reply.send({ success: true, friendsList: friendsList, isFriends: true, type: 'all' });
	else
		return reply.send({ success: true, friendsList: users, isFriends: false, type: 'all' });
});

fastify.get('/api/friends/online', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const searchVal = (req.query as any).name || '';
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const friendsList: FriendListPlayer[] = await getOnlineFriends(id, searchVal);
	// let users: FriendListPlayer[] | undefined = undefined;
	return reply.send({ success: true, friendsList, isFriends: true, type: 'online' });
});

fastify.get('/api/friends/pending', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const searchVal = (req.query as any).name || '';
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const friendsList: FriendListPlayer[] = await getPendingFriends(id, searchVal);
	// let users: FriendListPlayer[] | undefined = undefined;
	return reply.send({ success: true, friendsList, isFriends: true, type: 'pending' });
});

fastify.get('/api/friends/blocked', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const searchVal = (req.query as any).name || '';
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	const friendsList: FriendListPlayer[] = await getBlockedFriends(id, searchVal);
	// let users: FriendListPlayer[] | undefined = undefined;
	return reply.send({ success: true, friendsList, isFriends: true, type: 'blocked' });
});

fastify.post('/api/friends/send-friend-request', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const otherId = parseInt((req.body as any).otherId);
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	if (!otherId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid other user ID'
		});
	}
	await sendFriendRequest(id, otherId);
	return reply.send({ success: true });
});

fastify.post('/api/friends/accept-request', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const otherId = parseInt((req.body as any).otherId);
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	if (!otherId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid other user ID'
		});
	}
	await acceptFriendRequest(id, otherId);
	return reply.send({ success: true });
});

fastify.post('/api/friends/decline-request', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const otherId = parseInt((req.body as any).otherId);
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	if (!otherId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid other user ID'
		});
	}
	await declineFriendRequest(id, otherId);
	return reply.send({ success: true });
});

fastify.post('/api/friends/block', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const otherId = parseInt((req.body as any).otherId);
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	if (!otherId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid other user ID'
		});
	}
	await blockFriend(id, otherId);
	return reply.send({ success: true });
});

fastify.post('/api/friends/unblock', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	const id = (req.user as { id: number }).id;
	const otherId = parseInt((req.body as any).otherId);
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	if (!otherId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid other user ID'
		});
	}
	await unblockFriend(id, otherId);
	return reply.send({ success: true });
});

fastify.get('/api/friends/status/:id', { onRequest: [fastify.authenticate] }, async (req, reply) => {
	// Get the status of the friendship between two users
	const id = (req.user as { id: number }).id;
	const otherId = parseInt((req.params as any).id);
	if (!id) {
		return reply.code(401).send({
			success: false,
			message: 'Invalid user ID'
		});
	}
	if (!otherId) {
		return reply.code(400).send({
			success: false,
			message: 'Invalid other user ID'
		});
	}

	const status = await getFriendshipStatus(id, otherId);
	return reply.send({ success: true, status });
});

try {
	initializeDatabase();
	matchmaker.start();
	tournamentManager.init();
	await fastify.listen({ port: 3000, host: '0.0.0.0' });
} catch (err) {
	fastify.log.error(err)
	process.exit(1)
}