// src/styles/theme.js
import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const IS_MOBILE = SCREEN_WIDTH < 768;

export const colors = {
  // Backgrounds
  background:    '#F9F7F4',
  backgroundAlt: '#F2EFE9',
  surface:       '#FFFFFF',
  surfaceAlt:    '#EFECE6',
  surfaceDark:   '#1A1814',

  // Ink
  ink:           '#1A1814',
  inkSoft:       '#2E2B26',

  // Primary — deep forest green
  primary:       '#2D5016',
  primaryLight:  '#3D6B1F',
  primarySoft:   '#EBF2E4',

  // Gold accent
  gold:          '#B8860B',
  goldLight:     '#D4A017',
  goldSoft:      '#FBF5E0',

  // Text
  textPrimary:   '#1A1814',
  textSecondary: '#5C5750',
  textMuted:     '#9C9690',
  textInverse:   '#F9F7F4',

  // States
  success:       '#2D6A4F',
  successSoft:   '#E8F5EE',
  error:         '#9B2335',
  errorSoft:     '#FBEAEC',

  // Borders
  border:        '#E2DDD6',
  borderMid:     '#C8C2B8',
  borderDark:    '#A09890',
};

export const typography = {
  fontDisplay: Platform.select({
    web: "'Cormorant Garamond', 'Garamond', Georgia, serif",
    default: 'Georgia',
  }),
  fontBody: Platform.select({
    web: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: 'System',
  }),
  fontMono: Platform.select({
    web: "'JetBrains Mono', 'Fira Code', monospace",
    default: 'Courier New',
  }),

  xs:    11,
  sm:    13,
  base:  15,
  md:    17,
  lg:    21,
  xl:    26,
  '2xl': 34,
  '3xl': IS_MOBILE ? 38 : 52,

  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',

  tight:   1.15,
  normal:  1.5,
  relaxed: 1.8,
};

export const spacing = {
  xs:    4,
  sm:    8,
  md:    IS_MOBILE ? 14 : 18,
  lg:    IS_MOBILE ? 22 : 30,
  xl:    IS_MOBILE ? 32 : 44,
  '2xl': IS_MOBILE ? 48 : 64,
  '3xl': IS_MOBILE ? 64 : 96,
};

export const radius = {
  sm:   4,
  md:   8,
  lg:   14,
  xl:   20,
  full: 9999,
};

export const shadows = {
  sm: Platform.OS === 'web'
    ? { boxShadow: '0 1px 3px rgba(26,24,20,0.07), 0 1px 2px rgba(26,24,20,0.04)' }
    : { shadowColor: '#1A1814', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2 },

  md: Platform.OS === 'web'
    ? { boxShadow: '0 4px 12px rgba(26,24,20,0.09), 0 1px 3px rgba(26,24,20,0.05)' }
    : { shadowColor: '#1A1814', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 5 },

  lg: Platform.OS === 'web'
    ? { boxShadow: '0 8px 28px rgba(26,24,20,0.11), 0 2px 6px rgba(26,24,20,0.06)' }
    : { shadowColor: '#1A1814', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.11, shadowRadius: 28, elevation: 10 },
};

export default { colors, typography, spacing, radius, shadows, IS_MOBILE };
