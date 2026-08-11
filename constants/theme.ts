/** Paleta base — café natural / oliva */
export const palette = {
  sand: '#DCC9B0',
  tan: '#A7805A',
  coffee: '#81634A',
  sage: '#AEA781',
  olive: '#555842',
} as const;

export const colors = {
  // Oliva — color principal
  primary: palette.olive,
  primaryDark: '#434832',
  primaryLight: palette.sage,
  primaryMuted: '#E8E6DC',

  // Café — secundario / texto
  coffee: palette.coffee,
  coffeeDark: '#5A4635',
  coffeeLight: palette.tan,
  coffeeMuted: '#F0E8DC',

  // Arena / tan — acentos cálidos
  gold: palette.tan,
  goldLight: palette.sand,
  goldMuted: '#F5EDE3',

  // Superficies
  background: '#FAF6F0',
  backgroundWarm: palette.sand,
  surface: '#FFFCF8',
  surfaceAlt: '#F0E8DC',
  surfaceElevated: '#FFFCF8',

  // Texto
  text: '#3A3428',
  textSecondary: palette.coffee,
  textMuted: '#9A8570',

  // Bordes
  border: '#D4C4AE',
  borderLight: '#E8DFD3',

  // Estados
  success: palette.olive,
  successBg: '#E8E6DC',
  warning: palette.tan,
  warningBg: '#F5EDE3',
  danger: '#A65D4A',
  dangerBg: '#F8EBE8',
  info: palette.coffee,
  infoBg: '#EDE8DF',

  overlay: 'rgba(58, 52, 40, 0.45)',
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
    shadowColor: palette.coffee,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: palette.coffee,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.olive,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const headerStyle = {
  backgroundColor: colors.surface,
  shadowColor: palette.coffee,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
  borderBottomWidth: 1,
  borderBottomColor: colors.borderLight,
} as const;

/** Gradiente de marca para login y hero */
export const brandGradient = [palette.olive, palette.coffee] as const;

/** Acento para módulo cocina */
export const kitchenAccent = palette.tan;
