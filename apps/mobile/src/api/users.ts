import { apiClient } from './client';
import type { User } from './auth';

export function getMe(token: string) {
  return apiClient.get<User>('/users/me', token);
}

export interface UpdateMeInput {
  displayName?: string;
  isPremium?: boolean;
  onboardingCompleted?: true;
  age?: number;
  bio?: string;
  interests?: string[];
  homeLocationLat?: number;
  homeLocationLng?: number;
  username?: string;
  gender?: 'male' | 'female';
}

export function updateMe(input: UpdateMeInput, token: string) {
  return apiClient.patch<User>('/users/me', input, token);
}

export function startTrial(token: string) {
  return apiClient.post<User>('/users/me/start-trial', undefined, token);
}

export function deleteMe(token: string) {
  return apiClient.delete<void>('/users/me', token);
}

export function requestEmailChange(email: string, token: string) {
  return apiClient.post<{ ok: true }>('/users/me/email/request', { email }, token);
}

export function verifyEmailChange(email: string, code: string, token: string) {
  return apiClient.post<User>('/users/me/email/verify', { email, code }, token);
}

export function requestPhoneChange(phone: string, token: string) {
  return apiClient.post<{ ok: true }>('/users/me/phone/request', { phone }, token);
}

export function verifyPhoneChange(phone: string, code: string, token: string) {
  return apiClient.post<User>('/users/me/phone/verify', { phone, code }, token);
}
