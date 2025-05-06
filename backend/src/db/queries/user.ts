import db from "../connection.js";


export function createUser({ username, email, hash, avatarUrl }: {
  username: string;
  email: string;
  hash: string;
  avatarUrl?: string;
}) : number{
  // Check if the username or email already exists and return null if it does
  const existingUser = getUserByEmail(email) || getUserByUsername(username);
  if (existingUser) {
    return 0;
  }
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password, avatar_url)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(username, email, hash, avatarUrl);
  return result.lastInsertRowid as number;
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