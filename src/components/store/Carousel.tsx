import { useState, useEffect, useCallback } from 'react';

interface Slide {
  id: number;
  emoji: string;
  title: string;
  sub: string;
  tag: string;
  color: string;
  accent: string;
  price: number;
}

interface StoreProduct {
  id: number;
  nombre: string;
  cat: string;
  sku: string;
  precio: number;
}

interface CarouselProps {
  onAdd: (p: StoreProduct) => void;
  isMob: boolean;
}

const SLIDES: Slide[] = [
  { id: 1, emoji: "🥖", title: "Pan Fresco", sub: "Recién horneado cada mañana", tag: "NUEVO", color: "#8B4513", accent: "#D2691E", price: 2.50 },
  { id: 2, emoji: "🎂", title: "Pasteles Especiales", sub: "Para tus celebraciones", tag: "TOP VENTAS", color: "#FF69B4", accent: "#FFB6C1", price: 25.00 },
  { id: 3, emoji: "☕", title: "Café Premium", sub: "El mejor café para ti", tag: "OFERTA", color: "#4A3728", accent: "#C4A77D", price: 4.00 },
  { id: 4, emoji: "🍪", title: "Galletas Artesanales", sub: "Recetas tradicionales", tag: "POPULAR", color: "#DEB887", accent: "#F4A460", price: 5.00 },
];

const PRODUCTS: StoreProduct[] = [
  { id: 1, nombre: "Baguette Francés", cat: "Panadería", sku: "SKU-001", precio: 2.50 },
  { id: 2, nombre: "Croissant", cat: "Panadería", sku: "SKU-002", precio: 3.00 },
  { id: 3, nombre: "Pan Multigrano", cat: "Panadería", sku: "SKU-003", precio: 4.50 },
  { id: 4, nombre: "Pastel de Chocolate", cat: "Pasteles", sku: "SKU-010", precio: 25.00 },
  { id: 5, nombre: "Cheesecake de Fresa", cat: "Pasteles", sku: "SKU-011", precio: 30.00 },
  { id: 6, nombre: "Donas Glaseadas", cat: "Galletas", sku: "SKU-012", precio: 3.50 },
  { id: 7, nombre: "Galletas de Avena", cat: "Galletas", sku: "SKU-020", precio: 5.00 },
  { id: 8, nombre: "Café Latte", cat: "Bebidas", sku: "SKU-030", precio: 4.00 },
  { id: 9, nombre: "Jugo de Naranja", cat: "Bebidas", sku: "SKU-031", precio: 3.00 },
  { id: 10, nombre: "Cono de Helado", cat: "Bebidas", sku: "SKU-040", precio: 2.50 },
  { id: 11, nombre: "Pan de Caja", cat: "Panadería", sku: "SKU-050", precio: 3.50 },
  { id: 12, nombre: "Cupcakes", cat: "Pasteles", sku: "SKU-051", precio: 4.00 },
];

const CSS = `
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(.93); } to { opacity: 1; transform: scale(1); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes tagPop { 0% { transform: scale(0.7); opacity: 0; } 80% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
`;

export default function Carousel({ onAdd, isMob }: CarouselProps) {
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  const go = useCallback((n: number) => {
    if (anim) return;
    setAnim(true);
    setTimeout(() => { setIdx(n); setAnim(false); }, 360);
  }, [anim]);

  useEffect(() => { 
    const t = setInterval(() => go((idx + 1) % SLIDES.length), 5200); 
    return () => clearInterval(t); 
  }, [idx, go]);

  const s = SLIDES[idx];

  return (
    <div style={{ position: "relative", height: isMob ? 300 : 440, borderRadius: isMob ? 18 : 26, overflow: "hidden", background: s.color, transition: "background .7s" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 70% 50%,${s.accent}25 0%,transparent 60%)` }} />
      {!isMob && <div style={{ position: "absolute", top: 20, right: 50, width: 160, height: 160, borderRadius: "50%", border: `2px solid ${s.accent}28`, animation: "spin 22s linear infinite" }} />}
      
      <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%", alignItems: "center", padding: isMob ? "0 24px" : "0 52px", gap: 16 }}>
        <div>
          <span key={`t${idx}`} style={{ display: "inline-block", background: s.accent, color: "#000", fontSize: isMob ? 9 : 10, fontWeight: 800, padding: isMob ? "3px 10px" : "4px 13px", borderRadius: 20, letterSpacing: "0.1em", marginBottom: isMob ? 10 : 16, animation: anim ? "none" : "tagPop .4s ease" }}>{s.tag}</span>
          <h2 key={`h${idx}`} style={{ fontSize: isMob ? 26 : 44, fontWeight: 900, color: "#fff", lineHeight: 1.06, letterSpacing: "-0.03em", marginBottom: isMob ? 8 : 10, fontFamily: "'Playfair Display',serif", animation: anim ? "none" : "fadeUp .5s .08s both" }}>{s.title}</h2>
          <p key={`p${idx}`} style={{ fontSize: isMob ? 12 : 15, color: "rgba(255,255,255,.6)", marginBottom: isMob ? 18 : 24, animation: anim ? "none" : "fadeUp .5s .18s both" }}>{s.sub}</p>
          <button onClick={() => onAdd(PRODUCTS.find(p => p.nombre.includes(s.title.split(' ')[0])) || PRODUCTS[0])} 
            style={{ padding: isMob ? "10px 20px" : "12px 26px", background: s.accent, border: "none", borderRadius: 24, fontSize: isMob ? 12 : 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", color: "#000", animation: anim ? "none" : "fadeUp .5s .26s both" }}>
            Agregar — ${s.price.toFixed(2)}
          </button>
        </div>
        
        {!isMob && (
          <div key={`e${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", animation: anim ? "none" : "scaleIn .5s .1s both" }}>
            <div style={{ width: 190, height: 190, background: "rgba(255,255,255,.08)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 86, border: `2px solid ${s.accent}38`, animation: "float 3.5s ease-in-out infinite" }}>{s.emoji}</div>
          </div>
        )}
      </div>

      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 3 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)} style={{ width: i === idx ? 22 : 6, height: 6, borderRadius: 4, background: i === idx ? s.accent : "rgba(255,255,255,.3)", border: "none", cursor: "pointer", transition: "all .4s", padding: 0 }} />
        ))}
      </div>

      <button onClick={() => go((idx - 1 + SLIDES.length) % SLIDES.length)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", fontSize: 16, cursor: "pointer", backdropFilter: "blur(8px)", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
      <button onClick={() => go((idx + 1) % SLIDES.length)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", fontSize: 16, cursor: "pointer", backdropFilter: "blur(8px)", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
    </div>
  );
}
