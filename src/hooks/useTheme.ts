import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'pd_theme';

/** Lê o tema já aplicado pelo script inline do index.html (evita flash na 1ª pintura). */
const readInitialTheme = (): ThemeMode => {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

/**
 * Modo Claro / Escuro do site.
 * Aplica a classe `dark` no <html>, persiste a escolha e sincroniza a cor da
 * barra do navegador (theme-color) para o fundo realmente mudar em todo lugar.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark';

    root.classList.toggle('dark', isDark);
    root.style.backgroundColor = isDark ? '#0A0908' : '#F6F5F3';

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* modo privado / storage bloqueado: o tema segue válido só nesta sessão */
    }

    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', isDark ? '#0A0908' : '#F6F5F3'));
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, isDark: theme === 'dark', setTheme, toggleTheme };
};
