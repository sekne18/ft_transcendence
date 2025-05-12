import Database from 'better-sqlite3';

const db = new Database('db/db.sqlite');
db.pragma('journal_mode = WAL');
export default db;