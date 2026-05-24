import { create } from 'zustand'
import supabase from '../services/supabaseClient'
import { Product, EstadoProducto, CatalogoTipo } from '../types'

interface ProductFilters {
  search: string
  categoria: string | null
  color: string | null
  talla: string | null
  estado: EstadoProducto | null
  tipo: CatalogoTipo | null
}

interface ProductState {
  products: Product[]
  loading: boolean
  error: string | null
  page: number
  hasMore: boolean
  filters: ProductFilters
  categorias: string[]
  colores: string[]
  tallas: string[]

  fetchProducts: (reset?: boolean) => Promise<void>
  setPage: (page: number) => void
  setFilters: (filters: Partial<ProductFilters>) => void
  resetFilters: () => void
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

const PAGE_SIZE = 20

const defaultFilters: ProductFilters = {
  search: '',
  categoria: null,
  color: null,
  talla: null,
  estado: 'activo',
  tipo: null,
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  page: 0,
  hasMore: true,
  filters: defaultFilters,
  categorias: [],
  colores: [],
  tallas: [],

  fetchProducts: async (reset = false) => {
    const { filters, page, products } = get()
    if (get().loading) return

    set({ loading: true, error: null })

    try {
      const from = reset ? 0 : page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

      if (filters.estado) {
        query = query.eq('estado_producto', filters.estado)
      }
      if (filters.categoria) {
        query = query.eq('categoria', filters.categoria)
      }
      if (filters.color) {
        query = query.eq('color', filters.color)
      }
      if (filters.talla) {
        query = query.eq('talla', filters.talla)
      }
      if (filters.tipo) {
        query = query.eq('catalogo_tipo', filters.tipo)
      }
      if (filters.search) {
        query = query.or(`nombre.ilike.%${filters.search}%,codigo.ilike.%${filters.search}%,modelo.ilike.%${filters.search}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      const newProducts = reset ? (data || []) : [...products, ...(data || [])]
      const hasMore = count ? newProducts.length < count : false

      const categorias = [...new Set(data?.map(p => p.categoria).filter(Boolean) as string[])]
      const colores = [...new Set(data?.map(p => p.color).filter(Boolean) as string[])]
      const tallas = [...new Set(data?.map(p => p.talla).filter(Boolean) as string[])]

      set({
        products: newProducts,
        loading: false,
        hasMore,
        page: reset ? 0 : page + 1,
        categorias,
        colores,
        tallas,
      })
    } catch (error: any) {
      set({ loading: false, error: error.message })
    }
  },

  setPage: (page) => set({ page }),

  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } })
    get().fetchProducts(true)
  },

  resetFilters: () => {
    set({ filters: defaultFilters })
    get().fetchProducts(true)
  },

  addProduct: async (product) => {
    const productAny = product as any
    const stockByVariants = productAny.stockByVariants
    const productData = { ...productAny }
    delete productData.stockByVariants
    
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()
    
    if (productError) throw productError
    
    if (stockByVariants && stockByVariants.length > 0) {
      const variantes = stockByVariants.map((v: any) => ({
        product_id: newProduct.id,
        color_id: v.colorId,
        size_id: v.sizeId,
        stock: v.stock || 0,
        precio: v.precio || 0
      }))
      
      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantes)
      
      if (variantsError) {
        await supabase.from('products').delete().eq('id', newProduct.id)
        throw variantsError
      }
    }
    
    get().fetchProducts(true)
  },

  updateProduct: async (id, data) => {
    const dataAny = data as any
    const stockByVariants = dataAny.stockByVariants
    const productData = { ...dataAny }
    delete productData.stockByVariants
    
    const { error: productError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
    
    if (productError) throw productError
    
    if (stockByVariants) {
      await supabase.from('product_variants').delete().eq('product_id', id)
      
      if (stockByVariants.length > 0) {
        const variantes = stockByVariants.map((v: any) => ({
          product_id: id,
          color_id: v.colorId,
          size_id: v.sizeId,
          stock: v.stock || 0,
          precio: v.precio || 0
        }))
        
        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantes)
        
        if (variantsError) throw variantsError
      }
    }
    
    get().fetchProducts(true)
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    get().fetchProducts(true)
  },
}))
