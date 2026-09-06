import type { Event } from '../api/events';

export function formatEventWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  if (dayDiff === 0) return `Bugün, ${time}`;
  if (dayDiff === 1) return `Yarın, ${time}`;
  return date.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function isEventFillingFast(event: Pick<Event, 'capacity' | 'participantCount'>): boolean {
  if (event.capacity == null) return false;
  const remaining = event.capacity - event.participantCount;
  return remaining > 0 && event.participantCount / event.capacity >= 0.8;
}

export function formatSpots(event: Pick<Event, 'capacity' | 'participantCount'>): string {
  return event.capacity != null ? `${event.participantCount}/${event.capacity}` : `${event.participantCount} katılımcı`;
}
