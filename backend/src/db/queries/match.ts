import db from "../connection.js";

export function createMatch(
    player1Id: number,
    player2Id: number,
    winnerId: number,
    score1: number,
    score2: number
): number {
    const stmt = db.prepare(`
      INSERT INTO matches (player1_id, player2_id, winner_id, score_player1, score_player2)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(player1Id, player2Id, winnerId, score1, score2);
    return result.lastInsertRowid as number;
}

export function getMatchesByUserId(userId: number) {
    const stmt = db.prepare(`SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?`);
    return stmt.all(userId, userId);
}

