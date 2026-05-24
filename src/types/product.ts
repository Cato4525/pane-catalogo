export interface CarouselProduct {
  id: string | number;
  sku: string;
  nombre: string;
  categoria: string;
  tag?: 'Nuevo' | 'Destacado' | 'Oferta' | 'Popular';
  emoji?: string;
  imagen?: string;
  descripcion: string;
  precio: number;
  precioOriginal?: number;
  caracteristicas: string[];
  colores?: string[];
  modelos?: string[];
}

export interface CarouselSlide {
  id: string;
  producto: CarouselProduct;
  tag: string;
  titulo: string;
  subtitulo: string;
  emoji: string;
  precio: number;
  accent: string;
}
