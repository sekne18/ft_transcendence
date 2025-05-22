import db from "../connection.js";

export function getChatsByUserId(userId: number) {
	return db.prepare(`
		SELECT
			chats.id AS chat_id,
			other_user.id AS user_id,
			other_user.display_name,
			other_user.avatar_url,
			friends.status AS friend_status
		FROM chats
		JOIN users AS other_user
			ON other_user.id = CASE
				WHEN chats.user1_id = ? THEN chats.user2_id
				ELSE chats.user1_id
			END
		LEFT JOIN friends
			ON friends.user1_id = MIN(?, other_user.id)
			AND friends.user2_id = MAX(?, other_user.id)
		WHERE (chats.user1_id = ? OR chats.user2_id = ?)
			AND (friends.status IS NULL OR friends.status != 'blocked')
	`).all(userId, userId, userId, userId, userId);
}

export function getChatMessages(chatId: number, limit = 10, before?: number) {
	let query = `
	  SELECT id, chat_id, sender_id, content, created_at, is_invite, expires_at
	  FROM messages
	  WHERE chat_id = ?
	`;

	const params: any[] = [chatId];

	if (before) {
		query += ` AND created_at < ?`;
		const now = new Date(before)
			.toISOString()
			.replace('T', ' ')
			.replace(/\.\d{3}Z$/, '');
		params.push(before);
	}

	query += ` ORDER BY created_at DESC LIMIT ?`;
	params.push(limit);

	return db.prepare(query).all(...params);
}

export function getUnreadCount(chatId: number, userId: number) {
	return db.prepare(`
	  SELECT COUNT(*) AS unread_count
	  FROM messages
	  WHERE chat_id = ? AND sender_id != ? AND read = 0
	`).get(chatId, userId);
}

export function markMessagesAsRead(chatId: number, userId: number) {
	return db.prepare(`
	  UPDATE messages
	  SET read = 1
	  WHERE chat_id = ? AND sender_id != ? AND read = 0
	`).run(chatId, userId);
}

export function createChat(user1Id: number, user2Id: number) {
	const result = db.prepare(`
	  INSERT INTO chats (user1_id, user2_id)
	  VALUES (?, ?)
	`).run(user1Id, user2Id);
	const chatId = result.lastInsertRowid as number;
	return chatId;
}

export function createMessage(chatId: number, senderId: number, content: string, createdAt: number, isInvite = false, expiresAt: number | null = null) {
	const now = new Date(createdAt)
		.toISOString()
		.replace('T', ' ')
		.replace(/\.\d{3}Z$/, '');
	return db.prepare(`
	  INSERT INTO messages (chat_id, sender_id, content, created_at, is_invite, expires_at)
	  VALUES (?, ?, ?, ?, ?, ?)
	`).run(chatId, senderId, content, createdAt, isInvite ? 1 : 0, expiresAt);
}