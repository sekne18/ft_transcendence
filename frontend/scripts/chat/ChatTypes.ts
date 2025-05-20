export type ChatMessage = {
	chat_id: number;
	content: string;
	sender_id: number;
	created_at: number;
	is_invite: boolean;
	expires_at: number | null;
};