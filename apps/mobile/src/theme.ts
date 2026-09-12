// Katıl — warm paper, ink, and a restrained vermilion accent.

export const colors = {
  primary: '#C64020',
  primaryDark: '#A63218',
  primaryContainer: '#F07553',
  onPrimary: '#FFFFFF',
  background: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceVariant: '#E8EDE5',
  surfaceContainer: '#F2EEE7',
  border: '#E5E3DC',
  textPrimary: '#242A26',
  textSecondary: '#646A62',
  textMuted: '#70766D',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 40,
};

export const radii = {
  input: 12,
  button: 999,
  card: 16,
  cardLarge: 18,
  chip: 16,
  tag: 20,
  badge: 8,
  avatar: 999,
};

// DM Sans (Katıl-Vault Figma referansı "Vivibe" ekranlarında kullanılan font) —
// ağırlık başına ayrı bir font dosyası olduğu için her token kendi DMSans_*
// varyantını taşıyor (bkz. App.tsx'teki useFonts).
export const typography = {
  displayMobile: { fontFamily: 'DMSans_800ExtraBold', fontSize: 28, fontWeight: '800' as const, lineHeight: 34 },
  headlineMd: { fontFamily: 'DMSans_700Bold', fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  headlineSm: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, fontWeight: '600' as const, lineHeight: 25 },
  bodyLg: { fontFamily: 'DMSans_400Regular', fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
  bodyMd: { fontFamily: 'DMSans_400Regular', fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  labelCaps: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
};

// Figma referansındaki kartlar büyük/yumuşak/düşük-opaklık gölgeler kullanıyor
// (blur 50-92px, opacity 0.06-0.10) — küçük/keskin gölgeye göre daha "premium" duruyor.
export const shadows = {
  card: {
    boxShadow: '0px 8px 30px rgba(15,23,42,0.08)',
  },
  hero: {
    boxShadow: '0px 8px 50px rgba(15,23,42,0.06)',
  },
  wide: {
    boxShadow: '0px 8px 92px rgba(15,23,42,0.10)',
  },
};

export const motion = {
  duration: {
    fast: 150,
    base: 250,
    slow: 400,
  },
  easing: {
    standard: [0.4, 0.0, 0.2, 1] as const,
    decelerate: [0.0, 0.0, 0.2, 1] as const,
    accelerate: [0.4, 0.0, 1, 1] as const,
  },
  stagger: {
    step: 60,
  },
};
