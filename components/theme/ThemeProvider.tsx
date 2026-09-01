import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { palettes, theme as defaultTheme, type Palette } from '@/constants/theme';

export type PaletteKey = keyof typeof palettes;

interface ThemeContextValue {
  palette: Palette;
  key: PaletteKey;
  setKey: (key: PaletteKey) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<PaletteKey>('olivo');
  const value = useMemo<ThemeContextValue>(() => ({ palette: palettes[key], key, setKey }), [key]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return { palette: defaultTheme, key: 'olivo', setKey: () => {} };
}
