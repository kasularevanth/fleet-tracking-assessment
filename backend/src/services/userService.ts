import pool from '../database/db';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash?: string;
  google_id?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export const userService = {
  // Create user with password
  async createUser(email: string, name: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, name, google_id, avatar_url, created_at, updated_at`,
      [email, name, passwordHash]
    );
    return result.rows[0];
  },

  // Create or get user with Google ID
  async createOrGetGoogleUser(email: string, name: string, googleId: string, avatarUrl?: string): Promise<User> {
    // Check if user exists with Google ID
    let result = await pool.query(
      `SELECT id, email, name, google_id, avatar_url, created_at, updated_at 
       FROM users WHERE google_id = $1`,
      [googleId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Check if user exists with email
    result = await pool.query(
      `SELECT id, email, name, google_id, avatar_url, created_at, updated_at 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length > 0) {
      // Update existing user with Google ID
      await pool.query(
        `UPDATE users SET google_id = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE email = $3`,
        [googleId, avatarUrl, email]
      );
      result = await pool.query(
        `SELECT id, email, name, google_id, avatar_url, created_at, updated_at 
         FROM users WHERE email = $1`,
        [email]
      );
      return result.rows[0];
    }

    // Create new user
    result = await pool.query(
      `INSERT INTO users (email, name, google_id, avatar_url) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, google_id, avatar_url, created_at, updated_at`,
      [email, name, googleId, avatarUrl]
    );
    return result.rows[0];
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, name, password_hash, google_id, avatar_url, created_at, updated_at 
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  },

  // Get user by ID
  async getUserById(id: number): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, name, google_id, avatar_url, created_at, updated_at 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  // Verify password
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password_hash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  },

  // Update user
  async updateUser(id: number, updates: { name?: string; avatar_url?: string }): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.avatar_url) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(updates.avatar_url);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, email, name, google_id, avatar_url, created_at, updated_at`,
      values
    );

    return result.rows[0];
  },

  // Change password
  async changePassword(id: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [passwordHash, id]
    );
  },
};

