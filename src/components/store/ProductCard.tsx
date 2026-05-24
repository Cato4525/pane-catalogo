import { useState, useEffect, useRef } from 'react';

interface StoreProduct {
  id: number;
  nombre: string;
  cat: string;
  sku: string;
  precio: number;
  color: string;
  modelo: string;
  desc: string;
  emoji: string;
  tag: string | null;
}

interface ProductCardProps {
  p: StoreProduct;
  onAdd: (p: StoreProduct) => void;
  delay?: number;
  onDetail: () => void;
  isMob: boolean;
  themeColors?: {
    primary: string;
    accent: string;
    text: string;
    textMuted: string;
    surface?: string;
    background?: string;
    border?: string;
    success?: string;
  };
  isDark?: boolean;
}

const COLOR_HEX: Record<string, string> = {
  Dorado: "#D2691E", Blanco: "#F5F5F0", Chocolate: "#5D4037", Marrón: "#8B4513",
  Integral: "#8B7355", Café: "#4A3728", Naranja: "#FF8C00", Vainilla: "#F3E5AB", Variado: "#9370DB"
};

function useReveal(t = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); o.disconnect(); }
    }, { threshold: t });
    o.observe(el);
    return () => { o.disconnect(); };
  }, [t]);
  return [ref as React.RefObject<HTMLDivElement>, vis] as const;
}

const CSS = `
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.product-card { transition: transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s; }
.product-card:hover { transform: translateY(-5px) scale(1.012); box-shadow: 0 16px 48px rgba(0,0,0,.1); }
.product-card:hover .card-emoji { animation: float 2s ease-in-out infinite; }
.product-card:hover .add-btn { background: #e8622a !important; }
.add-btn { transition: background .25s, transform .18s; }
.add-btn:active { transform: scale(.94) !important; }
`;

export default function ProductCard({ p, onAdd, delay = 0, onDetail, isMob, themeColors, isDark }: ProductCardProps) {
  const tc = themeColors || { primary: '#4ade80', accent: '#4ade80', text: '#1a1a1a', textMuted: '#666' };
  const primary = tc.primary;
  const [ref, vis] = useReveal(0.06);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  const handle = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    onAdd(p); 
    setAdded(true); 
    setTimeout(() => setAdded(false), 1300); 
  };

  return (
    <div ref={ref} className="product-card" onClick={onDetail}
      style={{
        background: isDark ? tc.surface || '#1a1a1a' : '#fff', 
        border: `1.5px solid ${isDark ? tc.border || '#333' : '#e8e4dc'}`, 
        borderRadius: 18, 
        overflow: 'hidden', 
        cursor: 'pointer',
        opacity: vis ? 1 : 0, 
        transform: vis ? 'none' : 'translateY(26px)',
        transition: `opacity .5s ${delay}s,transform .6s ${delay}s cubic-bezier(.34,1.2,.64,1)`
      }}>
      <div style={{ background: isDark ? tc.background || '#111' : "#f5f0e8", height: isMob ? 130 : 150, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMob ? 52 : 58, position: "relative" }}>
        <span className="card-emoji" style={{ display: "inline-block" }}>{p.emoji}</span>
        {p.tag && (
          <span style={{ position: "absolute", top: 9, left: 9, background: p.tag === "Oferta" ? primary : p.tag === "Nuevo" ? primary : "#059669", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 16, letterSpacing: "0.06em" }}>
            {p.tag.toUpperCase()}
          </span>
        )}
        <div title={p.color} style={{ position: "absolute", bottom: 8, right: 8, width: 14, height: 14, borderRadius: "50%", background: COLOR_HEX[p.color] || "#ccc", border: "2px solid rgba(255,255,255,.8)", boxShadow: "0 1px 4px rgba(0,0,0,.15)" }} />
      </div>
      
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <p style={{ fontSize: 9, color: tc.textMuted || "#bbb", letterSpacing: "0.1em", textTransform: "uppercase" }}>{p.cat}</p>
          <span style={{ fontSize: 9, color: tc.textMuted || "#c0b8ac" }}>{p.sku}</span>
        </div>
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.02em", fontFamily: "'Playfair Display',serif", color: tc.text || '#1a1a1a' }}>{p.nombre}</h3>
        <p style={{ fontSize: 10, color: tc.textMuted || "#b0a898", margin: "0 0 4px", fontStyle: "italic" }}>{p.modelo} · {p.color}</p>
        <p style={{ fontSize: 10, color: tc.textMuted || "#aaa", margin: "0 0 10px", lineHeight: 1.4 }}>{p.desc}</p>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", fontFamily: "'Playfair Display',serif", color: primary }}>${p.precio.toFixed(2)}</span>
          <button onClick={handle} className="add-btn"
            style={{ padding: "7px 14px", background: added ? (tc.success || '#059669') : primary, border: "none", borderRadius: 18, color: isDark ? "#000" : "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", minWidth: 90, transition: "background .25s" }}>
            {added ? "✓ Agregado" : "+ Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}
