import db from "../connection.js";

export function getTokenByjti(jti: string) {
	const stmt = db.prepare(`SELECT * FROM refresh_tokens WHERE jti = ?`);
	return stmt.get(jti);
}

export function setUsedToken(jti: string, iat: number) {
	const stmt = db.prepare(`UPDATE refresh_tokens SET last_used_at = ? WHERE jti = ?`);
	const result = stmt.run(iat, jti);
	if (result.changes === 0) {
		throw new Error("Token not found");
	}
	return result.changes;
}

export function pushTokenToDB({
	user_id,
	jti,
	exp,
	iat,
}: {
	user_id: number;
	jti: string;
	exp: number;
	iat: number;
}) {
	const stmt = db.prepare(`
	INSERT INTO refresh_tokens (user_id, jti, exp, iat)
	VALUES (?, ?, ?, ?)
  `);
	const result = stmt.run(user_id, jti, exp, iat);
	return result.lastInsertRowid as number;
}