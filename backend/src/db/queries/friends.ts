import db from "../connection.js";

export interface FriendListPlayer {
  id: number;
  username: string;
  state: string;
  online: boolean;
  avatarUrl: string;
}

export function getAllUsers(userId: number, name:string,  limit: number = 10): FriendListPlayer[] {
  const rows = db.prepare(`
    SELECT 
      u.id, 
      u.username, 
      u.online, 
      u.avatar_url AS avatarUrl
    FROM users u
    WHERE u.display_name LIKE ?
    AND u.id != ?
    LIMIT ?
  `).all(name + '%', userId, limit) as {
    id: number;
    username: string;
    state: string;
    online: number;
    avatarUrl: string;
  }[];

  return rows.map(row => ({
    id: row.id,
    username: row.username,
    state: 'Not Friends Yet',
    online: !!row.online,
    avatarUrl: row.avatarUrl,
  }));
}

export function getAllFriends(userId: number, name:string, limit: number = 10): FriendListPlayer[] {
  const rows = db.prepare(`
    SELECT 
      u.id, 
      u.username, 
      f.status AS state, 
      u.online, 
      u.avatar_url AS avatarUrl
    FROM friends f
    JOIN users u ON u.id = CASE
      WHEN f.user1_id = ? THEN f.user2_id
      WHEN f.user2_id = ? THEN f.user1_id
    END
    WHERE (f.user1_id = ? OR f.user2_id = ?)
      AND f.status = 'accepted'
      AND u.display_name LIKE ?
    ORDER BY u.display_name ASC
    LIMIT ?
  `).all(userId, userId, userId, userId, name + '%', limit) as {
    id: number;
    username: string;
    state: string;
    online: number;
    avatarUrl: string;
  }[];
  return rows.map(row => ({
    id: row.id,
    username: row.username,
    state: row.state,
    online: !!row.online,
    avatarUrl: row.avatarUrl,
  }));
}

export function getBlockedFriends(userId: number, name:string, limit: number = 10): FriendListPlayer[] {
    const rows = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        f.status AS state, 
        u.online, 
        u.avatar_url AS avatarUrl
      FROM friends f
      JOIN users u ON u.id = CASE
        WHEN f.user1_id = ? THEN f.user2_id
        WHEN f.user2_id = ? THEN f.user1_id
      END
      WHERE (f.user1_id = ? OR f.user2_id = ?)
        AND f.status = 'blocked'
        AND u.display_name LIKE ?
      ORDER BY u.display_name ASC
      LIMIT ?
  `).all(userId, userId, userId, userId, name + '%', limit) as {
      id: number;
      username: string;
      state: string;
      online: number;
      avatarUrl: string;
    }[];
  
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      state: row.state,
      online: !!row.online,
      avatarUrl: row.avatarUrl,
    }));
  }

  export function getPendingFriends(userId: number, name:string, limit: number = 10): FriendListPlayer[] {
    const rows = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        f.status AS state, 
        u.online, 
        u.avatar_url AS avatarUrl
      FROM friends f
      JOIN users u ON u.id = CASE
        WHEN f.user1_id = ? THEN f.user2_id
        WHEN f.user2_id = ? THEN f.user1_id
      END
      WHERE (f.user1_id = ? OR f.user2_id = ?)
        AND f.status = 'pending'
        AND u.display_name LIKE ?
      ORDER BY u.display_name ASC
      LIMIT ?
  `).all(userId, userId, userId, userId, name + '%', limit) as {
      id: number;
      username: string;
      state: string;
      online: number;
      avatarUrl: string;
    }[];
  
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      state: row.state,
      online: !!row.online,
      avatarUrl: row.avatarUrl,
    }));
  }

  export function getOnlineFriends(userId: number, name: string, limit: number = 10): FriendListPlayer[] {
    const rows = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        f.status AS state, 
        u.online, 
        u.avatar_url AS avatarUrl
      FROM friends f
      JOIN users u ON u.id = CASE
        WHEN f.user1_id = ? THEN f.user2_id
        WHEN f.user2_id = ? THEN f.user1_id
      END
      WHERE (f.user1_id = ? OR f.user2_id = ?)
        AND f.status = 'accepted'
        AND u.online = true
        AND u.display_name LIKE ?
      ORDER BY u.display_name ASC
      LIMIT ?
  `).all(userId, userId, userId, userId, name + '%', limit) as {
      id: number;
      username: string;
      state: string;
      online: number;
      avatarUrl: string;
    }[];
  
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      state: row.state,
      online: !!row.online,
      avatarUrl: row.avatarUrl,
    }));
  }

  export function blockFriend(userId: number, friendId: number): void {
    db.prepare(`
      INSERT OR REPLACE INTO friends (user1_id, user2_id, sender_id, status)
      VALUES (?, ?, ?, 'blocked')
    `).run(userId, friendId, userId);
  }

  export function unblockFriend(userId: number, friendId: number): void {
    db.prepare(`
      DELETE FROM friends
      WHERE (user1_id = ? AND user2_id = ?)
         OR (user1_id = ? AND user2_id = ?)
    `).run(userId, friendId, friendId, userId);
  }

  export function acceptFriendRequest(userId: number, friendId: number): void {
    db.prepare(`
      UPDATE friends
      SET status = 'accepted'
      WHERE (user1_id = ? AND user2_id = ?)
         OR (user1_id = ? AND user2_id = ?)
    `).run(userId, friendId, friendId, userId);
  }

  export function declineFriendRequest(userId: number, friendId: number): void {
    db.prepare(`
      DELETE FROM friends
      WHERE (user1_id = ? AND user2_id = ?)
         OR (user1_id = ? AND user2_id = ?)
    `).run(userId, friendId, friendId, userId);
  }

  export function sendFriendRequest(userId: number, friendId: number): void {
    db.prepare(`
      INSERT OR REPLACE INTO friends (user1_id, user2_id, sender_id, status)
      VALUES (?, ?, ?, 'pending')
    `).run(userId, friendId, userId);
  }

  