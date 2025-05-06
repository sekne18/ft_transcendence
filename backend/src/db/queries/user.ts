import db from "../connection.js";


export function createUser({ username, email, passwordHash, displayName, avatarUrl }: {
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
}) : number{
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, display_name, avatar_url)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(username, email, passwordHash, displayName, avatarUrl || '');
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
  displayName: string;
  avatarUrl: string;
}) {
  const stmt = db.prepare(`
    UPDATE users SET username = ?, email = ?, display_name = ?, avatar_url = ?
    WHERE id = ?
  `);
  stmt.run(data.username, data.email, data.displayName, data.avatarUrl, id);
}