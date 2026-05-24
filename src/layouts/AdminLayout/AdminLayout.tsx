import { useEffect } from 'react';
import { useStore } from '../../store';
import { THEME_PRESETS, ThemeType } from '../../types';
import { Sidebar } from './Sidebar';

function useIsMobile(bp = 768) {
  const [mob, setMob] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= bp : false));
  useEffect(() => {
    const h = () => setMob(window.innerWidth <= bp);
    window.addEventListener('resize', h, { passive: true });
    return () => window.removeEventListener('resize', h);
  }, [bp]);
  return mob;
}

import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMob = useIsMobile();
  const settings = useStore((state) => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', themeColors.primary);
    root.style.setProperty('--background', themeColors.background);
    root.style.setProperty('--surface', themeColors.surface);
    root.style.setProperty('--text', themeColors.text);
    root.style.setProperty('--text-muted', themeColors.textMuted);
    root.style.setProperty('--border', themeColors.border);
  }, [themeColors]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: themeColors.background }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 24, marginLeft: 240 }}>
        {children}
      </main>
    </div>
  );
}
