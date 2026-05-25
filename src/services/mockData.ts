import { Product, Category, Activity, DashboardStats, Reserva, ConsultaProducto } from '../types';

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Llanas',
    description: 'Leggings lisos sin ningún detalle adicional',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Troqueleadas',
    description: 'Leggings con diseños troquelados y texturas',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    name: 'Cierres',
    description: 'Leggings con cierre en腰 o tobillo',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '4',
    name: 'Con Bolsillo',
    description: 'Leggings con bolsillo lateral o en腰',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '5',
    name: 'Con Pedrería',
    description: 'Leggings con detalles en pedrería y brillo',
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&q=80',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z'
  }
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Leggin Universe Negro',
    description: 'Leggin de alta compresión, tela suave y stretch. Ideal para ejercicio y uso diario.',
    price: 25.00,
    stock: 50,
    category: '1',
    images: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro'],
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    estado_catalogo: 'clasico',
    tipo_catalogo: 'permanente',
    coleccion: 'Colección Universo',
    activo: true,
    en_liquidacion: false,
    precio_liquidacion: null,
    fecha_creacion: '2024-01-15T10:00:00Z',
    fecha_actualizacion: '2024-01-15T10:00:00Z',
    modelo: 'Universo',
    color: 'Negro'
  },
  {
    id: '2',
    name: 'Leggin Fitnets Rosado',
    description: 'Leggin con tecnología fitnets, control abdominal y tela transpirable. Perfecto para entrenamiento intenso.',
    price: 28.00,
    stock: 30,
    category: '2',
    images: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Rosado'],
    status: 'active',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
    estado_catalogo: 'tendencia',
    tipo_catalogo: 'temporada',
    coleccion: 'Primavera-Verano 2024',
    activo: true,
    en_liquidacion: false,
    precio_liquidacion: null,
    fecha_creacion: '2024-01-16T10:00:00Z',
    fecha_actualizacion: '2024-01-16T10:00:00Z',
    modelo: 'Fitnets',
    color: 'Rosado'
  },
  {
    id: '3',
    name: 'Leggin Natural Gris',
    description: 'Leggin de corte natural, tela orgánica sin químicos. Máxima comodidad para todo el día.',
    price: 22.00,
    stock: 25,
    category: '1',
    images: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Gris'],
    status: 'active',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
    estado_catalogo: 'exclusivo',
    tipo_catalogo: 'temporada',
    coleccion: 'Edición Limitada',
    activo: true,
    en_liquidacion: false,
    precio_liquidacion: null,
    fecha_creacion: new Date().toISOString(),
    fecha_actualizacion: new Date().toISOString(),
    modelo: 'Natural',
    color: 'Gris'
  },
  {
    id: '4',
    name: 'Leggin Cierre Negro',
    description: 'Leggin con cierre en tobillo, práctico y elegante. Bolsillo interno pequeño.',
    price: 30.00,
    stock: 20,
    category: '3',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Negro'],
    status: 'active',
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z',
    estado_catalogo: 'clasico',
    tipo_catalogo: 'permanente',
    coleccion: 'Colección Cierres',
    activo: true,
    en_liquidacion: false,
    precio_liquidacion: null,
    fecha_creacion: '2024-01-18T10:00:00Z',
    fecha_actualizacion: '2024-01-18T10:00:00Z',
    modelo: 'Universo',
    color: 'Negro'
  },
  {
    id: '5',
    name: 'Leggin Bolsillo Azul',
    description: 'Leggin con bolsillo lateral grande. Ideal para guardar celular y objetos personales.',
    price: 27.00,
    stock: 35,
    category: '4',
    images: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Azul'],
    status: 'active',
    created_at: '2024-01-19T10:00:00Z',
    updated_at: '2024-01-19T10:00:00Z',
    estado_catalogo: 'tendencia',
    tipo_catalogo: 'temporada',
    coleccion: 'Otoño-Invierno 2024',
    activo: true,
    en_liquidacion: false,
    precio_liquidacion: null,
    fecha_creacion: '2024-01-19T10:00:00Z',
    fecha_actualizacion: '2024-01-19T10:00:00Z',
    modelo: 'Fitnets',
    color: 'Azul'
  },
  {
    id: '6',
    name: 'Leggin Pedrería Dorado',
    description: 'Leggin elegante con detalles en pedrería. Perfecto para ocasiones especiales.',
    price: 35.00,
    stock: 15,
    category: '5',
    images: [
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'
    ],
    sizes: ['S', 'M', 'L'],
    colors: ['Dorado', 'Negro'],
    status: 'active',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    estado_catalogo: 'exclusivo',
    tipo_catalogo: 'temporada',
    coleccion: 'Primavera-Verano 2024',
    activo: true,
    en_liquidacion: false,
    precio_liquidacion: null,
    fecha_creacion: '2024-01-20T10:00:00Z',
    fecha_actualizacion: '2024-01-20T10:00:00Z',
    modelo: 'Universo',
    color: 'Dorado'
  },
  {
    id: '7',
    name: 'Leggin Troquelado Negro',
    description: 'Leggin con diseño troquelado en la parte posterior. Estilo y ventilación.',
    price: 26.00,
    stock: 28,
    category: '2',
    images: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro'],
    status: 'active',
    created_at: '2024-01-21T10:00:00Z',
    updated_at: '2024-01-21T10:00:00Z',
    estado_catalogo: 'tendencia',
    tipo_catalogo: 'permanente',
    coleccion: 'Colección Troquelado',
    activo: true,
    en_liquidacion: false,
    precio_liquidacion: null,
    fecha_creacion: '2024-01-21T10:00:00Z',
    fecha_actualizacion: '2024-01-21T10:00:00Z',
    modelo: 'Natural',
    color: 'Negro'
  },
  {
    id: '8',
    name: 'Leggin Natural Beige',
    description: 'Leggin color beige natural, tela suave y comfortable. Uso diario.',
    price: 20.00,
    stock: 40,
    category: '1',
    images: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Beige'],
    status: 'active',
    created_at: '2024-01-22T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z',
    estado_catalogo: 'clasico',
    tipo_catalogo: 'permanente',
    coleccion: 'Colección Natural',
    activo: true,
    en_liquidacion: false,
    precio_liquidacion: null,
    fecha_creacion: '2024-01-22T10:00:00Z',
    fecha_actualizacion: '2024-01-22T10:00:00Z',
    modelo: 'Natural',
    color: 'Beige'
  }
];

