import db from "../connection.js";

export function getLeaderboard(limit = 10, offset = 0) {
	return db.prepare(`
		SELECT
			users.id AS user_id,
			users.display_name,
			users.avatar_url,
			stats.wins,
			stats.losses,
			stats.games_played
		FROM users
		JOIN stats ON users.id = stats.user_id
		ORDER BY stats.wins DESC
		LIMIT ? OFFSET ?;
    `).all(limit, offset);
}