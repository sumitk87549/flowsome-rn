import { Platform } from 'react-native';

const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export const Typography = {
  displayLarge: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  title: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3 },
  captionSmall: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  timer: { fontSize: 64, fontFamily: serif, letterSpacing: 2 },
  timerLarge: { fontSize: 80, fontFamily: serif, letterSpacing: 4 },

  families: {
    sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    serif,
    mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    display: 36,
  },
};
