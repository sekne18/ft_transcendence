import db from "../connection.js";
// query stats for a specific user id

export function getStatsByUserId(userId: number) {
  const stmt = db.prepare(`
    SELECT * FROM stats WHERE user_id = ?
  `);
  return stmt.get(userId);
}

export function updateUserStats(
  userId: number,
  wins: number,
  losses: number,
  gamesPlayed: number
) {
  const stmt = db.prepare(`
    INSERT INTO stats (user_id, wins, losses, games_played)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      wins = wins + excluded.wins,
      losses = losses + excluded.losses,
      games_played = games_played + excluded.games_played
  `);
  
  return stmt.run(userId, wins, losses, gamesPlayed);
}