const db = require('../config/database');

class User {
  // Create new user
  static async create(userData) {
    const { username, email, password, role = 'user' } = userData;
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [username, email, password, role]
    );
    return result.insertId;
  }

  // Find user by username
  static async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Get all users with pagination
  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM users');
    
    return {
      users: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update user password
  static async updatePassword(id, newPassword) {
    const [result] = await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, id]
    );
    return result.affectedRows > 0;
  }

  // Delete user
  static async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Check if username exists
  static async usernameExists(username) {
    const [rows] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    return rows.length > 0;
  }

  // Check if email exists
  static async emailExists(email) {
    const [rows] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0;
  }
}

module.exports = User;
