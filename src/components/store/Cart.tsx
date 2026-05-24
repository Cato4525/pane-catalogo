import { useState, useEffect } from 'react';

interface CartItem {
  id: number;
  nombre: string;
  sku: string;
  color: string;
  emoji: string;
  precio: number;
  qty: number;
}

interface CartProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  isMob: boolean;
  onUpdateQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}

const CSS = `
@keyframes slideLeft { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
.cta-btn { transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s; }
.cta-btn:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 10px 28px rgba(26,26,26,.2); }
`;

export default function Cart({ cart, isOpen, onClose, isMob, onUpdateQty, onRemove, onCheckout }: CartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const s = document.createElement('style');
      s.textContent = CSS;
      document.head.appendChild(s);
      return () => { document.head.removeChild(s); };
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)", animation: "fadeIn .3s" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: isMob ? "100%" : "390px", background: "#fafaf8", borderLeft: isMob ? "none" : "1.5px solid #e8e4dc", display: "flex", flexDirection: "column", padding: isMob ? "20px 16px 24px" : "26px", overflowY: "auto", animation: "slideLeft .35s cubic-bezier(.34,1.2,.64,1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>Carrito <span style={{ color: "#ccc", fontWeight: 400, fontSize: 13 }}>({totalQty})</span></h2>
          <button onClick={onClose} style={{ width: 32, height: 32, background: "#f0ede6", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 15, color: "#888" }}>✕</button>
        </div>
        
        {cart.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 44, marginBottom: 10 }}>🛒</span>
            <p style={{ fontSize: 13, color: "#bbb", textAlign: "center" }}>Tu carrito está vacío.</p>
            <button onClick={onClose} className="cta-btn" style={{ marginTop: 14, padding: "9px 22px", background: "#1a1a1a", border: "none", borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Ver tienda</button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              {cart.map((item, i) => (
                <div key={item.id} style={{ display: "flex", gap: 11, padding: "12px 0", borderBottom: "1px solid #f0ede6", animation: `fadeUp .4s ${i * 0.05}s both` }}>
                  <div style={{ width: 50, height: 50, background: "#f5f0e8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{item.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 1px", fontWeight: 600, fontSize: 12, fontFamily: "'Playfair Display',serif" }}>{item.nombre}</p>
                    <p style={{ margin: "0 0 7px", fontSize: 10, color: "#bbb" }}>{item.sku} · {item.color}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f0ede6", borderRadius: 16, padding: "3px 9px" }}>
                        <button onClick={() => onUpdateQty(item.id, -1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#555", lineHeight: 1 }}>−</button>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 14, textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => onUpdateQty(item.id, 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#555", lineHeight: 1 }}>+</button>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Playfair Display',serif" }}>${(item.precio * item.qty).toFixed(2)}</span>
                        <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: 16, transition: "color .2s" }} onMouseEnter={e => (e.target as HTMLElement).style.color = "#e8622a"} onMouseLeave={e => (e.target as HTMLElement).style.color = "#ddd"}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
              <div style={{ borderTop: "1px solid #f0ede6", paddingTop: 16, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ color: "#888", fontSize: 13 }}>Subtotal</span>
                <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Playfair Display',serif" }}>${total.toFixed(2)}</span>
              </div>
              <button className="cta-btn" onClick={onCheckout} style={{ width: "100%", padding: 14, background: "#e8622a", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Proceder al checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