export const mockActivities: Activity[] = [
  { id: '1', type: 'order', message: 'Nuevo pedido #1234 recibido', timestamp: '2024-01-22T14:30:00Z' },
  { id: '2', type: 'product', message: 'Producto "Croissant" actualizado', timestamp: '2024-01-22T13:15:00Z' },
  { id: '3', type: 'category', message: 'Nueva categoría "Bebidas" creada', timestamp: '2024-01-22T12:00:00Z' },
  { id: '4', type: 'order', message: 'Pedido #1233 completado', timestamp: '2024-01-22T11:30:00Z' },
  { id: '5', type: 'product', message: 'Producto "Pan Multigrano" agregado', timestamp: '2024-01-22T10:00:00Z' }
];

export const mockStats: DashboardStats = {
  totalSales: 12450.00,
  totalProducts: 8,
  totalCategories: 4,
  recentOrders: 23
};

export const featuredProducts = mockProducts.filter(p => p.status === 'active').slice(0, 4);

export const mockReservas: Reserva[] = [
  {
    id: 'RES-001',
    cliente_id: 'CLI-001',
    cliente_nombre: 'María López',
    cliente_telefono: '3001234567',
    estado_reserva: 'confirmado',
    total: 45.00,
    abono: 45.00,
    saldo: 0,
    comprobante_url: null,
    fecha_reserva: '2024-01-20T10:00:00Z',
    fecha_limite_abono: '2024-01-22T10:00:00Z',
    fecha_limite_pago: '2024-01-27T10:00:00Z',
    notas_admin: 'Cliente preferente',
    whatsapp_revisado: true,
    comprobante_verificado: true,
    abono_confirmado: true,
    origen: 'pos',
    abonos: [],
    items: [
      { id: 'RI-001', reserva_id: 'RES-001', producto_id: '1', producto_nombre: 'Baguette Frances', cantidad: 2, precio_unitario: 2.50, subtotal: 5.00 },
      { id: 'RI-002', reserva_id: 'RES-001', producto_id: '2', producto_nombre: 'Croissant', cantidad: 4, precio_unitario: 3.00, subtotal: 12.00 },
      { id: 'RI-003', reserva_id: 'RES-001', producto_id: '3', producto_nombre: 'Pastel de Chocolate', cantidad: 1, precio_unitario: 25.00, subtotal: 25.00 },
    ]
  },
  {
    id: 'RES-002',
    cliente_id: 'CLI-002',
    cliente_nombre: 'Carlos Ruiz',
    cliente_telefono: '3209876543',
    estado_reserva: 'abonado',
    total: 30.00,
    abono: 10.00,
    saldo: 20.00,
    comprobante_url: 'https://example.com/comprobante.jpg',
    fecha_reserva: '2024-01-21T14:00:00Z',
    fecha_limite_abono: '2024-01-23T14:00:00Z',
    fecha_limite_pago: '2024-01-28T14:00:00Z',
    notas_admin: null,
    whatsapp_revisado: true,
    comprobante_verificado: false,
    abono_confirmado: false,
    origen: 'store',
    abonos: [],
    items: [
      { id: 'RI-004', reserva_id: 'RES-002', producto_id: '4', producto_nombre: 'Pan Multigrano', cantidad: 2, precio_unitario: 4.50, subtotal: 9.00 },
      { id: 'RI-005', reserva_id: 'RES-002', producto_id: '6', producto_nombre: 'Cheesecake de Fresa', cantidad: 1, precio_unitario: 30.00, subtotal: 30.00 },
    ]
  },
  {
    id: 'RES-003',
    cliente_id: 'CLI-003',
    cliente_nombre: 'Ana Torres',
    cliente_telefono: '3154567890',
    estado_reserva: 'pendiente',
    total: 18.00,
    abono: 0,
    saldo: 18.00,
    comprobante_url: null,
    fecha_reserva: '2024-01-22T09:00:00Z',
    fecha_limite_abono: '2024-01-24T09:00:00Z',
    fecha_limite_pago: '2024-01-29T09:00:00Z',
    notas_admin: null,
    whatsapp_revisado: false,
    comprobante_verificado: false,
    abono_confirmado: false,
    origen: 'store',
    abonos: [],
    items: [
      { id: 'RI-006', reserva_id: 'RES-003', producto_id: '8', producto_nombre: 'Café Latte', cantidad: 3, precio_unitario: 4.00, subtotal: 12.00 },
      { id: 'RI-007', reserva_id: 'RES-003', producto_id: '5', producto_nombre: 'Galletas de Avena', cantidad: 2, precio_unitario: 5.00, subtotal: 10.00 },
    ]
  },
  {
    id: 'RES-004',
    cliente_id: 'CLI-004',
    cliente_nombre: 'Pedro Díaz',
    cliente_telefono: '3005678901',
    estado_reserva: 'cancelado',
    total: 15.00,
    abono: 5.00,
    saldo: 10.00,
    comprobante_url: null,
    fecha_reserva: '2024-01-19T11:00:00Z',
    fecha_limite_abono: '2024-01-21T11:00:00Z',
    fecha_limite_pago: '2024-01-26T11:00:00Z',
    notas_admin: 'Cliente canceló por cambio de planes',
    whatsapp_revisado: true,
    comprobante_verificado: false,
    abono_confirmado: false,
    origen: 'store',
    abonos: [],
    items: [
      { id: 'RI-008', reserva_id: 'RES-004', producto_id: '1', producto_nombre: 'Baguette Frances', cantidad: 6, precio_unitario: 2.50, subtotal: 15.00 },
    ]
  }
];

