import db from "../connection.js";

export function getChatsByUserId(userId: number) {
	return db.prepare(`
		SELECT
			chats.id AS chat_id,
			users.id AS user_id,
			users.display_name,
			users.avatar_url
		FROM chats
		JOIN users ON (users.id = CASE
			WHEN user1_id = ?
	  			THEN user2_id
	  			ELSE user1_id
			END)
		WHERE chats.user1_id = ? OR chats.user2_id = ?
	`).all(userId, userId, userId);
}

export function getChatMessages(chatId: number, limit = 10, before?: number) {
	let query = `
	  SELECT id, chat_id, sender_id, content, created_at
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
		console.log('fetchhing messages before', now);
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

export function createMessage(chatId: number, senderId: number, content: string, createdAt: number) {
	const now = new Date(createdAt)
		.toISOString()
		.replace('T', ' ')
		.replace(/\.\d{3}Z$/, '');
	console.log('creating message', now);
	return db.prepare(`
	  INSERT INTO messages (chat_id, sender_id, content, created_at)
	  VALUES (?, ?, ?, ?)
	`).run(chatId, senderId, content, createdAt);
}