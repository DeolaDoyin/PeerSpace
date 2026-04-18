import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;

    // Initial load from localStorage/system
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    html.classList.toggle('dark', initialDark);

    // Sync state after class update (avoids direct setState in effect)
    requestAnimationFrame(() => {
      setIsDark(html.classList.contains('dark'));
    });

    // System preference listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('theme')) {
        const isSystemDark = mediaQuery.matches;
        html.classList.toggle('dark', isSystemDark);
        requestAnimationFrame(() => setIsDark(html.classList.contains('dark')));
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !html.classList.contains('dark');
    html.classList.toggle('dark', !newIsDark); // Toggle based on current
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    setIsDark(newIsDark);
  };

  return { isDark, toggleTheme };
};
