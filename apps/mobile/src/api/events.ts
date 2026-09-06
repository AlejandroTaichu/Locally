import { apiClient } from './client';
import type { ParticipationStatus } from './participations';

export type JoinType = 'instant' | 'approval';
export type GenderRestriction = 'male' | 'female' | 'all';

export interface EventOrganizer {
  id: string;
  displayName: string;
  averageRating: number | null;
  ratingCount: number;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  locationLat: number;
  locationLng: number;
  locationLabel: string;
  startsAt: string;
  capacity: number | null;
  joinType: JoinType;
  premiumOnlyMatching: boolean;
  visibilityScope: 'local' | 'global';
  genderRestriction: GenderRestriction;
  minAge: number;
  maxAge: number;
  createdAt: string;
  organizer: EventOrganizer;
  participantCount: number;
  distanceKm?: number;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category: string;
  locationLat: number;
  locationLng: number;
  locationLabel: string;
  startsAt: string;
  capacity: number;
  joinType: JoinType;
  genderRestriction: GenderRestriction;
  minAge: number;
  maxAge: number;
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

export interface MyEventEntry {
  event: Event;
  role: 'organizer' | 'participant';
  participationStatus?: ParticipationStatus;
}

export function listMyEvents(token: string) {
  return apiClient.get<MyEventEntry[]>('/events/mine', token);
}
