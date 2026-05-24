import { useState, useEffect } from 'react';

interface ProductFilterProps {
  filterSku: string;
  setFilterSku: (v: string) => void;
  filterCat: string[];
  setFilterCat: React.Dispatch<React.SetStateAction<string[]>>;
  filterColor: string[];
  setFilterColor: React.Dispatch<React.SetStateAction<string[]>>;
  filterModelo: string[];
  setFilterModelo: React.Dispatch<React.SetStateAction<string[]>>;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  activeFilters: { key: string; label: string }[];
  clearAll: () => void;
  isMob: boolean;
  setFilterDrawerOpen: (v: boolean) => void;
  products: { cat: string; color: string; modelo: string }[];
  primary: string;
}

const CATS = ["Panadería", "Pasteles", "Galletas", "Bebidas"];
const COLORS = ["Dorado", "Blanco", "Chocolate", "Marrón", "Integral", "Café", "Naranja", "Vainilla", "Variado"];
const MODELS = ["Normal", "Individual", "Mediano", "Grande", "Paquete 6pzas", "Paquete 4pzas", "500ml"];
const CAT_ICONS: Record<string, string> = {
  Panadería: "🥖", Pasteles: "🎂", Galletas: "🍪", Bebidas: "☕"
};

const COLOR_HEX: Record<string, string> = {
  Dorado: "#D2691E", Blanco: "#F5F5F0", Chocolate: "#5D4037", Marrón: "#8B4513",
  Integral: "#8B7355", Café: "#4A3728", Naranja: "#FF8C00", Vainilla: "#F3E5AB", Variado: "#9370DB"
};

const CSS = `
@keyframes tagPop { 0% { transform: scale(0.7); opacity: 0; } 80% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
.clear-tag:hover { background: #ffd4c4 !important; }
.color-swatch { transition: transform .2s; cursor: pointer; }
.color-swatch:hover { transform: scale(1.16); }
`;

function Section({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <div style={{ borderBottom: "1px solid #f0ede6", paddingBottom: 14, marginBottom: 14 }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: isOpen ? 10 : 0, padding: "2px 0" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#aaa", textTransform: "uppercase" }}>{title}</span>
        <span style={{ fontSize: 12, color: "#ccc", transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

export default function ProductFilter({
  filterSku, setFilterSku,
  filterCat, setFilterCat,
  filterColor, setFilterColor,
  filterModelo, setFilterModelo,
  priceMin, setPriceMin,
  priceMax, setPriceMax,
  activeFilters, clearAll,
  isMob, setFilterDrawerOpen,
  products, primary
}: ProductFilterProps) {
  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  const toggle = (_arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => 
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const productCounts = {
    cats: Object.fromEntries(CATS.map(c => [c, products.filter(p => p.cat === c).length])),
    colors: Object.fromEntries(COLORS.map(c => [c, products.filter(p => p.color === c).length])),
    modelos: Object.fromEntries(MODELS.map(m => [m, products.filter(p => p.modelo === m).length]))
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>Filtros</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {activeFilters.length > 0 && (
            <button onClick={() => { clearAll(); setFilterDrawerOpen(false); }} style={{ background: "none", border: "none", fontSize: 11, color: "#e8622a", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Limpiar</button>
          )}
          {isMob && <button onClick={() => setFilterDrawerOpen(false)} style={{ width: 28, height: 28, background: "#f0ede6", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 14, color: "#888" }}>✕</button>}
        </div>
      </div>

      <Section title="Código SKU">
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#ccc", fontSize: 11 }}>🔍</span>
          <input value={filterSku} onChange={e => setFilterSku(e.target.value)} placeholder="Ej: SKU-001"
            style={{ width: "100%", background: "#f5f0e8", border: "1.5px solid #eee", borderRadius: 9, padding: "9px 10px 9px 26px", fontSize: 12, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      </Section>

      <Section title="Categoría">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CATS.map(c => (
            <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: filterCat.includes(c) ? "#1a1a1a" : "#777", fontWeight: filterCat.includes(c) ? 600 : 400, transition: "color .2s" }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${filterCat.includes(c) ? "#1a1a1a" : "#ddd"}`, background: filterCat.includes(c) ? "#1a1a1a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}>
                {filterCat.includes(c) && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
              </span>
              <input type="checkbox" checked={filterCat.includes(c)} onChange={() => toggle(filterCat, setFilterCat, c)} style={{ display: "none" }} />
              {CAT_ICONS[c]} {c}
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#ccc" }}>{productCounts.cats[c]}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Color">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => toggle(filterColor, setFilterColor, c)} title={c} className="color-swatch"
              style={{ width: 28, height: 28, borderRadius: "50%", background: COLOR_HEX[c] || "#ccc", border: filterColor.includes(c) ? "3px solid #1a1a1a" : "2px solid rgba(0,0,0,.12)", boxShadow: filterColor.includes(c) ? "0 0 0 2px #fff inset" : "none", cursor: "pointer", transition: "all .2s", position: "relative" }}>
              {filterColor.includes(c) && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: ["Blanco", "Beige", "Plateado", "Dorado"].includes(c) ? "#555" : "#fff", fontWeight: 700 }}>✓</span>}
            </button>
          ))}
        </div>
        {filterColor.length > 0 && <p style={{ fontSize: 10, color: "#bbb", marginTop: 6 }}>{filterColor.join(", ")}</p>}
      </Section>

      <Section title="Modelo">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 140, overflowY: "auto" }}>
          {MODELS.map(m => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: filterModelo.includes(m) ? "#1a1a1a" : "#777", fontWeight: filterModelo.includes(m) ? 600 : 400 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${filterModelo.includes(m) ? "#1a1a1a" : "#ddd"}`, background: filterModelo.includes(m) ? "#1a1a1a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}>
                {filterModelo.includes(m) && <span style={{ color: "#fff", fontSize: 9 }}>✓</span>}
              </span>
              <input type="checkbox" checked={filterModelo.includes(m)} onChange={() => toggle(filterModelo, setFilterModelo, m)} style={{ display: "none" }} />{m}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Precio">
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <input value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="$ Min" type="number"
            style={{ flex: 1, background: "#f5f0e8", border: "1.5px solid #eee", borderRadius: 8, padding: "8px 9px", fontSize: 12, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif" }} />
          <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
          <input value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="$ Máx" type="number"
            style={{ flex: 1, background: "#f5f0e8", border: "1.5px solid #eee", borderRadius: 8, padding: "8px 9px", fontSize: 12, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      </Section>

      {isMob && (
        <button onClick={() => setFilterDrawerOpen(false)} className="cta-btn"
          style={{ width: "100%", padding: "13px", background: primary, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginTop: 6 }}>
          Aplicar filtros
        </button>
      )}
    </div>
  );
}
