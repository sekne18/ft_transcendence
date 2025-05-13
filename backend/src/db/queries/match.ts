import db from "../connection.js";

export function createMatch(
    player1Id: number,
    player2Id: number,
    score1: number,
    score2: number,
    winnerId?: number
): number {
    const stmt = db.prepare(`
      INSERT INTO matches (player1_id, player2_id, player1_score, player2_score, winner_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(player1Id, player2Id, score1, score2, winnerId);
    return result.lastInsertRowid as number;
}

export function getMatchesByUserId(userId: number) {
    const stmt = db.prepare(`SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?`);
    return stmt.all(userId, userId);
}

export function updateMatch(matchId: number, score1: number, score2: number, winnerId?: number, status?: string) {
    const stmt = db.prepare(`
      UPDATE matches
      SET player1_score = ?, player2_score = ?, winner_id = ?, status = ?
      WHERE id = ?
    `);
    return stmt.run(score1, score2, winnerId, status, matchId);
}