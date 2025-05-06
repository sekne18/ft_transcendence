import db from "../connection.js";
// query stats for a specific user id

export function getStatsByUserId(userId: number) {
  const stmt = db.prepare(`
    SELECT * FROM stats WHERE user_id = ?
  `);
  return stmt.get(userId);
}