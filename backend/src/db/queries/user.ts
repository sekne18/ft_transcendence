import db from "../connection.js";


export function createUser({ username, email, password, avatarUrl }: {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
}): number {
  // Check if the username or email already exists and return null if it does
  const existingUser = getUserByEmail(email) || getUserByUsername(username);
  if (existingUser) {
    return 0;
  }
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password, avatar_url)
    VALUES (?, ?, ?, ?)
  `);
  const result = insertUser.run(username, email, password, avatarUrl);
  const userId = result.lastInsertRowid as number;

  const insertStats = db.prepare(`
    INSERT INTO stats (user_id, games_played, wins, losses)
    VALUES (?, 0, 0, 0)
  `);
  insertStats.run(userId);

  return userId;
}

export function getUserProfileById(id: number) {
  const stmt = db.prepare(`
    SELECT 
      users.id,
      users.username,
      users.email,
      users.avatar_url,
      stats.games_played,
      stats.wins,
      stats.losses
    FROM users
    LEFT JOIN stats ON users.id = stats.user_id
    WHERE users.id = ?
  `);

  return stmt.get(id);
}

export function getUserByEmail(email: string) {
  const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
  return stmt.get(email);
}

export function getUserByUsername(username: string) {
  const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
  return stmt.get(username);
}

export function getUserById(id: number) {
  const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
  return stmt.get(id);
}

export function updateUser(id: number, data: {
  username: string;
  email: string;
  avatarUrl: string;
}) {
  const stmt = db.prepare(`
    UPDATE users SET username = ?, email = ?, avatar_url = ?
    WHERE id = ?
  `);
  stmt.run(data.username, data.email, data.avatarUrl, id);
}