import { palette } from '@/constants/theme';

const tintColorLight = palette.olive;

export default {
  light: {
    text: '#3A3428',
    background: '#FAF6F0',
    tint: tintColorLight,
    tabIconDefault: '#9A8570',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: palette.sand,
    background: palette.olive,
    tint: palette.sand,
    tabIconDefault: '#9A8570',
    tabIconSelected: palette.sand,
  },
};
