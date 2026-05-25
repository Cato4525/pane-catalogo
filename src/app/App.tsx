import { useEffect } from 'react';
import { useStore, useAdminStore } from '../store';
import { THEME_PRESETS, ThemeType } from '../types';
import { useAuthStore } from '../store/authStore';
import AppRouter from './router/AppRouter';

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:'Inter',sans-serif;transition:background-color 0.3s,color 0.3s}

:root {
  --primary: #22c55e;
  --secondary: #10b981;
  --accent: #22c55e;
  --background: #ffffff;
  --surface: #f8fafc;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
}

@keyframes fadeUp {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn {from{opacity:0}to{opacity:1}}
@keyframes slideLeft {from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
@keyframes slideUp {from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn {from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
@keyframes float {0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes pulse {0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes spin {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Button Styles */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 14px;
}
.btn-primary {
  background: var(--primary) !important;
  color: #000 !important;
}
.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}
.btn-secondary {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}
.btn-danger {
  background: var(--error);
  color: #fff !important;
}

/* Card Styles */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
}

/* Input Styles */
.input, input, textarea, select {
  background: var(--background) !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
  transition: all 0.2s;
}
.input:focus, input:focus, textarea:focus, select:focus {
  outline: none !important;
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px var(--primary)22 !important;
}
.input::placeholder {
  color: var(--text-muted) !important;
}

/* Label Styles */
.label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-weight: 600;
}

/* Badge Styles */
.badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.badge-success {
  background: var(--success)22;
  color: var(--success);
}
.badge-inactive {
  background: var(--text-muted)22;
  color: var(--text-muted);
}

/* Table Styles */
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th {
  text-align: left;
  padding: 12px 8px;
  font-size: 11px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  text-transform: uppercase;
}
.table td {
  padding: 12px 8px;
  font-size: 13px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.table tr:hover {
  background: var(--primary)08;
}

/* Page Title */
h1 {
  color: var(--text);
  font-weight: 700;
}
h2, h3 {
  color: var(--text);
}

/* Text Colors */
.text-gray-500, .text-gray-400 {
  color: var(--text-muted) !important;
}
.text-gray-900 {
  color: var(--text) !important;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--background); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
`;

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      color: 'var(--text)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Cargando...
      </div>
    </div>
  )
}

function App() {
  const settings = useStore((state) => state.settings);
  const theme = (settings.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;

  const initialized = useAuthStore((state) => state.initialized);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const fetchProductsFromSupabase = useStore((state) => state.fetchProductsFromSupabase);
  const fetchCategoriesFromSupabase = useStore((state) => state.fetchCategoriesFromSupabase);
  const fetchDirectSalesFromSupabase = useStore((state) => state.fetchDirectSalesFromSupabase);
  const fetchReservas = useAdminStore((state) => state.fetchReservas);
  const fetchConsultas = useAdminStore((state) => state.fetchConsultas);
  const fetchClientes = useAdminStore((state) => state.fetchClientes);

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    fetchProductsFromSupabase()
    fetchCategoriesFromSupabase()
    fetchDirectSalesFromSupabase()
    fetchReservas()
    fetchConsultas()
    fetchClientes()
  }, [])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = GLOBAL_CSS
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    const vars: Record<string, string> = {
      '--primary': themeColors.primary,
      '--secondary': themeColors.secondary,
      '--accent': themeColors.accent,
      '--bg': themeColors.background,
      '--background': themeColors.background,
      '--surface': themeColors.surface,
      '--text': themeColors.text,
      '--text-muted': themeColors.textMuted,
      '--border': themeColors.border,
      '--success': themeColors.success,
      '--warning': themeColors.warning,
      '--error': themeColors.error,
    }
    Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val))
    document.body.style.background = themeColors.background
    document.body.style.color = themeColors.text
  }, [theme, themeColors])

  if (!initialized) return <LoadingScreen />

  return <AppRouter />
}

export default App
