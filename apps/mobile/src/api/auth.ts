import { apiClient } from './client';

export type OtpChannel = 'email' | 'phone';

export interface User {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  isPremium: boolean;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
}

export interface AuthResult {
  accessToken: string;
  user: User;
}

export function register(input: { displayName: string; email: string; phone: string }) {
  return apiClient.post<{ userId: string }>('/auth/register', input);
}

export function requestOtp(input: { channel: OtpChannel; target: string }) {
  return apiClient.post<{ ok: true }>('/auth/otp/request', input);
}

export function verifyOtp(input: { channel: OtpChannel; target: string; code: string }) {
  return apiClient.post<AuthResult>('/auth/otp/verify', input);
}
