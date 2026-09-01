import { apiClient } from './client';

export type JoinType = 'instant' | 'approval';

export interface EventOrganizer {
  id: string;
  displayName: string;
}

export interface Event {
  id: string;
  title: string;
  category: string;
  locationLat: number;
  locationLng: number;
  locationLabel: string;
  startsAt: string;
  capacity: number | null;
  joinType: JoinType;
  premiumOnlyMatching: boolean;
  visibilityScope: 'local' | 'global';
  createdAt: string;
  organizer: EventOrganizer;
  distanceKm?: number;
}

export interface CreateEventInput {
  title: string;
  category: string;
  locationLat: number;
  locationLng: number;
  locationLabel: string;
  startsAt: string;
  capacity?: number;
  joinType: JoinType;
}

export function createEvent(input: CreateEventInput, token: string) {
  return apiClient.post<Event>('/events', input, token);
}

export function listEvents(token: string, params?: { lat?: number; lng?: number; radiusKm?: number }) {
  const query = params
    ? '?' +
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
    : '';
  return apiClient.get<Event[]>(`/events${query}`, token);
}

export function getEvent(id: string, token: string) {
  return apiClient.get<Event>(`/events/${id}`, token);
}
