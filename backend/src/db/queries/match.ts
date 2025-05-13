import db from "../connection.js";

export function createMatch(
	player1Id: number,
	player2Id: number
): number {
	const stmt = db.prepare(`
      INSERT INTO matches (player1_id, player2_id)
      VALUES (?, ?)
    `);
	const result = stmt.run(player1Id, player2Id);
	return result.lastInsertRowid as number;
}

export function getMatchesByUserId(userId: number, limit = 10, offset = 0) {
	const stmt = db.prepare(`
		SELECT * FROM matches
		WHERE player1_id = ? OR player2_id = ?
		ORDER BY started_at DESC
		LIMIT ? OFFSET ?
	`);
	return stmt.all(userId, userId, limit, offset);
}

export function updateMatch(matchId: number, data: Partial<{
	score1: number,
	score2: number,
	winnerId?: number,
	endTime?: number,
	status?: 'normal' | 'disconnected'
}>): void {
	const fields = [];
	const values = [];
	if (data.score1 !== undefined) {
		fields.push("player1_score = ?");
		values.push(data.score1);
	}
	if (data.score2 !== undefined) {
		fields.push("player2_score = ?");
		values.push(data.score2);
	}
	if (data.winnerId !== undefined) {
		fields.push("winner_id = ?");
		values.push(data.winnerId);
	}
	if (data.endTime !== undefined) {
		fields.push("ended_at = ?");
		values.push(data.endTime);
	}
	if (data.status !== undefined) {
		fields.push("status = ?");
		values.push(data.status);
	}
	if (fields.length === 0) {
		return; // No fields to update
	}

	const sql = `
		UPDATE matches
		SET ${fields.join(", ")}
		WHERE id = ?
	`;
	const stmt = db.prepare(sql);
	stmt.run(...values, matchId);
}
