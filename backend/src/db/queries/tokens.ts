import db from "../connection.js";

export function getTokenByjti(jti: string) {
	const stmt = db.prepare(`SELECT * FROM tokens WHERE jti = ?`);
	return stmt.get(jti);
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
	INSERT INTO tokens (user_id, jti, exp, iat)
	VALUES (?, ?, ?, ?)
  `);
	const result = stmt.run(jti, user_id, exp, iat);
	return result.lastInsertRowid as number;
}