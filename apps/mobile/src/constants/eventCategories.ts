import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

// Spor & Hareket, Zihin & Dil, Sanat & Hobi, Sosyal — bkz. Katıl-Vault ADR 0014.
// Düz liste olarak saklanıyor, gruplar sadece bu yorumdaki sunum amaçlı.
export const EVENT_CATEGORIES = [
  'Koşu',
  'Bisiklet',
  'Basketbol',
  'Halısaha',
  'Yüzme',
  'Tenis',
  'Yoga',
  'Doğa Yürüyüşü',
  'Kano/Kürek',
  'Tırmanış',
  'Dans',
  'Dil Pratiği',
  'Kitap Kulübü',
  'Satranç/Masa Oyunları',
  'Meditasyon',
  'Fotoğrafçılık',
  'Müzik',
  'El Sanatları',
  'Yemek/Mutfak',
  'Kahve/Sohbet Buluşması',
  'Girişimcilik/Networking',
  'Gönüllülük',
];

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export const CATEGORY_ICONS: Record<string, MaterialIconName> = {
  Koşu: 'directions-run',
  Bisiklet: 'directions-bike',
  Basketbol: 'sports-basketball',
  Halısaha: 'sports-soccer',
  Yüzme: 'pool',
  Tenis: 'sports-tennis',
  Yoga: 'self-improvement',
  'Doğa Yürüyüşü': 'hiking',
  'Kano/Kürek': 'kayaking',
  Tırmanış: 'terrain',
  Dans: 'nightlife',
  'Dil Pratiği': 'translate',
  'Kitap Kulübü': 'menu-book',
  'Satranç/Masa Oyunları': 'sports-esports',
  Meditasyon: 'spa',
  Fotoğrafçılık: 'camera-alt',
  Müzik: 'music-note',
  'El Sanatları': 'palette',
  'Yemek/Mutfak': 'restaurant',
  'Kahve/Sohbet Buluşması': 'local-cafe',
  'Girişimcilik/Networking': 'groups',
  Gönüllülük: 'volunteer-activism',
};

export const DEFAULT_CATEGORY_ICON: MaterialIconName = 'sports';

export const CATEGORY_EMOJI: Record<string, string> = {
  Koşu: '🏃',
  Bisiklet: '🚴',
  Basketbol: '🏀',
  Halısaha: '⚽',
  Yüzme: '🏊',
  Tenis: '🎾',
  Yoga: '🧘',
  'Doğa Yürüyüşü': '🥾',
  'Kano/Kürek': '🛶',
  Tırmanış: '🧗',
  Dans: '💃',
  'Dil Pratiği': '🗣️',
  'Kitap Kulübü': '📚',
  'Satranç/Masa Oyunları': '♟️',
  Meditasyon: '🧠',
  Fotoğrafçılık: '📷',
  Müzik: '🎵',
  'El Sanatları': '🎨',
  'Yemek/Mutfak': '🍳',
  'Kahve/Sohbet Buluşması': '☕',
  'Girişimcilik/Networking': '🤝',
  Gönüllülük: '💛',
};

export const ALL_CATEGORIES_EMOJI = '✨';