export const mockConsultas: ConsultaProducto[] = [
  { id: 'CON-001', product_id: '3', producto_nombre: 'Pastel de Chocolate', producto_codigo: 'PAS-001', fecha: '2024-01-22T15:30:00Z', origen: 'catalogo' },
  { id: 'CON-002', product_id: '6', producto_nombre: 'Cheesecake de Fresa', producto_codigo: 'CHE-001', fecha: '2024-01-22T14:20:00Z', origen: 'catalogo' },
  { id: 'CON-003', product_id: '2', producto_nombre: 'Croissant', producto_codigo: 'CRO-001', fecha: '2024-01-22T12:15:00Z', origen: 'whatsapp' },
  { id: 'CON-004', product_id: '1', producto_nombre: 'Baguette Frances', producto_codigo: 'BAG-001', fecha: '2024-01-21T16:45:00Z', origen: 'catalogo' },
  { id: 'CON-005', product_id: '4', producto_nombre: 'Pan Multigrano', producto_codigo: 'PAN-001', fecha: '2024-01-21T10:30:00Z', origen: 'whatsapp' },
  { id: 'CON-006', product_id: '8', producto_nombre: 'Café Latte', producto_codigo: 'CAF-001', fecha: '2024-01-20T08:00:00Z', origen: 'catalogo' },
  { id: 'CON-007', product_id: '5', producto_nombre: 'Galletas de Avena', producto_codigo: 'GAL-001', fecha: '2024-01-19T19:20:00Z', origen: 'whatsapp' },
];
