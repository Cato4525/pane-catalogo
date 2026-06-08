import { useEffect, useState } from 'react';
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMob = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  useEffect(() => {
    if (!isMob) setSidebarOpen(false);
  }, [isMob]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: themeColors.background }}>
      <Sidebar isMob={isMob} open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />

      {isMob && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 39,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: isMob ? 16 : 24,
        marginLeft: isMob ? 0 : 240,
        paddingTop: isMob ? 64 : 24,
        position: 'relative',
      }}>
        {isMob && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'fixed', top: 12, left: 12, zIndex: 30,
              width: 40, height: 40, borderRadius: 10,
              background: themeColors.surface,
              border: `1px solid ${themeColors.border}`,
              color: themeColors.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
