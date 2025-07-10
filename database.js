const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'spyfall.db'));
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // جدول المستخدمين
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          username TEXT,
          first_name TEXT,
          balance INTEGER DEFAULT 0,
          bank_account TEXT,
          bank_name TEXT,
          is_banned INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // جدول الألعاب
      this.db.run(`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY,
          chat_id INTEGER,
          status TEXT DEFAULT 'waiting',
          game_type TEXT,
          location_or_item TEXT,
          spies_count INTEGER,
          game_duration INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // جدول اللاعبين في الألعاب
      this.db.run(`
        CREATE TABLE IF NOT EXISTS game_players (
          game_id TEXT,
          user_id INTEGER,
          is_spy INTEGER DEFAULT 0,
          is_alive INTEGER DEFAULT 1,
          votes_received INTEGER DEFAULT 0,
          FOREIGN KEY (game_id) REFERENCES games(id)
        )
      `);

      // جدول المتجر
      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_items (
          user_id INTEGER,
          item_name TEXT,
          quantity INTEGER DEFAULT 1,
          purchase_price INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // جدول التصويت
      this.db.run(`
        CREATE TABLE IF NOT EXISTS votes (
          game_id TEXT,
          voter_id INTEGER,
          voted_for_id INTEGER,
          FOREIGN KEY (game_id) REFERENCES games(id)
        )
      `);
    });
  }

  // أساليب قاعدة البيانات
  async getUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async createUser(userId, username, firstName) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO users (id, username, first_name) VALUES (?, ?, ?)',
        [userId, username, firstName],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateUserBalance(userId, amount) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  async banUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET is_banned = 1 WHERE id = ?',
        [userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  async createGame(gameId, chatId, gameType) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO games (id, chat_id, game_type) VALUES (?, ?, ?)',
        [gameId, chatId, gameType],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getGame(gameId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getActiveGame(chatId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM games WHERE chat_id = ? AND status IN ("waiting", "playing", "voting")',
        [chatId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async addPlayerToGame(gameId, userId, isSpy = false) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO game_players (game_id, user_id, is_spy) VALUES (?, ?, ?)',
        [gameId, userId, isSpy ? 1 : 0],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getGamePlayers(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT gp.*, u.first_name, u.username 
         FROM game_players gp 
         JOIN users u ON gp.user_id = u.id 
         WHERE gp.game_id = ?`,
        [gameId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async updateGameStatus(gameId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE games SET status = ? WHERE id = ?',
        [status, gameId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  async setGameLocation(gameId, location, spiesCount, duration) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE games SET location_or_item = ?, spies_count = ?, game_duration = ? WHERE id = ?',
        [location, spiesCount, duration, gameId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  async addVote(gameId, voterId, votedForId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO votes (game_id, voter_id, voted_for_id) VALUES (?, ?, ?)',
        [gameId, voterId, votedForId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getVotes(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT voted_for_id, COUNT(*) as vote_count FROM votes WHERE game_id = ? GROUP BY voted_for_id',
        [gameId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getUserItems(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM user_items WHERE user_id = ?',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async addUserItem(userId, itemName, quantity, price) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO user_items (user_id, item_name, quantity, purchase_price) VALUES (?, ?, ?, ?)',
        [userId, itemName, quantity, price],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async createBankAccount(userId, bankName, accountNumber) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET bank_account = ?, bank_name = ? WHERE id = ?',
        [accountNumber, bankName, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
}

module.exports = new Database();
