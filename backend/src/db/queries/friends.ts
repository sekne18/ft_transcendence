import db from "../connection.js";

export interface FriendListPlayer {
  id: number;
  username: string;
  state: string;
  online: boolean;
  avatarUrl: string;
}

export function getAllFriends(userId: number, limit: number = 10): FriendListPlayer[] {
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
    ORDER BY u.display_name ASC
    LIMIT ?
  `).all(userId, userId, userId, userId, limit) as {
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

export function getBlockedFriends(userId: number, limit: number = 10): FriendListPlayer[] {
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
      ORDER BY u.display_name ASC
      LIMIT ?
    `).all(userId, userId, userId, userId, limit) as {
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

  export function getPendingFriends(userId: number, limit: number = 10): FriendListPlayer[] {
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
      ORDER BY u.display_name ASC
      LIMIT ?
    `).all(userId, userId, userId, userId, limit) as {
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

  export function getOnlineFriends(userId: number, limit: number = 10): FriendListPlayer[] {
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
      ORDER BY u.display_name ASC
      LIMIT ?
    `).all(userId, userId, userId, userId, limit) as {
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