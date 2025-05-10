import db from "../connection.js";


export function createUser({ username, display_name, email, hash, avatarUrl }: {
  username: string;
  display_name: string;
  email: string;
  hash: string;
  avatarUrl?: string;
}): number {
  // Check if the username or email already exists and return null if it does
  const existingUser = getUserByEmail(email) || getUserByUsername(username);
  if (existingUser) {
    return 0;
  }
  const insertUser = db.prepare(`
    INSERT INTO users (username, display_name, email, password, avatar_url)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = insertUser.run(username, display_name, email, hash, avatarUrl);
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
      users.display_name,
      users.email,
      users.has2fa,
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

export function updateUser(id: number, data: Partial<{
  display_name: string;
  password: string;
  avatarUrl: string;
  has2fa: boolean;
  online: boolean;
  last_login: number;
  totp_secret: string;
}>) {
  const fields = [];
  const values = [];

  if (data.display_name !== undefined) {
    fields.push('display_name = ?');
    values.push(data.display_name);
  }
  if (data.password !== undefined) {
    fields.push('password = ?');
    values.push(data.password);
  }
  if (data.avatarUrl !== undefined) {
    fields.push('avatar_url = ?');
    values.push(data.avatarUrl);
  }
  if (data.has2fa !== undefined) {
    fields.push('has2fa = ?');
    values.push(data.has2fa ? 1 : 0);
  }
  if (data.online !== undefined) {
    fields.push('online = ?');
    values.push(data.online ? 1 : 0);
  }
  if (data.last_login !== undefined) {
    const now = new Date(data.last_login)
      .toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, '');
    fields.push('last_login = ?');
    values.push(now);
  }
  if (data.totp_secret !== undefined) {
    fields.push('totp_secret = ?');
    values.push(data.totp_secret);
  }

  if (fields.length === 0) {
    // Nothing to update
    return;
  }

  const sql = `
    UPDATE users SET ${fields.join(', ')}
    WHERE id = ?
  `;

  const stmt = db.prepare(sql);
  console.log('values', ...values, id);
  stmt.run(...values, id);
}