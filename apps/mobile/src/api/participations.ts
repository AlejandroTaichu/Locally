import { apiClient } from './client';

export type ParticipationStatus = 'pending' | 'approved' | 'rejected' | 'joined';

export interface ParticipationUser {
  id: string;
  displayName: string;
}

export interface Participation {
  id: string;
  eventId: string;
  userId: string;
  status: ParticipationStatus;
  requestedAt: string;
  decidedAt: string | null;
  user: ParticipationUser;
}

export function requestParticipation(eventId: string, token: string) {
  return apiClient.post<Participation>(`/events/${eventId}/participations`, undefined, token);
}

export function listParticipations(eventId: string, token: string) {
  return apiClient.get<Participation[]>(`/events/${eventId}/participations`, token);
}

export function decideParticipation(participationId: string, status: 'approved' | 'rejected', token: string) {
  return apiClient.patch<Participation>(`/participations/${participationId}`, { status }, token);
}
