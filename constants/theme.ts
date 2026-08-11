export const colors = {
  // Verde — color principal
  primary: '#3D6B4F',
  primaryDark: '#2D5040',
  primaryLight: '#52B788',
  primaryMuted: '#EDF5F0',

  // Café — secundario / texto
  coffee: '#5C4A3A',
  coffeeDark: '#3E2E23',
  coffeeLight: '#8B7355',
  coffeeMuted: '#F5F0EB',

  // Dorado — acentos
  gold: '#C4A052',
  goldLight: '#E8D5A3',
  goldMuted: '#FBF6E9',

  // Superficies
  background: '#FAFAF8',
  backgroundWarm: '#F7F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F0EB',
  surfaceElevated: '#FFFFFF',

  // Texto
  text: '#2C2419',
  textSecondary: '#6B5D52',
  textMuted: '#9A8B7E',

  // Bordes
  border: '#E8E2DA',
  borderLight: '#F2EDE6',

  // Estados
  success: '#40916C',
  successBg: '#EDF5F0',
  warning: '#C4A052',
  warningBg: '#FBF6E9',
  danger: '#B5493F',
  dangerBg: '#FDF0EE',
  info: '#5C7A6B',
  infoBg: '#EEF3F0',

  overlay: 'rgba(44, 36, 25, 0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 18 },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#3E2E23',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#3E2E23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3D6B4F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const headerStyle = {
  backgroundColor: colors.surface,
  shadowColor: '#3E2E23',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
  borderBottomWidth: 1,
  borderBottomColor: colors.borderLight,
} as const;

/** Gradiente de marca para login y hero */
export const brandGradient = [colors.primary, colors.coffeeDark] as const;
