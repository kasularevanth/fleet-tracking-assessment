import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { userService } from '../services/userService';
import { otpService } from '../services/otpService';
import { tokenService } from '../services/tokenService';
import { config } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Google OAuth client
const googleClient = config.GOOGLE_CLIENT_ID
  ? new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET)
  : null;

// Password validation
const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
};

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const newUser = await userService.createUser(email, name, password);

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({ userId: newUser.id, email: newUser.email });
    const refreshToken = tokenService.generateRefreshToken({ userId: newUser.id, email: newUser.email });

    // Store refresh token
    await tokenService.storeRefreshToken(newUser.id, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar_url: newUser.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login - Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userService.verifyPassword(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = tokenService.generateRefreshToken({ userId: user.id, email: user.email });

    // Store refresh token
    await tokenService.storeRefreshToken(user.id, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = tokenService.verifyRefreshToken(refreshToken);

    // Verify token exists in database
    const isValid = await tokenService.verifyRefreshTokenInDB(refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken({ userId: decoded.userId, email: decoded.email });

    res.json({
      accessToken,
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout - Logout (revoke refresh token)
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'Logout failed' });
  }
});

// POST /api/auth/google - Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    if (!googleClient) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required from Google' });
    }

    // Create or get user
    const user = await userService.createOrGetGoogleUser(email, name, googleId, picture);

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = tokenService.generateRefreshToken({ userId: user.id, email: user.email });

    // Store refresh token
    await tokenService.storeRefreshToken(user.id, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    res.status(500).json({ error: error.message || 'Google login failed' });
  }
});

// POST /api/auth/forgot-password - Request password reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await userService.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If the email exists, an OTP has been sent' });
    }

    // Generate and send OTP
    await otpService.generateAndSendOTP(email);

    res.json({ message: 'If the email exists, an OTP has been sent' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp - Verify OTP (doesn't mark as used, only checks validity)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Verify without marking as used (will be marked as used during password reset)
    const isValid = await otpService.verifyOTP(email, otp, false);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
});

// POST /api/auth/reset-password - Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Verify OTP and mark as used (since password is being reset)
    const isValid = await otpService.verifyOTP(email, otp, true);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Get user and update password
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userService.changePassword(user.id, newPassword);

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

// GET /api/auth/me - Get current user (protected route)
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await userService.getUserById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

// PUT /api/auth/profile - Update user profile (protected route)
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, avatar_url } = req.body;

    const updatedUser = await userService.updateUser(req.userId!, { name, avatar_url });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar_url: updatedUser.avatar_url,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// PUT /api/auth/change-password - Change password (protected route)
router.put('/change-password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get user
    const user = await userService.getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const userWithPassword = await userService.verifyPassword(user.email, currentPassword);
    if (!userWithPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Update password
    await userService.changePassword(user.id, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

export default router;
