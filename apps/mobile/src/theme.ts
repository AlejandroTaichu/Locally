// Katıl brand design system — resolved from the "Katıl Design System" in the
// KatılApp Stitch project (Active Orange seed, Deep Navy secondary, Inter).

export const colors = {
  primary: '#B02F00',
  primaryDark: '#B02F00',
  primaryContainer: '#FF5722',
  onPrimary: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#D3E4FE',
  surfaceContainer: '#E5EEFF',
  border: '#F2E6E2',
  textPrimary: '#0B1C30',
  textSecondary: '#5B4039',
  textMuted: '#907067',
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
  button: 14,
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
