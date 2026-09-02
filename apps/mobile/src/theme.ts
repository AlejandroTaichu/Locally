// Katıl brand design system — derived from the approved Stitch mockup
// (coral-orange, generously rounded, Inter-like system typography).

export const colors = {
  primary: '#FF7F50',
  primaryDark: '#A43C12',
  onPrimary: '#FFFFFF',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#131D21',
  textSecondary: '#57423B',
  textMuted: '#8B7169',
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
  chip: 16,
  avatar: 999,
};

export const typography = {
  displayMobile: { fontSize: 28, fontWeight: '800' as const, lineHeight: 34 },
  headlineMd: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  headlineSm: { fontSize: 20, fontWeight: '600' as const, lineHeight: 25 },
  bodyLg: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
  bodyMd: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  labelCaps: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
};

export const shadows = {
  card: {
    boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
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
