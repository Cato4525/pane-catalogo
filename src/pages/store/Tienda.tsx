import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useAuthStore } from '../../store/authStore';
import { Product, CatalogoSeccion, StockByVariant, ConsultaProducto } from '../../types';
import { fetchCatalogos } from '../../services/catalogosService';
import { dataService } from '../../services/dataService';
import ReservaModal from '../../components/store/ReservaModal';
import AuthModal from '../../components/store/AuthModal';
import MisReservas from '../../components/store/MisReservas';
import { calcularMejorCampania } from '../../services/promocionesService';
import { SearchIcon, CartIcon, HomeIcon, PackageIcon, ChatIcon, UserIcon, TrashIcon, MailIcon, PhoneIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, MinusIcon, PlusIcon, CheckIcon } from './Icons';
import './store.css';

const defaultSlides = [
  { id: 1, tag: "NUEVA COLECCIÓN", titleLines: ["Lo mejor", "para ti"], sub: "Descubre nuestra selección de leggings de mujer.", image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=85", price: 25000 },
  { id: 2, tag: "TOP VENTAS", titleLines: ["Frescura", "excepcional"], sub: "Los favoritos de nuestras clientas.", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=85", price: 30000 },
];

const V_TICKER = ["✦ ENVÍO gratis", "✦ LEGGINGS DE CALIDAD", "✦ PAGOS 100% SEGUROS", "✦ DEVOLUCIONES SIN COSTO"];

interface CartItem extends Product { 
  qty: number; 
  variantKey?: string;
  colorId?: string;
  colorName?: string;
  colorHex?: string;
  sizeId?: string;
  sizeName?: string;
}

export default function Tienda() {
  const settings = useStore((state) => state.settings);
  const clientes = useStore((state) => state.clientes);
  const incrementVisitas = useStore((state) => state.incrementVisitas);
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const colores = useStore((state) => state.colors);
  const modelos = useStore((state) => state.modelos);
  const addConsulta = useStore((state) => state.addConsulta);
  const [slideIndex, setSlideIndex] = useState(0);

  const activeProducts = products.filter(p => p.status === 'active').slice(0, 7);
  const V_SLIDES = activeProducts.length > 0 ? activeProducts.map((p) => ({
    id: p.id,
    tag: p.estado_catalogo?.toUpperCase() || 'NUEVO',
    titleLines: [p.name.split(' ')[0] || 'Nuevo', p.name.split(' ').slice(1).join(' ') || 'Producto'],
    sub: p.description?.slice(0, 60) || 'Disponible en nuestra tienda',
    image: p.images?.[0] || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&q=85',
    price: p.price
  })) : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % V_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [V_SLIDES.length]);

  useEffect(() => {
    incrementVisitas();
  }, [incrementVisitas]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'catalogo') {
      setTimeout(() => catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 300)
    } else if (hash === 'contacto') {
      setPage('contacto')
    } else if (hash === 'nosotros') {
      setPage('nosotros')
    }
  }, [])
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detalle, setDetalle] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [consultaOpen, setConsultaOpen] = useState(false);
  const [reservaOpen, setReservaOpen] = useState(false);
  const [reservaTipo] = useState<'con_abono'>('con_abono');
  const [filterCat, setFilterCat] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [page, setPage] = useState<"tienda" | "contacto" | "nosotros">("tienda");
  const [contactForm, setContactForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [authOpen, setAuthOpen] = useState(false);
  const [misReservasOpen, setMisReservasOpen] = useState(false);
  const [promoActiva, setPromoActiva] = useState(false)
  const [catalogos, setCatalogos] = useState<CatalogoSeccion[]>([])
  const [variantPicker, setVariantPicker] = useState<{ product: Product; variants: StockByVariant[] } | null>(null)
  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string>('')
  const [promoResult, setPromoResult] = useState<{
    subtotal: number; totalDiscount: number; envio: number; envioGratis: boolean;
    total: number; promocionesAplicadas: { descripcion: string }[];
  } | null>(null)

  const user = useAuthStore(s => s.user)
  const isClienteLogueado = !!user
  const clienteNombre = user?.nombre || ''
  const handleLogout = () => useAuthStore.getState().logout()

  const productGridRef = useRef<HTMLDivElement>(null)
  const catalogSectionRef = useRef<HTMLElement>(null)
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0)
  const rawSubtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const costoEnvioBase = settings?.costo_envio ?? 5
  const subtotal = (promoActiva && promoResult) ? promoResult.subtotal : rawSubtotal
  const descuentoTotal = (promoActiva && promoResult) ? promoResult.totalDiscount : 0
  const costoEnvio = (promoActiva && promoResult) ? promoResult.envio : costoEnvioBase
  const total = (promoActiva && promoResult) ? promoResult.total : (rawSubtotal + costoEnvioBase)

  const toast = (msg: string) => {
    const el = document.getElementById('toastWrap')
    if (el) { el.innerHTML = `<div style="background:#222;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;margin-bottom:6px;animation:fadeIn .3s">${msg}</div>`; setTimeout(() => el.innerHTML = '', 2500) }
  }

  const handleAddProduct = (product: Product) => {
    const variants = (product as any).stockByVariants as StockByVariant[] | undefined
    if (variants && variants.length > 0) {
      setVariantPicker({ product, variants })
      return
    }
    addToCart(product)
    toast(`${product.name} añadido`)
  }

  const addToCart = (product: Product, variant?: any) => {
    setCart(prev => {
      const key = variant ? `${product.id}-${variant.colorId || ''}-${variant.sizeId || ''}` : product.id
      const existing = prev.find(i => {
        if (variant && i.variantKey) return i.variantKey === key
        return i.id === product.id && !i.variantKey
      })
      if (existing) return prev.map(i => (i === existing ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { ...product, qty: 1, variantKey: variant ? key : undefined, ...(variant || {}) }]
    })
  }

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.id !== productId))

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  useEffect(() => {
    fetchCatalogos().then(list => {
      const seen = new Set<string>()
      setCatalogos(list.filter(c => { if (seen.has(c.nombre)) return false; seen.add(c.nombre); return true }))
    })
  }, [])

  useEffect(() => {
    if (cart.length === 0) { setPromoResult(null); setPromoActiva(false); return }
    const costo = settings?.costo_envio ?? 5
    calcularMejorCampania(
      cart.map(i => ({ producto: i, cantidad: i.qty })),
      costo
    ).then((r: any) => {
      if (r) {
        setPromoResult({
          subtotal: r.subtotalOriginal,
          totalDiscount: r.descuentoTotal,
          envio: r.envio,
          envioGratis: r.envioGratis,
          total: r.total,
          promocionesAplicadas: r.promocionesAplicadas,
        })
      } else { setPromoResult(null) }
      setPromoActiva(false)
    })
  }, [cart, settings?.costo_envio])

  const handleContactSubmit = async () => {
    if (!contactForm.mensaje.trim()) {
      toast('Por favor escribe un mensaje');
      return;
    }
    const now = new Date().toISOString()
    const primerProducto = products.find(p => p.status === 'active')
    const consultaDB = {
      product_id: primerProducto?.id || '',
      cliente_nombre: contactForm.nombre || 'Anónimo',
      cliente_email: contactForm.email || '',
      mensaje: contactForm.mensaje,
      origen: 'tienda',
      created_at: now,
    }
    const phone = settings?.contacts?.whatsapp?.replace(/\D/g, '') || '593999999999';
    const mensaje = `*Nuevo mensaje de contacto*\n\n*Nombre:* ${contactForm.nombre || 'No especificado'}\n*Email:* ${contactForm.email || 'No especificado'}\n\n*Mensaje:*\n${contactForm.mensaje}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
    const wa = window.open(url, '_blank');
    if (!wa) {
      window.location.href = url;
    }
    let consultaCreada: ConsultaProducto | null = null
    try {
      const saved = await dataService.createConsulta(consultaDB)
      if (saved) consultaCreada = saved
    } catch (e) {
      console.error('Error guardando consulta:', e)
    }
    const consulta: ConsultaProducto = {
      id: consultaCreada?.id || `CON-${Date.now()}`,
      product_id: primerProducto?.id || '',
      fecha: now,
      origen: 'tienda'
    }
    addConsulta(consulta)
    toast('Mensaje enviado por WhatsApp');
    setContactForm({ nombre: '', email: '', mensaje: '' });
  };

  const selectedCatalogo = catalogos.find(c => c.id === selectedCatalogoId)
  const catalogoProductIds = selectedCatalogo && selectedCatalogo.nombre !== 'Todos'
    ? new Set(selectedCatalogo.productos?.map(p => p.producto_id) || [])
    : null

  const filtered = products.filter(p => {
    const matchesCat = filterCat.length === 0 || filterCat.includes(p.category);
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCatalogo = !catalogoProductIds || catalogoProductIds.has(p.id);
    return matchesCat && matchesSearch && matchesCatalogo;
  });

  const ITEMS_PER_PAGE = 20;
  const [prodPage, setProdPage] = useState(1);
  const totalProdPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((prodPage - 1) * ITEMS_PER_PAGE, prodPage * ITEMS_PER_PAGE);

  const storeCategories = categories.filter(c => c.status === 'active');
  const storeColors = colores.filter(c => c.status === 'active').map(c => c.nombre);
  const storeModelos = modelos.filter(m => m.status === 'active').map(m => m.nombre);
  const modelosMap = Object.fromEntries(modelos.filter(m => m.status === 'active').map(m => [m.id, m.nombre]));

  const storeName = settings?.storeName || "VELOUR";
  const logo = settings?.logo;
  const nosotros = settings?.nosotros;
  const clientesCount = clientes?.length || 0;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: settings?.backgroundImage 
        ? `url(${settings.backgroundImage}) center/cover fixed no-repeat` 
        : "#fdf8f6", 
      fontFamily: "'Jost',sans-serif", 
      color: "#2b1f23", 
      overflowX: "hidden" 
    }}>
      {settings?.backgroundImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none', zIndex: 0 }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
      <nav className="v-nav">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none" }}>
          {logo ? (
            <>
              <img src={logo} alt={storeName} style={{ height: 50, objectFit: 'contain' }} />
              <span className="v-logo-tag">{storeName}</span>
              <span className="v-logo-line"></span>
            </>
          ) : (
            <>
              <span className="v-logo">{storeName.slice(0,3).toUpperCase()}<span>O</span>UR</span>
              <span className="v-logo-tag">{storeName}</span>
              <span className="v-logo-line"></span>
            </>
          )}
        </div>
        <ul className="v-nav-links">
          <li><a href="#" onClick={(e) => { e.preventDefault(); setPage("tienda"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Inicio</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); setPage("tienda"); setTimeout(() => catalogSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}>Catálogo</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); setPage("contacto"); }}>Contacto</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/tienda/promociones'); }}>Promociones</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); setPage("nosotros"); }}>Nosotros</a></li>
          {isClienteLogueado ? (
            <>
              <li><a href="#" onClick={() => setMisReservasOpen(true)}>Mis Reservas</a></li>
              <li><a href="#" onClick={handleLogout} style={{ color: 'var(--rose-dk)' }}>Cerrar Sesión</a></li>
            </>
          ) : (
            <li><a href="#" onClick={() => setAuthOpen(true)}>Iniciar Sesión</a></li>
          )}
        </ul>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="v-search-wrap">
            <span className="v-search-icon"><SearchIcon /></span>
            <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage("tienda"); }} placeholder="Buscar..." className="v-search" />
          </div>
          <button className="v-cart-btn" onClick={() => setCartOpen(true)}>
            <span><CartIcon /></span>
            <span style={{ marginLeft: 6 }}>Carrito</span>
            {totalQty > 0 && <div className="v-cart-n">{totalQty}</div>}
          </button>
        </div>
      </nav>

      {page === "tienda" && (
        <>
          <section className="v-hero">
            <div style={{ height: "100%", position: "relative", overflow: "hidden" }}>
              <div className="v-track" style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
                {V_SLIDES.map((s, i) => (
                  <div key={s.id} className={`v-slide ${i === slideIndex ? 'active' : ''}`}>
                    <div className="v-slide-txt">
                      <div className="v-s-label">{s.tag}</div>
                      <h1 className="v-s-title">{s.titleLines[0]}<br /><em>{s.titleLines[1]}</em></h1>
                      <p className="v-s-sub">{s.sub}</p>
                      <div className="v-s-cta">
                        <button className="v-btn-p" onClick={() => productGridRef.current?.scrollIntoView({ behavior: "smooth" })}>Ver Colección</button>
                        <button className="v-btn-o" onClick={() => setPage("contacto")}>Contacto</button>
                      </div>
                    </div>
                    <div className="v-slide-img"><img src={s.image} alt={s.titleLines[0]} /></div>
                    <div className="v-price-tag">${s.price.toLocaleString()}</div>
                    <div className="v-product-count-badge">
                      <span className="v-pcb-num">{products.filter(p => p.status === 'active').length}</span>
                      <span className="v-pcb-label">productos activos</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="v-dots">
                {V_SLIDES.map((_, i) => <div key={i} className={`v-dot ${i === slideIndex ? 'active' : ''}`} onClick={() => setSlideIndex(i)} />)}
              </div>
              <div className="v-arrows">
                <button className="v-arr" onClick={() => setSlideIndex((slideIndex - 1 + V_SLIDES.length) % V_SLIDES.length)}><ChevronLeftIcon /></button>
                <button className="v-arr" onClick={() => setSlideIndex((slideIndex + 1) % V_SLIDES.length)}><ChevronRightIcon /></button>
              </div>
            </div>
          </section>
          <div className="v-marquee">
            <div className="v-marquee-inner">
              {[...V_TICKER, ...V_TICKER].map((t, i) => <span key={i} className="v-marq-item">{t}</span>)}
            </div>
          </div>
          <section className="v-section" id="catalogo" ref={catalogSectionRef}>
            <div className="v-sec-header">
              <div>
                <div className="v-sec-eyebrow">{searchQuery ? `Buscando: "${searchQuery}"` : 'Nuestra Selección'}</div>
                <h2 className="v-sec-title">{searchQuery ? `${filtered.length} resultados` : <>Catálogo <em>Completo</em></>}</h2>
                {!searchQuery && (
                  <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                    {products.filter(p => p.status === 'active').length} productos activos
                  </p>
                )}
                {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "var(--rose-dk)", cursor: "pointer", fontSize: 12, marginTop: 8 }}>← Limpiar</button>}
              </div>
              <div>
                <div className="v-filters" style={{ marginBottom: 6 }}>
                  <button className={`v-ftab ${filterCat.length === 0 ? 'active' : ''}`} onClick={() => setFilterCat([])}>Todos</button>
                  {catalogos.map(cat => (
                    <button
                      key={cat.id}
                      className={`v-ftab ${selectedCatalogoId === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCatalogoId(selectedCatalogoId === cat.id ? '' : cat.id)}
                    >{cat.nombre}</button>
                  ))}
                </div>
                <div className="v-filters">
                  {storeCategories.map(cat => <button key={cat.id} className={`v-ftab ${filterCat.includes(cat.id) ? 'active' : ''}`} onClick={() => setFilterCat([cat.id])}>{cat.name}</button>)}
                </div>
              </div>
            </div>
            <div className="v-pgrid" ref={productGridRef}>
              {paginatedProducts.map((p, i) => (
                <div key={p.id} className="v-pcard" style={{ animationDelay: `${i * 0.06}s` }}>
                  {(p.en_liquidacion || p.estado_catalogo === 'exclusivo' || p.estado_catalogo === 'tendencia') && <span className={`v-pbadge ${p.en_liquidacion ? 'v-b-sale' : 'v-b-new'}`}>{p.en_liquidacion ? 'Oferta' : p.estado_catalogo}</span>}
                  <button className="v-pwish" onClick={() => toast(`${p.name} agregado a favoritos`)}><HeartIcon /></button>
                  <div className="v-pimg">
                    <div className="v-pplaceholder">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <PackageIcon />}</div>
                    <div className="v-poverlay">
                      <button className="v-ov-btn v-ov-btn-p" onClick={(e) => { e.stopPropagation(); handleAddProduct(p); }}>+ Agregar</button>
                      <button className="v-ov-btn v-ov-btn-s" onClick={() => setDetalle(p)}>Ver Detalle</button>
                    </div>
                    <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, pointerEvents: 'none', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {p.codigo && <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.05em', fontFamily: "'Cormorant Garamond',serif" }}>{p.codigo}</div>}
                      {(p.images?.length || 0) > 1 && <div style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>{p.images?.length} fotos</div>}
                    </div>
                  </div>
                  <div className="v-pinfo">
                    <div style={{ fontSize: 10, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 1 }}>{categories.find(c => c.id === p.category)?.name || ''}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.2, marginBottom: 4 }}>{p.name}</div>
                    {p.stockByVariants && p.stockByVariants.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                        {[...new Map(p.stockByVariants.filter(v => v.stock > 0).map(v => [v.colorId, v]))].map(([_, v]) => (
                          <span key={v.colorId} style={{
                            width: 12, height: 12, borderRadius: '50%',
                            background: v.colorHex || '#ccc',
                            border: '1px solid #d1d5db', display: 'inline-block',
                          }} title={v.colorName} />
                        ))}
                        {[...new Set(p.stockByVariants.filter(v => v.stock > 0).map(v => v.colorId))].length > 0 ? (
                          <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 2 }}>
                            {[...new Set(p.stockByVariants.filter(v => v.stock > 0).map(v => v.colorId))].length} colores
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: '#ef4444' }}>sin stock</span>
                        )}
                      </div>
                    )}
                    <div className="v-pfooter">
                      <span className="v-pprice">${p.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalProdPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
                <button
                  onClick={() => setProdPage(p => Math.max(1, p - 1))}
                  disabled={prodPage === 1}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--rose-dk)', background: 'transparent', color: 'var(--rose-dk)', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: prodPage === 1 ? 0.4 : 1 }}
                >← Anterior</button>
                {Array.from({ length: totalProdPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setProdPage(p)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: p === prodPage ? 'var(--rose-dk)' : 'transparent',
                      color: p === prodPage ? '#fff' : 'var(--rose-dk)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600
                    }}
                  >{p}</button>
                ))}
                <button
                  onClick={() => setProdPage(p => Math.min(totalProdPages, p + 1))}
                  disabled={prodPage === totalProdPages}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--rose-dk)', background: 'transparent', color: 'var(--rose-dk)', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: prodPage === totalProdPages ? 0.4 : 1 }}
                >Siguiente →</button>
              </div>
            )}
          </section>
          <div className="v-banner">
            <div className="v-banner-txt">
              <div className="v-ban-eye">✿ Colección Destacada</div>
              <h2 className="v-ban-title">Leggings que te <span>hacen sentir</span><br />increíble</h2>
              <p className="v-ban-desc">Calidad premium para ti.</p>
              <div className="v-ban-stats">
                <div><div className="v-stat-n">{clientesCount}+</div><div className="v-stat-l">Clientas</div></div>
                <div><div className="v-stat-n">{products.length}</div><div className="v-stat-l">Modelos</div></div>
              </div>
              <button className="v-btn-p" onClick={() => productGridRef.current?.scrollIntoView({ behavior: "smooth" })}>Ver Catálogo</button>
            </div>
            <div className="v-banner-vis"><div className="v-ban-box"><img src="https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80" alt="Destacado" /></div></div>
          </div>
        </>
      )}

      {page === "contacto" && (
        <section className="v-section" style={{ paddingTop: 120 }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="v-sec-header">
              <div><div className="v-sec-eyebrow">Contáctanos</div><h2 className="v-sec-title">Estamos aquí <em>para ti</em></h2></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }} className="contact-grid">
              <div>
                <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 12, padding: '20px 24px' }}>
                  <p style={{ fontSize: 15, color: "var(--mauve)", marginBottom: 24 }}>Cualquier duda sobre productos, pedidos o colaboraciones.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 15, background: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '12px 16px' }}><div style={{ width: 44, height: 44, background: "var(--petal)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--rose-dk)" }}><MailIcon /></div><div><p style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase" }}>Email</p><p style={{ fontSize: 14, color: '#111', fontWeight: 600 }}>{settings?.contacts?.email || 'hola@email.com'}</p></div></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 15, background: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '12px 16px' }}><div style={{ width: 44, height: 44, background: "var(--petal)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--rose-dk)" }}><PhoneIcon /></div><div><p style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase" }}>WhatsApp</p><p style={{ fontSize: 14, color: '#111', fontWeight: 600 }}>{settings?.contacts?.whatsapp || '+57 300 000 0000'}</p></div></div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#fff", padding: 30, borderRadius: 16, border: "1px solid rgba(244,194,200,0.4)" }} className="contact-form">
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, fontFamily: "'Cormorant Garamond',serif" }}>Escríbenos</h3>
                <input 
                  placeholder="Tu nombre" 
                  value={contactForm.nombre}
                  onChange={(e) => setContactForm({...contactForm, nombre: e.target.value})}
                  style={{ width: "100%", padding: 12, marginBottom: 12, border: "1px solid #e8e4dc", borderRadius: 8 }} 
                />
                <input 
                  placeholder="Tu email" 
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  style={{ width: "100%", padding: 12, marginBottom: 12, border: "1px solid #e8e4dc", borderRadius: 8 }} 
                />
                <textarea 
                  placeholder="Tu mensaje" 
                  rows={4}
                  value={contactForm.mensaje}
                  onChange={(e) => setContactForm({...contactForm, mensaje: e.target.value})}
                  style={{ width: "100%", padding: 12, marginBottom: 12, border: "1px solid #e8e4dc", borderRadius: 8 }} 
                />
                <button className="v-btn-p" style={{ width: "100%" }} onClick={handleContactSubmit}>Enviar mensaje</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {page === "nosotros" && (
        <section className="v-section" style={{ paddingTop: 120 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div className="v-sec-header" style={{ justifyContent: "center" }}>
              <div>
                <div className="v-sec-eyebrow">Nuestra Historia</div>
                <h2 className="v-sec-title">{nosotros?.titulo || "Conócenos"} <em>más</em></h2>
              </div>
            </div>
            <p style={{ fontSize: 16, color: "var(--mauve)", lineHeight: 1.8, marginBottom: 20 }}>{nosotros?.descripcion || "Comprometidos con la calidad y excelencia."}</p>
            
            {nosotros?.historia && (
              <p style={{ fontSize: 14, color: "var(--gray)", lineHeight: 1.8, marginBottom: 40, maxWidth: 700, margin: "0 auto 40px" }}>{nosotros.historia}</p>
            )}
            
            {nosotros?.imagen_principal && (
              <div style={{ marginBottom: 40 }}>
                <img src={nosotros.imagen_principal} alt="Nosotros" style={{ maxWidth: "100%", borderRadius: 12, maxHeight: 300, objectFit: "cover" }} />
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
              <div><div style={{ fontSize: 48, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--rose-dk)" }}>{nosotros?.anos_experiencia || 5}+</div><div style={{ fontSize: 12, color: "var(--gray)", textTransform: "uppercase" }}>Años</div></div>
              <div><div style={{ fontSize: 48, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--rose-dk)" }}>{clientesCount}+</div><div style={{ fontSize: 12, color: "var(--gray)", textTransform: "uppercase" }}>Clientes</div></div>
            </div>
            
            {nosotros?.valores && nosotros.valores.length > 0 && (
              <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                {nosotros.valores.map((valor, idx) => (
                  <span key={idx} style={{ padding: "8px 16px", background: "var(--petal)", borderRadius: 20, fontSize: 12, color: "var(--mauve)" }}>{valor}</span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="v-toast-wrap" id="toastWrap"></div>
      <button className="v-fab" onClick={() => setCartOpen(true)}><span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CartIcon /></span>{totalQty > 0 && <span className="v-fab-badge">{totalQty}</span>}</button>
      <div className="v-footer">
          {logo ? (
            <>
              <img src={logo} alt={storeName} style={{ height: 36, objectFit: 'contain' }} />
              <span style={{ marginLeft: 12, fontFamily: "'Cormorant Garamond',serif", color: "var(--rose)", fontSize: "1.2rem", fontWeight: 700 }}>{storeName}</span>
            </>
          ) : (
            <div className="v-f-logo">{storeName.slice(0,3).toUpperCase()}<span>O</span>UR</div>
          )}
          <div>© 2026 · {storeName} · Todos los derechos reservados</div>
        </div>
      <div className="v-mobile-menu">
        <button className={page === "tienda" ? "active logged-in" : ""} onClick={() => { setPage("tienda"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span><HomeIcon /></span>Inicio</button>
        <button onClick={() => productGridRef.current?.scrollIntoView({ behavior: "smooth" })}><span><PackageIcon /></span>Productos</button>
        <button onClick={() => setPage("contacto")}><span><ChatIcon /></span>Contacto</button>
        <button onClick={() => navigate('/tienda/promociones')}><span><PackageIcon /></span>Promos</button>
        <button onClick={() => setCartOpen(true)}><span><CartIcon /></span>Carrito{totalQty > 0 && ` (${totalQty})`}</button>
        <button 
          onClick={() => {
            if (isClienteLogueado) {
              setMisReservasOpen(true);
            } else {
              setAuthOpen(true);
            }
          }}
          style={isClienteLogueado ? { background: '#f4c2c8', borderRadius: '10px' } : {}}
        >
          <span><UserIcon /></span>
          {isClienteLogueado ? (
            <span style={{ fontSize: '9px', maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {clienteNombre?.split(' ')[0] || 'Cuenta'}
            </span>
          ) : 'Cuenta'}
        </button>
      </div>

      {cartOpen && (
        <div className="v-cart-overlay">
          <div className="v-cart-backdrop" onClick={() => setCartOpen(false)} />
          <div className="v-cart-panel">
            <div className="v-cart-header">
              <button className="v-cart-back-btn" onClick={() => setCartOpen(false)}><ChevronLeftIcon /></button>
              <h2 className="v-cart-title">Tu Carrito</h2>
            </div>

            <div className="checkout-progress">
              <div className="checkout-step completed"></div>
              <div className="checkout-step active"></div>
              <div className="checkout-step"></div>
            </div>

            <div className="v-cart-summary">
              <div className="v-cart-summary-left">
                <span style={{ color: "var(--rose-dk)" }}><CartIcon /></span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{totalQty} producto{totalQty !== 1 ? 's' : ''}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#999" }}>En tu carrito</p>
                </div>
              </div>
              <span className="v-cart-total-amount" style={{ fontSize: 20, fontWeight: 700 }}>${total.toFixed(2)}</span>
            </div>

            {cart.length === 0 ? (
              <div className="v-cart-empty">
                <span style={{ color: "var(--rose-md)" }}><CartIcon /></span>
                <p className="v-cart-empty-text">Tu carrito está vacío.</p>
                <button onClick={() => setCartOpen(false)} className="v-btn-p" style={{ marginTop: 14 }}>Ver tienda</button>
              </div>
            ) : (
              <>
                <div className="v-cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="v-cart-item">
                      <div className="v-cart-item-img">
                        {item.images?.[0] ? <img src={item.images[0]} alt={item.name} /> : <PackageIcon />}
                      </div>
                      <div className="v-cart-item-info">
                        <p className="v-cart-item-name">{item.name}</p>
                        <p className="v-cart-item-meta">{modelosMap[item.modelo] ? `${modelosMap[item.modelo]} · ` : ''}{item.color}</p>
                        <div className="v-cart-item-actions">
                          <div className="v-cart-qty">
                            <button onClick={() => updateQty(item.id, -1)} className="v-cart-qty-btn v-cart-qty-minus"><MinusIcon /></button>
                            <span className="v-cart-qty-value">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="v-cart-qty-btn v-cart-qty-plus"><PlusIcon /></button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="v-cart-item-total">${(item.price * item.qty).toFixed(2)}</span>
                            <button onClick={() => removeFromCart(item.id)} className="v-cart-remove-btn"><TrashIcon /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="v-cart-footer">
                  <div className="v-cart-subtotal">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {descuentoTotal > 0 && (
                    <div className="v-cart-subtotal" style={{ color: '#22c55e' }}>
                      <span>Descuento</span>
                      <span>-${descuentoTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {promoResult && promoResult.promocionesAplicadas.length > 0 && (
                    <button
                      onClick={() => setPromoActiva(!promoActiva)}
                      style={{
                        width: '100%', padding: '8px 14px', borderRadius: 10, border: promoActiva ? 'none' : '2px solid var(--rose-dk)',
                        background: promoActiva ? 'var(--rose-dk)' : 'var(--rose-dk)15',
                        color: promoActiva ? '#fff' : 'var(--rose-dk)',
                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        marginBottom: 10,
                      }}
                    >
                      {promoActiva ? '✅ Promo aplicada' : '🎉 Promo disponible'}
                      {!promoActiva && <span style={{ fontSize: 10, fontWeight: 400 }}>— toca para aplicar</span>}
                    </button>
                  )}
                  {promoActiva && promoResult?.promocionesAplicadas && promoResult.promocionesAplicadas.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      {promoResult.promocionesAplicadas.map((p, i) => (
                        <div key={i} style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span>🏷️</span>
                          <span>{p.descripcion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="v-cart-subtotal">
                    <span>Envío</span>
                    <span>{promoActiva && promoResult?.envioGratis ? <span style={{ color: '#22c55e' }}>GRATIS</span> : `$${costoEnvio.toFixed(2)}`}</span>
                  </div>
                  <div className="v-cart-total">
                    <span>Total</span>
                    <span className="v-cart-total-amount">${total.toFixed(2)}</span>
                  </div>
                  
                  <div className="v-cart-actions">
                    <button onClick={() => { setCartOpen(false); setConsultaOpen(true); }} className="v-cart-btn-consulta">
                      <ChatIcon /> Consultar disponibilidad
                    </button>
                    <button onClick={() => { if (!isClienteLogueado) { setAuthOpen(true); } else { setReservaOpen(true); } }} className="v-cart-btn-reserva">
                      <CheckIcon /> Reservar ahora
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {variantPicker && (
        <div className="v-detail-overlay">
          <div className="v-detail-backdrop" onClick={() => setVariantPicker(null)} />
          <div className="v-detail-modal" style={{ maxWidth: 420 }}>
            <button className="v-detail-close" onClick={() => setVariantPicker(null)}><CloseIcon /></button>
            <div style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
                {variantPicker.product.name}
              </h3>
              {variantPicker.product.codigo && (
                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6b7280' }}>
                  Código: {variantPicker.product.codigo}
                </p>
              )}
              {Object.entries(
                variantPicker.variants.reduce((acc, v) => {
                  if (!acc[v.colorId]) acc[v.colorId] = { colorName: v.colorName, colorHex: v.colorHex, colorImage: v.colorImage, sizes: [] as StockByVariant[] }
                  acc[v.colorId].sizes.push(v)
                  return acc
                }, {} as Record<string, { colorName: string; colorHex: string; colorImage?: string; sizes: StockByVariant[] }>)
              ).map(([colorId, group]) => (
                <div key={colorId} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {group.colorImage ? (
                      <img src={group.colorImage} alt={group.colorName} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: group.colorHex || '#ccc', border: '1px solid #d1d5db', flexShrink: 0 }} />
                    )}
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{group.colorName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {group.sizes.map(variant => (
                      <button
                        key={`${variant.id || `${variant.colorId}-${variant.sizeId}`}`}
                        onClick={() => {
                          addToCart(variantPicker.product, {
                            colorId: variant.colorId,
                            colorName: variant.colorName,
                            colorHex: variant.colorHex,
                            sizeId: variant.sizeId,
                            sizeName: variant.sizeName,
                            stock: variant.stock,
                            precio: variant.precio,
                          })
                          setVariantPicker(null)
                          toast(`${variantPicker.product.name} añadido`)
                        }}
                        disabled={variant.stock <= 0}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '8px 14px', borderRadius: 10,
                          border: variant.stock > 0 ? '1px solid #22c55e' : '1px solid #e5e7eb',
                          background: variant.stock > 0 ? '#f0fdf4' : '#f9fafb',
                          cursor: variant.stock > 0 ? 'pointer' : 'not-allowed',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (variant.stock > 0) { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#16a34a' } }}
                        onMouseLeave={e => { if (variant.stock > 0) { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#22c55e' } }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: variant.stock > 0 ? '#059669' : '#9ca3af' }}>
                          {variant.sizeName || 'Único'}
                        </span>
                        <span style={{ fontSize: 11, color: variant.stock > 0 ? '#6b7280' : '#d1d5db' }}>
                          Stock: {variant.stock}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                          ${(variant.precio || variantPicker.product.price).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {detalle && (
        <div className="v-detail-overlay">
          <div className="v-detail-backdrop" onClick={() => { setDetalle(null); setSelectedColor(''); setSelectedSize(''); }} />
          <div className="v-detail-modal">
            <button className="v-detail-close" onClick={() => { setDetalle(null); setSelectedColor(''); setSelectedSize(''); }}><CloseIcon /></button>
            
            <div className="v-detail-image">
              {(() => {
                const colorImageVariant = selectedColor 
                  ? detalle.stockByVariants?.find(v => v.colorId === selectedColor && v.colorImage)
                  : null;
                const displayImage = colorImageVariant?.colorImage || detalle.images?.[0];
                return (
                  <>
                    {displayImage ? (
                      <img src={displayImage} alt={detalle.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    ) : (
                      <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color: 'var(--rose-md)'}}><PackageIcon /></div>
                    )}
                    <div className="v-detail-image-overlay">
                      <div className="v-detail-badges">{(detalle.en_liquidacion || detalle.estado_catalogo) && <span className="v-detail-badge v-detail-badge-primary">{detalle.en_liquidacion ? 'Oferta' : detalle.estado_catalogo}</span>}<span className="v-detail-badge v-detail-badge-secondary">{modelosMap[detalle.modelo] || 'Modelo'}</span></div>
                      <h2 className="v-detail-name">{detalle.name}</h2>
                      <p className="v-detail-code">Código: {detalle.codigo || 'N/A'}</p>
                      <p className="v-detail-desc">{detalle.description?.slice(0, 100)}...</p>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="v-detail-info">
              {detalle.stockByVariants && detalle.stockByVariants.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label className="v-detail-label">COLOR</label>
                  <div className="v-detail-color-swatches">
                    {[...new Set(detalle.stockByVariants.map(v => JSON.stringify({ id: v.colorId, name: v.colorName, hex: v.colorHex })))].map(c => {
                      const color = JSON.parse(c);
                      const isSelected = selectedColor === color.id;
                      return (
                        <button
                          key={color.id}
                          onClick={() => { setSelectedColor(color.id); setSelectedSize(''); }}
                          className="v-detail-swatch"
                          style={{
                            width: 40, height: 40, borderRadius: 8, border: isSelected ? '3px solid var(--charcoal)' : '2px solid #ddd',
                            background: color.hex, padding: 0
                          }}
                          title={color.name}
                        />
                      );
                    })}
                  </div>
                  {selectedColor && (
                    <p className="v-detail-color-name">
                      {detalle.stockByVariants.find(v => v.colorId === selectedColor)?.colorName}
                    </p>
                  )}
                  {!selectedColor && (
                    <p style={{ fontSize: 12, color: '#22c55e', marginTop: 8, fontStyle: 'italic' }}>
                      Seleccione un color y una talla
                    </p>
                  )}
                </div>
              )}
              
              {detalle.stockByVariants && detalle.stockByVariants.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label className="v-detail-label">TALLA</label>
                  <div className="v-detail-sizes">
                    {detalle.stockByVariants
                      .filter(v => v.colorId === selectedColor)
                      .map(v => {
                        const isSelected = selectedSize === v.sizeId;
                        const hasStock = v.stock > 0;
                        return (
                          <button
                            key={v.sizeId}
                            onClick={() => hasStock && setSelectedSize(v.sizeId)}
                            disabled={!hasStock}
                            className={isSelected ? "v-detail-size-btn v-detail-size-btn-selected" : "v-detail-size-btn"}
                            style={{
                              border: isSelected ? '2px solid #22c55e' : '1px solid #ddd',
                              background: isSelected ? '#22c55e' : hasStock ? '#fff' : '#f5f5f5',
                              color: isSelected ? '#000' : hasStock ? 'var(--charcoal)' : '#ccc',
                              cursor: hasStock ? "pointer" : "not-allowed",
                            }}
                          >
                            {v.sizeName}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
              {selectedColor && !selectedSize && detalle.stockByVariants?.some(v => v.colorId === selectedColor && v.stock > 0) && (
                <p style={{ fontSize: 12, color: '#22c55e', marginBottom: 12, fontStyle: 'italic' }}>
                  Seleccione una talla para agregar al carrito
                </p>
              )}
              
              {(() => {
                const colorVariants = selectedColor 
                  ? detalle.stockByVariants?.filter(v => v.colorId === selectedColor) || []
                  : [];
                const priceByColor = colorVariants.length > 0 
                  ? Math.max(...colorVariants.map(v => v.precio || 0)) 
                  : detalle.price;

                const selectedVariant = selectedColor && selectedSize 
                  ? detalle.stockByVariants?.find(v => v.colorId === selectedColor && v.sizeId === selectedSize)
                  : null;
                const variantStock = selectedVariant?.stock || 0;
                const variantPrice = selectedVariant?.precio || priceByColor;
                const canAdd = !detalle.stockByVariants?.length || (selectedVariant && variantStock > 0);
                
                return (
                  <div className="v-detail-price-section">
                    <div className="v-detail-price-row">
                      <div>
                        <span className="v-detail-price">${variantPrice.toFixed(2)}</span>
                        {selectedVariant && (
                          <div className={`v-detail-stock ${variantStock > 0 ? 'v-detail-stock-available' : 'v-detail-stock-unavailable'}`}>
                            {variantStock > 0 ? `Stock disponible: ${variantStock}` : 'Sin stock'}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => { 
                          if (selectedVariant) {
                            addToCart(detalle, { 
                              colorId: selectedVariant.colorId, 
                              colorName: selectedVariant.colorName,
                              colorHex: selectedVariant.colorHex,
                              sizeId: selectedVariant.sizeId, 
                              sizeName: selectedVariant.sizeName,
                              stock: selectedVariant.stock,
                              precio: selectedVariant.precio
                            }); 
                          } else {
                            addToCart(detalle);
                          }
                          setDetalle(null); 
                          setSelectedColor(''); 
                          setSelectedSize('');
                          toast(`${detalle.name} añadido`);
                        }} 
                        disabled={!canAdd}
                        className="v-detail-add-btn"
                      >
                        {canAdd ? "AGREGAR AL CARRITO" : "SIN STOCK"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {consultaOpen && cart.length > 0 && <ReservaModal cart={cart} onClose={() => setConsultaOpen(false)} onSuccess={() => { setCart([]); setConsultaOpen(false); }} mode="consulta" promoResult={promoResult} />}
      {reservaOpen && cart.length > 0 && <ReservaModal cart={cart} onClose={() => setReservaOpen(false)} onSuccess={() => { setCart([]); setReservaOpen(false) }} mode="reserva" reservaTipo={reservaTipo} promoResult={promoResult} />}
      
      {authOpen && (
        <AuthModal 
          onClose={() => setAuthOpen(false)} 
          onLoginSuccess={() => { setAuthOpen(false); setReservaOpen(true); }}
          cart={cart}
          mode="reserva"
          reservaTipo={reservaTipo}
        />
      )}

      {misReservasOpen && (
        <MisReservas onClose={() => setMisReservasOpen(false)} />
      )}
      </div>
    </div>
  );
}


