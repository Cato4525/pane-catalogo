import { CarouselSlide, CarouselProduct } from '../types/product';

export const mockProducts: CarouselProduct[] = [
  {
    id: 1,
    sku: 'PAN-001',
    nombre: 'Baguette Francés Artesanal',
    categoria: 'Panadería',
    tag: 'Nuevo',
    emoji: '🥖',
    descripcion: 'Baguette crujiente recién horneado, perfecto para acompañar tus comidas.',
    precio: 2.50,
    caracteristicas: ['Crujiente por fuera', 'Suave por dentro', '100% natural'],
    colores: ['Dorado'],
    modelos: ['Normal', 'Integral']
  },
  {
    id: 2,
    sku: 'PAS-010',
    nombre: 'Pastel de Chocolate Premium',
    categoria: 'Pasteles',
    tag: 'Destacado',
    emoji: '🎂',
    descripcion: 'Pastel de chocolate oscuro con cobertura de ganache.',
    precio: 25.00,
    precioOriginal: 30.00,
    caracteristicas: ['Chocolate Belgian', 'Cobertura ganache', 'Para 8 personas'],
    colores: ['Chocolate'],
    modelos: ['Grande', 'Mediano']
  },
  {
    id: 3,
    sku: 'GAL-012',
    nombre: 'Donas Glaseadas',
    categoria: 'Galletas',
    tag: 'Popular',
    emoji: '🍩',
    descripcion: 'Donas suaves con glaseado de vainilla y chocolate.',
    precio: 3.50,
    caracteristicas: ['Glaseado artesanal', '3 sabores', 'Paquete de 6'],
    colores: ['Chocolate', 'Vainilla', 'Fresa'],
    modelos: ['Individual']
  },
  {
    id: 4,
    sku: 'BEB-030',
    nombre: 'Café Latte Premium',
    categoria: 'Bebidas',
    tag: 'Oferta',
    emoji: '☕',
    descripcion: 'Café espresso con leche vaporizada, perfecto para empezar el día.',
    precio: 4.00,
    caracteristicas: ['Granos premium', 'Leche de calidad', 'Servicio caliente'],
    colores: ['Café'],
    modelos: ['Grande', 'Mediano']
  }
];

export const mockCarouselSlides: CarouselSlide[] = [
  {
    id: 'slide-1',
    producto: mockProducts[0],
    tag: 'NUEVO',
    titulo: 'Baguette Francés',
    subtitulo: 'Crujiente y delicioso',
    emoji: '🥖',
    precio: 2.50,
    accent: '#f59e0b'
  },
  {
    id: 'slide-2',
    producto: mockProducts[1],
    tag: 'DESTACADO',
    titulo: 'Pastel de Chocolate',
    subtitulo: 'El más vendido',
    emoji: '🎂',
    precio: 25.00,
    accent: '#8b5cf6'
  },
  {
    id: 'slide-3',
    producto: mockProducts[2],
    tag: 'POPULAR',
    titulo: 'Donas Glaseadas',
    subtitulo: 'Ideales para compartir',
    emoji: '🍩',
    precio: 3.50,
    accent: '#ec4899'
  },
  {
    id: 'slide-4',
    producto: mockProducts[3],
    tag: 'OFERTA',
    titulo: 'Café Latte',
    subtitulo: 'Para empezar el día',
    emoji: '☕',
    precio: 4.00,
    accent: '#06b6d4'
  }
];
