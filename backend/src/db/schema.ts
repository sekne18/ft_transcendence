import db from "./connection.js";

export function initializeDatabase() {
  const createTables = db.transaction(() => {
    // Check if users table exists
    const userTableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `).get();

    if (!userTableExists) {
      console.log('Creating users table...');
      db.prepare(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          avatar_url TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).run();

      db.prepare(`
        CREATE TABLE friends (
          user_id INTEGER,
          friend_id INTEGER,
          status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, friend_id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (friend_id) REFERENCES users(id)
        );
      `).run();
      db.prepare(`
        CREATE TABLE matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player1_id INTEGER NOT NULL,
          player2_id INTEGER NOT NULL,
          winner_id INTEGER NOT NULL,
          player1_score INTEGER NOT NULL,
          player2_score INTEGER NOT NULL,
          played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'completed', -- 'completed', 'ongoing'
          FOREIGN KEY (player1_id) REFERENCES users(id),
          FOREIGN KEY (player2_id) REFERENCES users(id),
          FOREIGN KEY (winner_id) REFERENCES users(id)
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

      console.log('Database tables created successfully');
    } else {
      console.log('Database tables already exist');
    }
  });

  // Execute the transaction
  createTables();
}