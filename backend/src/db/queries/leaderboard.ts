import db from "../connection.js";

export function getLeaderboard(limit = 10) {
    return db.prepare(`
      SELECT id, display_name, avatar_url, wins, losses
      FROM users
      ORDER BY wins DESC
      LIMIT ?
    `).all(limit);
  }