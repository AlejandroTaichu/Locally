import { apiClient } from './client';
import type { User } from './auth';

export function getMe(token: string) {
  return apiClient.get<User>('/users/me', token);
}

export interface UpdateMeInput {
  displayName?: string;
  isPremium?: boolean;
  onboardingCompleted?: true;
}

export function updateMe(input: UpdateMeInput, token: string) {
  return apiClient.patch<User>('/users/me', input, token);
}
