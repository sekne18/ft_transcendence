import db from "../connection.js";

export function createMatch(
	player1Id: number,
	player2Id: number,
	startTime: number = Date.now(),
	tournamentId: number | null = null,
	round: number | null = null,
): number {
	const fields = [
		"player1_id",
		"player2_id",
		"started_at"
	];
	const values = [
		player1Id,
		player2Id,
		startTime
	];
	if (tournamentId !== null) {
		fields.push("tournament_id");
		values.push(tournamentId);
	}
	if (round !== null) {
		fields.push("round");
		values.push(round);
	}
	const placeholders = fields.map(() => "?").join(", ");
	const sql = `
		INSERT INTO matches (${fields.join(", ")})
		VALUES (${placeholders})
	`;
	const stmt = db.prepare(sql);
	const result = stmt.run(...values);
	if (result.changes === 0) {
		throw new Error("Failed to create match");
	}
	if (result.lastInsertRowid === undefined) {
		throw new Error("Failed to get last insert row id");
	}
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
	player1Id: number,
	player2Id: number,
	winnerId: number,
	endTime: number,
	status: 'finished' | 'disconnected'
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

	// If game is finished, update average_score and longest_streak for both users.
	// Longest stream works by checking if the user has a streak of wins and adding 1 to it if he won. Otherwise it resets to 1.
	if (data.winnerId !== undefined) {
		const updateStats = db.prepare(`
			UPDATE stats
			SET 
				avg_score = (avg_score * games_played + ?) / (games_played + 1),
				longest_streak = CASE
					WHEN longest_streak IS NULL THEN 1
					WHEN ? = ? THEN longest_streak + 1
					ELSE 1
				END
			WHERE user_id = ?
		`);
		updateStats.run(data.score1, data.winnerId, data.player1Id, data.player1Id);
		updateStats.run(data.score2, data.winnerId, data.player2Id, data.player2Id);
	}


	const sql = `
		UPDATE matches
		SET ${fields.join(", ")}
		WHERE id = ?
	`;
	const stmt = db.prepare(sql);
	stmt.run(...values, matchId);
}

export function getTournamentMatches(tournamentId: number) {
	const stmt = db.prepare(`
		SELECT * FROM matches
		WHERE tournament_id = ?
	`);
	return stmt.all(tournamentId);
}

export function getMatchById(matchId: number) {
	const stmt = db.prepare(`
		SELECT * FROM matches
		WHERE id = ?
	`);
	return stmt.get(matchId);
}
