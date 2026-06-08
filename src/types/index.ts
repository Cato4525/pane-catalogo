export type EstadoCatalogo = 'exclusivo' | 'tendencia' | 'clasico' | 'liquidacion' | 'descontinuado';
export type TipoCatalogo = 'temporada' | 'permanente';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  codigo?: string;
  
  // Stock por variante (color + talla)
  stockByVariants?: StockByVariant[];
  
  // Catálogo avanzado
  estado_catalogo: EstadoCatalogo;
  tipo_catalogo: TipoCatalogo;
  coleccion: string;
  activo: boolean;
  en_liquidacion: boolean;
  precio_liquidacion: number | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  
  // Campos adicionales para textil
  modelo: string;
  color: string;

  // Promociones
  promotion_category?: string;
  color_tipo?: string;
}

export interface StockByVariant {
  id?: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  colorImage?: string;
  sizeId: string;
  sizeName: string;
  stock: number;
  precio?: number;
  sku?: string;
  color_tipo?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface DashboardStats {
  totalSales: number;
  totalProducts: number;
  totalCategories: number;
  recentOrders: number;
}

export interface Activity {
  id: string;
  type: 'order' | 'product' | 'category';
  message: string;
  timestamp: string;
}

export type ThemeType = 'moderno' | 'empresarial' | 'ejecutivo' | 'clasico' | 'dark_black' | 'neutral' | 'negocio';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export const THEME_PRESETS: Record<ThemeType, ThemeColors> = {
  moderno: {
    primary: '#22c55e',
    secondary: '#10b981',
    accent: '#22c55e',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  empresarial: {
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  ejecutivo: {
    primary: '#0f172a',
    secondary: '#334155',
    accent: '#fbbf24',
    background: '#ffffff',
    surface: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  clasico: {
    primary: '#78350f',
    secondary: '#92400e',
    accent: '#d97706',
    background: '#fffbeb',
    surface: '#ffffff',
    text: '#451a03',
    textMuted: '#78350f',
    border: '#fde68a',
    success: '#65a30d',
    warning: '#d97706',
    error: '#dc2626',
  },
  dark_black: {
    primary: '#ffffff',
    secondary: '#f97316',
    accent: '#fb923c',
    background: '#000000',
    surface: '#0a0a0a',
    text: '#ffffff',
    textMuted: '#a3a3a3',
    border: '#262626',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  neutral: {
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#f9a8d4',
    background: '#fdf2f8',
    surface: '#ffffff',
    text: '#831843',
    textMuted: '#be185d',
    border: '#fbcfe8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  negocio: {
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#fca5a5',
    background: '#fef2f2',
    surface: '#ffffff',
    text: '#1f2937',
    textMuted: '#6b7280',
    border: '#fecaca',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#dc2626',
  },
};

export interface ThemeAnimation {
  carousel: 'slide' | 'fade' | 'zoom' | 'flip' | 'elastic';
  productCard: 'slideUp' | 'fadeIn' | 'scale' | 'rotate' | 'bounce';
  buttons: 'scale' | 'shake' | 'pulse' | 'glow' | 'none';
  transitions: 'smooth' | 'bouncy' | 'elastic' | 'instant';
}

export interface ThemeCarousel {
  slides: Array<{
    id: number;
    emoji: string;
    title: string;
    sub: string;
    tag: string;
    color: string;
    accent: string;
    price: number;
  }>;
  autoPlay: boolean;
  interval: number;
}

export const THEME_ANIMATIONS: Record<ThemeType, ThemeAnimation> = {
  moderno: {
    carousel: 'slide',
    productCard: 'slideUp',
    buttons: 'scale',
    transitions: 'smooth',
  },
  empresarial: {
    carousel: 'fade',
    productCard: 'fadeIn',
    buttons: 'scale',
    transitions: 'smooth',
  },
  ejecutivo: {
    carousel: 'slide',
    productCard: 'slideUp',
    buttons: 'glow',
    transitions: 'elastic',
  },
  clasico: {
    carousel: 'fade',
    productCard: 'fadeIn',
    buttons: 'pulse',
    transitions: 'smooth',
  },
  dark_black: {
    carousel: 'zoom',
    productCard: 'scale',
    buttons: 'glow',
    transitions: 'bouncy',
  },
  neutral: {
    carousel: 'slide',
    productCard: 'bounce',
    buttons: 'pulse',
    transitions: 'bouncy',
  },
  negocio: {
    carousel: 'slide',
    productCard: 'slideUp',
    buttons: 'scale',
    transitions: 'smooth',
  },
};

export const THEME_CAROUSELS: Record<ThemeType, ThemeCarousel> = {
  moderno: {
    slides: [
      { id: 1, emoji: "👖", title: "Leggings Nuevo", sub: "La mejor calidad para ti", tag: "NUEVO", color: "#22c55e", accent: "#4ade80", price: 25.00 },
      { id: 2, emoji: "✨", title: "Leggings Especial", sub: "Para tus ocasiones especiales", tag: "TOP VENTAS", color: "#16a34a", accent: "#22c55e", price: 30.00 },
      { id: 3, emoji: "💫", title: "Leggings Premium", sub: "El mejor estilo para ti", tag: "OFERTA", color: "#15803d", accent: "#86efac", price: 22.00 },
      { id: 4, emoji: "🎀", title: "Leggings con Estilo", sub: "Diseños únicos", tag: "POPULAR", color: "#166534", accent: "#bbf7d0", price: 28.00 },
    ],
    autoPlay: true,
    interval: 5200,
  },
  empresarial: {
    slides: [
      { id: 1, emoji: "👖", title: "Calidad Garantizada", sub: "Los mejores leggings", tag: "PREMIUM", color: "#1e3a5f", accent: "#3b82f6", price: 0 },
      { id: 2, emoji: "🚚", title: "Entrega a Tiempo", sub: "Rapidez y eficiencia", tag: "CONFIANZA", color: "#1e3a5f", accent: "#60a5fa", price: 0 },
      { id: 3, emoji: "⭐", title: "100% Calidad", sub: "Sin compromisos", tag: "SALUDABLE", color: "#1e3a5f", accent: "#93c5fd", price: 0 },
    ],
    autoPlay: true,
    interval: 6000,
  },
  ejecutivo: {
    slides: [
      { id: 1, emoji: "💼", title: "Exclusividad", sub: "Para las más exigentes", tag: "VIP", color: "#0f172a", accent: "#fbbf24", price: 0 },
      { id: 2, emoji: "🏆", title: "Premium Quality", sub: "Lo mejor de lo mejor", tag: "TOP", color: "#0f172a", accent: "#fcd34d", price: 0 },
      { id: 3, emoji: "✨", title: "Elegancia", sub: "Estilo y confort", tag: "DELUXE", color: "#0f172a", accent: "#fde68a", price: 0 },
    ],
    autoPlay: true,
    interval: 7000,
  },
  clasico: {
    slides: [
      { id: 1, emoji: "🏠", title: "Tradición y Calidad", sub: "siempre contigo", tag: "TRADICIONAL", color: "#78350f", accent: "#d97706", price: 0 },
      { id: 2, emoji: "🌾", title: "Materiales de Primera", sub: "Lo mejor para ti", tag: "ORGÁNICO", color: "#92400e", accent: "#fbbf24", price: 0 },
      { id: 3, emoji: "👵", title: "Comodidad Total", sub: "Como tú mereces", tag: "CASERO", color: "#b45309", accent: "#f59e0b", price: 0 },
    ],
    autoPlay: true,
    interval: 6500,
  },
  dark_black: {
    slides: [
      { id: 1, emoji: "🌑", title: "Dark Mode", sub: "Elegancia en negro", tag: "EXCLUSIVO", color: "#000000", accent: "#ffffff", price: 0 },
      { id: 2, emoji: "🔥", title: "Toque Naranja", sub: "Energía y vida", tag: "FLAME", color: "#0a0a0a", accent: "#f97316", price: 0 },
      { id: 3, emoji: "⚡", title: "Potencia & Estilo", sub: "Diseñado para destacar", tag: "POWER", color: "#111111", accent: "#fb923c", price: 0 },
    ],
    autoPlay: true,
    interval: 5500,
  },
  neutral: {
    slides: [
      { id: 1, emoji: "👖", title: "Leggings Nuevo", sub: "La mejor calidad para ti", tag: "NUEVO", color: "#ec4899", accent: "#fbcfe8", price: 25.00 },
      { id: 2, emoji: "✨", title: "Leggings Especial", sub: "Para tus ocasiones especiales", tag: "TOP VENTAS", color: "#db2777", accent: "#f9a8d4", price: 30.00 },
      { id: 3, emoji: "💫", title: "Leggings Premium", sub: "El mejor estilo para ti", tag: "OFERTA", color: "#be185d", accent: "#f472b6", price: 22.00 },
      { id: 4, emoji: "🎀", title: "Leggings con Estilo", sub: "Diseños únicos", tag: "POPULAR", color: "#9d174d", accent: "#fbcfe8", price: 28.00 },
    ],
    autoPlay: true,
    interval: 5800,
  },
  negocio: {
    slides: [
      { id: 1, emoji: "🔥", title: "Promociones Rojas", sub: "Grandes descuentos", tag: "SALE", color: "#dc2626", accent: "#fca5a5", price: 0 },
      { id: 2, emoji: "💯", title: "Lo Más Vendido", sub: "Miles de clientas", tag: "TRENDING", color: "#b91c1c", accent: "#f87171", price: 0 },
      { id: 3, emoji: "🏷️", title: "Ofertas Especiales", sub: "No te las pierdas", tag: "DESCUENTO", color: "#991b1b", accent: "#fecaca", price: 0 },
      { id: 4, emoji: "⚡", title: "Edición Limitada", sub: "Solo por hoy", tag: "ÚLTIMA", color: "#7f1d1d", accent: "#fee2e2", price: 0 },
    ],
    autoPlay: true,
    interval: 5000,
  },
};

export interface SocialNetwork {
  id: string;
  name: string;
  link: string;
  icon: string;
  active: boolean;
}

export type SaleStatus = 'completado' | 'cancelado';

export interface DirectSaleItem {
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  price: number;
  variantId?: string;
}

export interface PromocionAplicada {
  campania_id: string;
  campania_nombre: string;
  campania_tipo: string;
  descuento: number;
  descripcion: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  price: number;
  subtotal: number;
  descuento_aplicado?: number;
  precio_original?: number;
  precio_final?: number;
  promocion_id?: string;
  promocion_nombre?: string;
}

export interface DirectSale {
  id: string;
  cliente: string;
  clienteId?: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  items: DirectSaleItem[];
  saleItems?: SaleItem[];
  monto: number;
  estado: SaleStatus;
  fecha: string;
  notas?: string;
  metodo_pago?: MetodoPago;
  monto_pagado?: number;
  cambio?: number;
  transferencia_imagen?: string;
  tarjeta_last4?: string;
  tarjeta_autori?: string;
  factura_generada?: boolean;
  subtotal?: number;
  descuento_total?: number;
  envio?: number;
  promociones_aplicadas?: PromocionAplicada[];
}

export interface ShippingField {
  id: string;
  label: string;
  key: string;
  enabled: boolean;
  order: number;
}

export interface StoreSettings {
  storeName: string;
  storeUrl: string;
  logo: string;
  theme: ThemeType;
  contacts: {
    address: string;
    city: string;
    country: string;
    whatsapp: string;
    telegram: string;
    email: string;
    phone: string;
  };
  socialNetworks: SocialNetwork[];
  shippingFields: ShippingField[];
  costo_envio: number;
  tickerMessages?: string[];
  nosotros?: {
    titulo: string;
    descripcion: string;
    historia: string;
    valores: string[];
    anos_experiencia: number;
    imagen_principal: string;
  };
  visitas: number;
  backgroundImage?: string;
}

export type MovimientoTipo = 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida' | 'devolucion';

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  documento: string;
  tipo_documento: 'cc' | 'nit' | 'ce' | 'rc' | 'otro';
  fecha_registro: string;
  observaciones: string;
  user_id?: string;
  origen?: 'tienda' | 'panel';
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  tipo: MovimientoTipo;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string;
  referencia: string;
  fecha: string;
}

export type EstadoReserva = 'pendiente' | 'abonado' | 'confirmado' | 'cancelado' | 'expirado';

export interface Abono {
  id: string;
  reserva_id?: string;
  order_id?: string;
  monto: number;
  fecha: string;
  comprobante_url?: string;
  notas?: string;
  tipo: 'inicial' | 'parcial' | 'final';
}

export interface Reserva {
  id: string;
  codigo?: string;
  cliente_id: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_cedula?: string;
  cliente_ciudad?: string;
  cliente_direccion?: string;
  cliente_email?: string;
  estado_reserva: EstadoReserva;
  total: number;
  abono: number;
  saldo: number;
  comprobante_url: string | null;
  fecha_reserva: string;
  fecha_limite_abono: string | null;
  fecha_limite_pago: string | null;
  notas_admin: string | null;
  whatsapp_revisado: boolean;
  comprobante_verificado: boolean;
  abono_confirmado: boolean;
  items?: ReservaItem[];
  abonos?: Abono[];
  origen: 'store' | 'pos' | 'promocion';
}

export interface ReservaItem {
  id: string;
  reserva_id: string;
  producto_id: string;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  variantId?: string;
}

export interface ConsultaProducto {
  id: string;
  product_id: string;
  producto_nombre?: string;
  producto_codigo?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  mensaje?: string;
  fecha?: string;
  created_at?: string;
  origen: string;
}

export type EstadoProducto = 'activo' | 'inactivo' | 'descontinuado';
export type CatalogoTipo = 'nuevo' | 'tendencia' | 'clasico' | 'permanente' | 'liquidacion';

export interface CarritoItem {
  producto: Product;
  cantidad: number;
  variantId?: string;
  colorId?: string;
  colorName?: string;
  colorHex?: string;
  sizeId?: string;
  sizeName?: string;
  stock?: number;
}

export const ABONO_MINIMO = 5;
export const DIAS_LIMITE_ABONO = 2;
export const DIAS_LIMITE_PAGO = 7;

export interface Color {
  id: string;
  nombre: string;
  codigo_hex: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Talla {
  id: string;
  nombre: string;
  orden: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Modelo {
  id: string;
  nombre: string;
  descripcion: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Catalogo {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoCatalogo;
  estado: EstadoCatalogo;
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
  created_at: string;
}

// ========== NUEVO SISTEMA DE PROMOCIONES (Campañas) ==========

export type TipoCampania = 'PRECIO_FIJO' | 'PORCENTAJE' | 'MONTO_FIJO' | 'COMPRA_X_LLEVA_Y' | 'COMBO' | 'ENVIO_GRATIS';
export type CategoriaCampania = 'PROMOCION' | 'DESCUENTO' | 'OFERTA' | 'LIQUIDACION' | 'BLACK_FRIDAY' | 'TEMPORADA';
export type EstadoCampania = 'activo' | 'inactivo' | 'borrador';

export interface CampaniaRegla {
  id: string;
  campania_id: string;
  tipo_regla: string;
  cantidad_minima: number;
  monto_minimo: number;
  porcentaje: number;
  precio_fijo: number;
  envio_gratis: boolean;
  parear_color_tipo?: boolean;
  created_at: string;
}

export interface CampaniaProducto {
  id: string;
  campania_id: string;
  producto_id: string;
  created_at: string;
}

export interface CampaniaFiltro {
  id: string;
  campania_id: string;
  campo: string;
  operador: string;
  valor: string;
  created_at: string;
}

export interface Campania {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoCampania;
  categoria: CategoriaCampania;
  estado: EstadoCampania;
  catalogo_id?: string | null;
  catalogo_nombre?: string;
  catalogo_excluir_id?: string | null;
  catalogo_excluir_nombre?: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  prioridad: number;
  created_at: string;
  updated_at: string;
  reglas?: CampaniaRegla[];
  productos?: CampaniaProducto[];
  filtros?: CampaniaFiltro[];
}

export interface CarritoPromocionItem {
  producto: Product;
  cantidad: number;
  precioPromocion: number;
  descuento: number;
  colorTipo?: string;
}

export interface CalculoPromocion {
  items: CarritoPromocionItem[]
  subtotalOriginal: number
  descuentoTotal: number
  envio: number
  envioGratis: boolean
  total: number
  promocionesAplicadas: PromocionAplicada[]
}

export interface ResumenPromocion {
  campania: Campania;
  items: CarritoPromocionItem[];
  subtotalOriginal: number;
  descuentoTotal: number;
  envio: number;
  total: number;
  abonoMinimo: number;
  saldoPendiente: number;
}

// ========== SISTEMA DE CATÁLOGOS TEMÁTICOS (para el menú de la tienda) ==========

export type TipoCatalogoSeccion = 'sistema' | 'personalizado'

export interface CatalogoSeccionProducto {
  id: string
  catalogo_id: string
  producto_id: string
  fecha_vencimiento: string | null
  created_at: string
}

export interface CatalogoSeccion {
  id: string
  nombre: string
  descripcion: string
  tipo: TipoCatalogoSeccion
  created_at: string
  updated_at: string
  productos?: CatalogoSeccionProducto[]
}
