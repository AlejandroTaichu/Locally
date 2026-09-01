import { apiClient } from './client';
import type { User } from './auth';

export function getMe(token: string) {
  return apiClient.get<User>('/users/me', token);
}
