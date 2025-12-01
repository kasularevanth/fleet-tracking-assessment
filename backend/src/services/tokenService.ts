import jwt, { Algorithm } from "jsonwebtoken";
import { config } from "../config/env";
import pool from "../database/db";

export interface TokenPayload {
  userId: number;
  email: string;
}

export const tokenService = {
  // Generate access token (short-lived)
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.AUTH_SECRET_KEY, {
      algorithm: config.AUTH_ALGORITHM as Algorithm,
      expiresIn: `${config.AUTH_ACCESS_TOKEN_EXPIRE_MINUTES}m`,
    });
  },

  // Generate refresh token (long-lived)
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.AUTH_SECRET_KEY, {
      algorithm: config.AUTH_ALGORITHM as Algorithm,
      expiresIn: `${config.AUTH_REFRESH_TOKEN_EXPIRE_DAYS}d`,
    });
  },

  // Verify access token
  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.AUTH_SECRET_KEY, {
      algorithms: [config.AUTH_ALGORITHM as Algorithm],
    }) as TokenPayload;
  },

  // Verify refresh token
  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.AUTH_SECRET_KEY, {
      algorithms: [config.AUTH_ALGORITHM as Algorithm],
    }) as TokenPayload;
  },

  // Store refresh token in database
  async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + config.AUTH_REFRESH_TOKEN_EXPIRE_DAYS
    );

    await pool.query(
      `INSERT INTO user_sessions (user_id, token, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT DO NOTHING`,
      [userId, refreshToken, expiresAt]
    );
  },

  // Verify refresh token exists in database
  async verifyRefreshTokenInDB(refreshToken: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM user_sessions 
       WHERE token = $1 AND expires_at > NOW()`,
      [refreshToken]
    );
    return result.rows.length > 0;
  },

  // Revoke refresh token
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await pool.query(`DELETE FROM user_sessions WHERE token = $1`, [
      refreshToken,
    ]);
  },

  // Revoke all refresh tokens for a user
  async revokeAllUserTokens(userId: number): Promise<void> {
    await pool.query(`DELETE FROM user_sessions WHERE user_id = $1`, [userId]);
  },
};
