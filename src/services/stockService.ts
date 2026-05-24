import { getSupabase } from './supabaseClient';

export interface Talla {
  id: string;
  nombre: string;
}

export interface VarianteProducto {
  id: string;
  product_id: string;
  color_id?: string;
  size_id?: string;
  stock: number;
  precio: number;
  colors?: {
    nombre: string;
    codigo_hex: string;
  };
  sizes?: {
    nombre: string;
    orden?: number;
  };
}

export const stockService = {
  /**
   * Descontar stock de forma atómica usando RPC
   */
  async descontarStock(
    productoId: string,
    colorId?: string,
    sizeId?: string,
    cantidad: number = 1
  ): Promise<{ data: VarianteProducto | null; error: string | null }> {
    try {
      const supabase = getSupabase();
      if (!supabase) return { data: null, error: 'Supabase no configurado' };

      const { data, error } = await supabase.rpc('descontar_stock_variant', {
        p_product_id: productoId,
        p_color_id: colorId || null,
        p_size_id: sizeId || null,
        p_cantidad: cantidad
      });

      if (error) return { data: null, error: error.message };
      if (!data) return { data: null, error: 'Stock insuficiente' };

      return { data: data as VarianteProducto, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Agregar stock
   */
  async agregarStock(
    productoId: string,
    colorId?: string,
    sizeId?: string,
    cantidad: number = 1
  ): Promise<{ data: VarianteProducto | null; error: string | null }> {
    try {
      const supabase = getSupabase();
      if (!supabase) return { data: null, error: 'Supabase no configurado' };

      const { data, error } = await supabase.rpc('agregar_stock_variant', {
        p_product_id: productoId,
        p_color_id: colorId || null,
        p_size_id: sizeId || null,
        p_cantidad: cantidad
      });

      if (error) return { data: null, error: error.message };
      if (!data) return { data: null, error: 'Error al agregar stock' };

      return { data: data as VarianteProducto, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Verificar disponibilidad de stock
   */
  async verificarDisponibilidad(
    productoId: string,
    colorId?: string,
    sizeId?: string
  ): Promise<{ data: boolean; error: string | null }> {
    try {
      const supabase = getSupabase();
      if (!supabase) return { data: false, error: null };

      let query = supabase
        .from('product_variants')
        .select('stock')
        .eq('product_id', productoId);

      if (colorId) {
        query = query.eq('color_id', colorId);
      }
      if (sizeId) {
        query = query.eq('size_id', sizeId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) return { data: false, error: null };

      return { data: data.some(v => v.stock > 0), error: null };
    } catch (error: any) {
      return { data: false, error: error.message };
    }
  },

  /**
   * Obtener variantes de un producto
   */
  async obtenerVariantesProducto(
    productoId: string
  ): Promise<{ data: VarianteProducto[] | null; error: string | null }> {
    try {
      const supabase = getSupabase();
      if (!supabase) return { data: null, error: 'Supabase no configurado' };

      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          color_id,
          size_id,
          stock,
          precio,
          colors(nombre, codigo_hex),
          sizes(nombre, orden)
        `)
        .eq('product_id', productoId);

      if (error) return { data: null, error: error.message };

      const mapped = (data || []).map((d: any) => ({
        id: d.id,
        product_id: d.product_id,
        color_id: d.color_id,
        size_id: d.size_id,
        stock: d.stock,
        precio: d.precio,
        colors: Array.isArray(d.colors) ? d.colors[0] : d.colors,
        sizes: Array.isArray(d.sizes) ? d.sizes[0] : d.sizes
      }));

      return { data: mapped, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Obtener combinaciones disponibles de un producto
   */
  async obtenerTallasDisponibles(
    productoId: string
  ): Promise<{ data: Talla[] | null; error: string | null }> {
    try {
      const supabase = getSupabase();
      if (!supabase) return { data: null, error: 'Supabase no configurado' };

      const { data, error } = await supabase
        .from('product_variants')
        .select(`size_id, sizes(nombre)`)
        .eq('product_id', productoId)
        .gt('stock', 0);

      if (error) return { data: null, error: error.message };

      const tallas: Talla[] = (data || []).map((d: any) => ({
        id: d.size_id,
        nombre: Array.isArray(d.sizes) ? d.sizes[0]?.nombre || '' : d.sizes?.nombre || ''
      }));

      return { data: tallas, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Obtener productos activos con stock
   */
  async obtenerProductosConStock(): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const supabase = getSupabase();
      if (!supabase) return { data: null, error: 'Supabase no configurado' };

      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          product_id,
          products(id, nombre, imagenes, category_id, categories(nombre))
        `)
        .gt('stock', 0);

      if (error) return { data: null, error: error.message };

      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Obtener stock por variantes de un producto
   */
  async obtenerStockPorVariantes(
    productoId: string
  ): Promise<{ data: VarianteProducto[] | null; error: string | null }> {
    try {
      const supabase = getSupabase();
      if (!supabase) return { data: null, error: 'Supabase no configurado' };

      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          color_id,
          size_id,
          stock,
          precio,
          colors(nombre, codigo_hex),
          sizes(nombre, orden)
        `)
        .eq('product_id', productoId);

      if (error) return { data: null, error: error.message };

      const mapped = (data || []).map((d: any) => ({
        id: d.id,
        product_id: d.product_id,
        color_id: d.color_id,
        size_id: d.size_id,
        stock: d.stock,
        precio: d.precio,
        colors: Array.isArray(d.colors) ? d.colors[0] : d.colors,
        sizes: Array.isArray(d.sizes) ? d.sizes[0] : d.sizes
      }));

      return { data: mapped, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};
