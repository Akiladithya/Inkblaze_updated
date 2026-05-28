// src/styles/theme.js

export const colors = {
  // Primary palette — deep navy + amber accent
  primary: '#1A2B4A',
  primaryLight: '#2E4270',
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentSoft: '#FEF3C7',

  // Backgrounds
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F9',

  // Text
  textPrimary: '#0F1D35',
  textSecondary: '#4B5E7A',
  textMuted: '#8A9BB5',
  textInverse: '#FFFFFF',

  // States
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Borders & Shadows
  border: '#DDE5F0',
  borderLight: '#EEF2F9',
  shadow: 'rgba(26, 43, 74, 0.12)',
  shadowStrong: 'rgba(26, 43, 74, 0.22)',

  // Highlight colors
  highlightYellow: '#FFF176',
  highlightBg: '#FFFDE7',
};

export const typography = {
  // Font families
  fontDisplay: 'Georgia',         // Serif display
  fontBody: 'System',             // System sans-serif
  fontMono: 'Courier New',

  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,

  // Weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 14,
  },
};

export default { colors, typography, spacing, radius, shadows };
