import apiClient from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface GoogleAuthData {
  idToken: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  googleLogin: async (data: GoogleAuthData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/google', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPData): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/verify-otp', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: { name?: string; avatar_url?: string }): Promise<User> => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await apiClient.put('/auth/change-password', data);
    return response.data;
  },
};
