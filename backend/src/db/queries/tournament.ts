import { Bracket } from "../../tournament/Types.js";
import db from "../connection.js";

export function getAllTournaments() {
	const stmt = db.prepare(`
		SELECT
			tournaments.id,
			tournaments.winner_id,
			tournaments.max_players,
			tournaments.created_at,
			tournaments.start_at,
			tournaments.ended_at,
			tournaments.status,
			tournaments.bracket
		FROM tournaments
	`);
	return stmt.all();
}

export function getCompletedTournaments(limit: number = 10, before: number) {
	const stmt = db.prepare(`
		SELECT
			tournaments.id,
			tournaments.winner_id,
			tournaments.max_players,
			tournaments.created_at,
			tournaments.start_at,
			tournaments.ended_at,
			tournaments.status,
			tournaments.bracket
		FROM tournaments
		WHERE status = 'finished'
		AND ended_at < ?
		ORDER BY ended_at DESC
		LIMIT ?
	`);
	return stmt.all(before, limit);
}

export function getTournamentById(tournamentId: number) {
	const stmt = db.prepare(`
		SELECT
			tournaments.id,
			tournaments.winner_id,
			tournaments.max_players,
			tournaments.created_at,
			tournaments.start_at,
			tournaments.ended_at,
			tournaments.status,
			tournaments.bracket
		FROM tournaments
		WHERE id = ?
	`);
	return stmt.get(tournamentId);
}

export function getLiveTournaments() {
	const stmt = db.prepare(`
		SELECT
			tournaments.id,
			tournaments.winner_id,
			tournaments.max_players,
			tournaments.created_at,
			tournaments.start_at,
			tournaments.ended_at,
			tournaments.status,
			tournaments.bracket
		FROM tournaments
		WHERE status = 'ongoing' OR status = 'pending'
	`);
	return stmt.all();
}

export function createTournament(
	maxPlayers: number,
	createdAt: number = Date.now()
): number {
	const stmt = db.prepare(`
		INSERT INTO tournaments (max_players, created_at)
		VALUES (?, ?)
	`);
	const result = stmt.run(maxPlayers, createdAt);
	if (result.changes === 0) {
		throw new Error("Failed to create tournament");
	}
	if (result.lastInsertRowid === undefined) {
		throw new Error("Failed to get last insert row id");
	}
	return result.lastInsertRowid as number;
}

export function updateTournament(
	tournamentId: number,
	data: Partial<{
		winnerId: number,
		startTime: number,
		endTime: number,
		status: 'pending' | 'ongoing' | 'finished',
		bracket: Bracket,
	}>
): void {
	const fields = [];
	const values = [];
	if (data.winnerId !== undefined) {
		fields.push("winner_id = ?");
		values.push(data.winnerId);
	}
	if (data.startTime !== undefined) {
		fields.push("start_at = ?");
		values.push(data.startTime);
	}
	if (data.endTime !== undefined) {
		fields.push("ended_at = ?");
		values.push(data.endTime);
	}
	if (data.status !== undefined) {
		fields.push("status = ?");
		values.push(data.status);
	}
	if (data.bracket !== undefined) {
		fields.push("bracket = ?");
		values.push(JSON.stringify(data.bracket));
	}
	if (fields.length === 0) {
		return; // No fields to update
	}

	const sql = `
		UPDATE tournaments
		SET ${fields.join(", ")}
		WHERE id = ?
	`;
	const stmt = db.prepare(sql);
	stmt.run(...values, tournamentId);
}