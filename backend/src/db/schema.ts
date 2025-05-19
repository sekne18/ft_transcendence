import { botData } from "../Config.js";
import db from "./connection.js";

export function initializeDatabase() {
	const createTables = db.transaction(() => {
		// Check if users table exists
		const userTableExists = db.prepare(`
			SELECT name FROM sqlite_master WHERE type='table' AND name='users'
		`).get();

		if (userTableExists) {
			console.log('Database tables already exist');
			return;
		}
		console.log('Creating users table...');
		db.prepare(`
			CREATE TABLE users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT NOT NULL UNIQUE,
				display_name TEXT NOT NULL,
				email TEXT NOT NULL UNIQUE,
				password TEXT NOT NULL,
				has2fa BOOLEAN DEFAULT false,
				online BOOLEAN DEFAULT false,
				last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
				totp_secret TEXT,
				avatar_url TEXT DEFAULT '',
				role TEXT DEFAULT 'user', -- 'user', 'admin', 'bot'
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);
		`).run();

		db.prepare(`
			CREATE TABLE friends (
				user1_id INTEGER,
				user2_id INTEGER,
				sender_id INTEGER,
				status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY (user1_id, user2_id),
				FOREIGN KEY (user1_id) REFERENCES users(id),
				FOREIGN KEY (user2_id) REFERENCES users(id),
				CHECK (user1_id < user2_id)
			);
		`).run();

		db.prepare(`
			CREATE TABLE tournaments (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				winner_id INTEGER DEFAULT NULL,
				max_players INTEGER NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				start_at DATETIME DEFAULT NULL,
				ended_at DATETIME DEFAULT NULL,
				status TEXT DEFAULT 'pending', -- 'pending', 'ongoing', 'finished'
				bracket TEXT DEFAULT NULL,
				FOREIGN KEY (winner_id) REFERENCES users(id)
			);
		`).run();

		db.prepare(`
			CREATE TABLE matches (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				-- references users
				player1_id INTEGER NOT NULL,
				player2_id INTEGER NOT NULL,
				winner_id INTEGER DEFAULT NULL,

				-- references tournaments
				tournament_id INTEGER DEFAULT NULL,
				round INTEGER DEFAULT NULL,

				player1_score INTEGER DEFAULT 0,
				player2_score INTEGER DEFAULT 0,

				started_at DATETIME NOT NULL,
				ended_at DATETIME DEFAULT NULL,

				status TEXT DEFAULT 'ongoing', -- 'ongoing', 'finished', 'disconnected'

				FOREIGN KEY (player1_id) REFERENCES users(id),
				FOREIGN KEY (player2_id) REFERENCES users(id),
				FOREIGN KEY (winner_id) REFERENCES users(id)
				CHECK (winner_id IS NULL OR winner_id IN (player1_id, player2_id))
			);
		`).run();

		db.prepare(`
			CREATE TABLE chats (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user1_id INTEGER NOT NULL,
				user2_id INTEGER NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user1_id) REFERENCES users(id),
				FOREIGN KEY (user2_id) REFERENCES users(id)
			);
		`).run();

		db.prepare(`
			CREATE TABLE messages (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				chat_id INTEGER NOT NULL,
				sender_id INTEGER NOT NULL,
				read BOOLEAN DEFAULT false,
				content TEXT NOT NULL,
				created_at DATETIME NOT NULL,
				FOREIGN KEY (chat_id) REFERENCES chats(id),
				FOREIGN KEY (sender_id) REFERENCES users(id)
			);
		`).run();

		db.prepare(`
			CREATE TABLE stats (
				user_id INTEGER PRIMARY KEY,
				wins INTEGER DEFAULT 0,
				losses INTEGER DEFAULT 0,
				games_played INTEGER DEFAULT 0,
				FOREIGN KEY (user_id) REFERENCES users(id)
			);
		`).run();

		db.prepare(`
			CREATE TABLE IF NOT EXISTS refresh_tokens (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				jti TEXT NOT NULL UNIQUE,               -- unique token ID (JWT 'jti')
				exp DATETIME NOT NULL,                  -- expiration time
				iat DATETIME DEFAULT CURRENT_TIMESTAMP, -- issued at
				last_used_at DATETIME                   -- for auditing
			);
		`).run();

		db.prepare(`
			INSERT INTO users (username, display_name, email, password, avatar_url, role)
			VALUES (?, ?, ?, ?, ?, ?);
		`).run(botData.username, botData.display_name, botData.email, '', botData.avatarPath, 'bot');

		db.prepare(`
			INSERT INTO stats (user_id, wins, losses, games_played)
			VALUES (1, 0, 0, 0);
		`).run();

		console.log('Database tables created successfully');
	});

	createTables();
}