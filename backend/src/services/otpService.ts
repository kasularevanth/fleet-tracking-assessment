import pool from "../database/db";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import { config } from "../config/env";

export const otpService = {
  // Generate and send OTP
  async generateAndSendOTP(email: string): Promise<string> {
    // Generate 6-digit OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Store OTP in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await pool.query(
      `INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
      [email, otp, expiresAt]
    );

    // Send OTP via email
    await this.sendOTPEmail(email, otp);

    return otp;
  },

  // Verify OTP (check validity without marking as used)
  async verifyOTP(
    email: string,
    otp: string,
    markAsUsed: boolean = false
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT id, expires_at, used 
       FROM otps 
       WHERE email = $1 AND otp_code = $2 AND used = FALSE 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const otpRecord = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      return false; // OTP expired
    }

    // Only mark OTP as used if explicitly requested (e.g., during password reset)
    if (markAsUsed) {
      await pool.query(`UPDATE otps SET used = TRUE WHERE id = $1`, [
        otpRecord.id,
      ]);
    }

    return true;
  },

  // Send OTP email
  async sendOTPEmail(email: string, otp: string): Promise<void> {
    // Check if SMTP is configured
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      console.log(
        `📧 OTP for ${email}: ${otp} (SMTP not configured - check console)`
      );
      console.log(
        `⚠️  To enable email sending, configure SMTP_USER and SMTP_PASS in your .env file`
      );
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });

      // Verify connection
      await transporter.verify();

      const info = await transporter.sendMail({
        from: config.SMTP_USER,
        to: email,
        subject: "Fleet Tracking - Password Reset OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset OTP</h2>
            <p>Your OTP code is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      console.log(
        `✅ OTP email sent successfully to ${email}. Message ID: ${info.messageId}`
      );

      // In development, also log to console for convenience
      if (config.NODE_ENV === "development") {
        console.log(
          `📧 OTP for ${email}: ${otp} (also logged for development)`
        );
      }
    } catch (error: any) {
      console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
      console.log(`📧 OTP for ${email}: ${otp} (email failed - check console)`);

      // Re-throw in production, but allow in development
      if (config.NODE_ENV === "production") {
        throw new Error(`Failed to send OTP email: ${error.message}`);
      }
    }
  },

  // Clean expired OTPs
  async cleanExpiredOTPs(): Promise<void> {
    await pool.query(
      `DELETE FROM otps WHERE expires_at < NOW() OR used = TRUE`
    );
  },
};
