import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Category, StoreSettings, ThemeType, SocialNetwork, EstadoCatalogo, TipoCatalogo, DirectSale, ShippingField, StockMovement, Cliente, Reserva, ConsultaProducto, Color, Talla, Modelo, Catalogo } from '../types';
import { mockProducts, mockCategories, mockReservas, mockConsultas } from '../services/mockData';
import supabase from '../services/supabaseClient';

const persistStockMovement = async (movement: StockMovement) => {
  const { getSupabase } = await import('../services/supabaseClient');
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('stock_movements').insert({
    product_id: movement.productId,
    product_name: movement.productName,
    tipo: movement.tipo,
    cantidad: movement.cantidad,
    stock_anterior: movement.stock_anterior,
    stock_nuevo: movement.stock_nuevo,
    motivo: movement.motivo,
    referencia: movement.referencia,
  });
};

const defaultClientes: Cliente[] = [
  { id: 'CLI-001', nombre: 'María López', email: 'maria@email.com', telefono: '3001234567', direccion: 'Calle 123 #45-67', ciudad: 'Bogotá', documento: '12345678', tipo_documento: 'cc', fecha_registro: '2024-01-15', observaciones: 'Cliente frecuente' },
  { id: 'CLI-002', nombre: 'Carlos Ruiz', email: 'carlos@email.com', telefono: '3209876543', direccion: 'Carrera 78 #12-34', ciudad: 'Medellín', documento: '98765432', tipo_documento: 'cc', fecha_registro: '2024-01-10', observaciones: '' },
  { id: 'CLI-003', nombre: 'Ana Torres', email: 'ana@email.com', telefono: '3154567890', direccion: 'Avenida 56 #78-90', ciudad: 'Cali', documento: '45678901', tipo_documento: 'nit', fecha_registro: '2024-01-08', observaciones: 'Mayorista' },
];

const defaultShippingFields: ShippingField[] = [
  { id: '1', label: 'Nombre del cliente', key: 'cliente', enabled: true, order: 1 },
  { id: '2', label: 'ID del pedido', key: 'id', enabled: true, order: 2 },
  { id: '3', label: 'Correo electrónico', key: 'email', enabled: true, order: 3 },
  { id: '4', label: 'Teléfono', key: 'telefono', enabled: true, order: 4 },
  { id: '5', label: 'Dirección', key: 'direccion', enabled: true, order: 5 },
  { id: '6', label: 'Ciudad', key: 'ciudad', enabled: true, order: 6 },
];

const defaultSettings: StoreSettings = {
  storeName: 'Leggings Catalogo',
  storeUrl: '',
  logo: '',
  theme: 'moderno',
  contacts: {
    address: '',
    city: '',
    country: '',
    whatsapp: '',
    telegram: '',
    email: 'hola@leggingscatalogo.com',
    phone: '',
  },
  socialNetworks: [
    { id: '1', name: 'Facebook', link: '', icon: '📘', active: true },
    { id: '2', name: 'Instagram', link: '', icon: '📸', active: true },
    { id: '3', name: 'Twitter', link: '', icon: '🐦', active: false },
  ],
  shippingFields: defaultShippingFields,
  costo_envio: 5,
  visitas: 0,
};

const defaultDirectSales: DirectSale[] = [];

interface AppState {
  products: Product[];
  categories: Category[];
  directSales: DirectSale[];
  clientes: Cliente[];
  reservas: Reserva[];
  consultas: ConsultaProducto[];
  settings: StoreSettings;
  movements: StockMovement[];
  colors: Color[];
  tallas: Talla[];
  modelos: Modelo[];
  catalogos: Catalogo[];
  selectedProduct: Product | null;
  selectedCategory: Category | null;
  selectedReserva: Reserva | null;
  isProductModalOpen: boolean;
  isCategoryModalOpen: boolean;
  isDeleteModalOpen: boolean;
  deleteItemId: string | null;
  deleteItemType: 'product' | 'category' | null;
  searchQuery: string;
  categoryFilter: string;
  productsPage: number;
  productsHasMore: boolean;
  productsLoading: boolean;
  
  // Filtros de catálogo
  catalogoFilter: EstadoCatalogo | 'todos';
  tipoCatalogoFilter: TipoCatalogo | 'todos';
  liquidacionFilter: boolean | 'todos';
  
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  fetchProductsFromSupabase: (reset?: boolean) => Promise<void>;
  
  // Gestión de catálogo
  activateProduct: (id: string) => void;
  deactivateProduct: (id: string) => void;
  setEstadoCatalogo: (id: string, estado: EstadoCatalogo) => void;
  setTipoCatalogo: (id: string, tipo: TipoCatalogo) => void;
  setColeccion: (id: string, coleccion: string) => void;
  enviarLiquidacion: (id: string, precioLiquidacion: number) => void;
  quitarLiquidacion: (id: string) => void;
  reactivarProducto: (id: string) => void;
  actualizarCicloProducto: (id: string) => void;
  actualizarTodosLosCiclos: () => void;
  
  // Gestión de ventas directas
  addDirectSale: (sale: DirectSale) => void;
  updateDirectSale: (id: string, sale: Partial<DirectSale>) => void;
  deleteDirectSale: (id: string) => void;
  fetchDirectSalesFromSupabase: () => Promise<void>;
  
  // Gestión de clientes
  addCliente: (cliente: Cliente) => Promise<void>;
  updateCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  searchClientes: (query: string) => Cliente[];
  
  // Gestión de reservas
  addReserva: (reserva: Reserva) => void;
  updateReserva: (id: string, reserva: Partial<Reserva>) => void;
  deleteReserva: (id: string) => void;
  setSelectedReserva: (reserva: Reserva | null) => void;
  toggleReservaCheck: (id: string, field: 'whatsapp_revisado' | 'comprobante_verificado' | 'abono_confirmado') => void;
  
  // Cargar datos desde Supabase
  fetchCategoriesFromSupabase: () => Promise<void>;
  fetchModelsFromSupabase: () => Promise<void>;
  fetchColorsFromSupabase: () => Promise<void>;
  fetchSizesFromSupabase: () => Promise<void>;
  
  // Gestión de consultas
  addConsulta: (consulta: ConsultaProducto) => void;
  clearConsultasOlderThan: (months: number) => void;
  getConsultasByProduct: (productId: string) => ConsultaProducto[];
  getAllConsultas: () => ConsultaProducto[];
  
  // Gestión de movimientos de stock
  addMovement: (movement: StockMovement) => void;
  getMovementsByProduct: (productId: string) => StockMovement[];
  getAllMovements: () => StockMovement[];
  addStock: (productId: string, cantidad: number, motivo: string, referencia: string, tipo: StockMovement['tipo']) => void;
  removeStock: (productId: string, cantidad: number, motivo: string, referencia: string) => void;
  
  // Gestión de campos de envío
  addShippingField: (field: ShippingField) => void;
  updateShippingField: (id: string, field: Partial<ShippingField>) => void;
  deleteShippingField: (id: string) => void;
  reorderShippingFields: (fields: ShippingField[]) => void;
  
  // Gestión de colores
  addColor: (color: Color) => void;
  updateColor: (id: string, color: Partial<Color>) => void;
  deleteColor: (id: string) => void;
  toggleColorStatus: (id: string) => void;
  
  // Gestión de tallas
  addTalla: (talla: Talla) => void;
  updateTalla: (id: string, talla: Partial<Talla>) => void;
  deleteTalla: (id: string) => void;
  toggleTallaStatus: (id: string) => void;
  
  // Gestión de modelos
  addModelo: (modelo: Modelo) => void;
  updateModelo: (id: string, modelo: Partial<Modelo>) => void;
  deleteModelo: (id: string) => void;
  toggleModeloStatus: (id: string) => void;
  
  // Gestión de catálogos
  addCatalogo: (catalogo: Catalogo) => void;
  updateCatalogo: (id: string, catalogo: Partial<Catalogo>) => void;
  deleteCatalogo: (id: string) => void;
  toggleCatalogoActivo: (id: string) => void;
  
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  setSettings: (settings: Partial<StoreSettings>) => void;
  incrementVisitas: () => void;
  updateTheme: (theme: ThemeType) => void;
  updateContacts: (contacts: Partial<StoreSettings['contacts']>) => void;
  addSocialNetwork: (network: SocialNetwork) => void;
  updateSocialNetwork: (id: string, network: Partial<SocialNetwork>) => void;
  deleteSocialNetwork: (id: string) => void;
  
  setSelectedProduct: (product: Product | null) => void;
  setSelectedCategory: (category: Category | null) => void;
  
  openProductModal: (product?: Product) => void;
  closeProductModal: () => void;
  openCategoryModal: (category?: Category) => void;
  closeCategoryModal: () => void;
  openDeleteModal: (id: string, type: 'product' | 'category') => void;
  closeDeleteModal: () => void;
  confirmDelete: () => void;
  
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (categoryId: string) => void;
  setCatalogoFilter: (filter: EstadoCatalogo | 'todos') => void;
  setTipoCatalogoFilter: (filter: TipoCatalogo | 'todos') => void;
  setLiquidacionFilter: (filter: boolean | 'todos') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      directSales: defaultDirectSales,
      clientes: defaultClientes,
      reservas: mockReservas,
      consultas: mockConsultas,
  settings: defaultSettings,
  movements: [],
  colors: [
    { id: '1', nombre: 'Negro', codigo_hex: '#1a1a1a', status: 'active', created_at: new Date().toISOString() },
    { id: '2', nombre: 'Gris', codigo_hex: '#808080', status: 'active', created_at: new Date().toISOString() },
    { id: '3', nombre: 'Azul', codigo_hex: '#4169E1', status: 'active', created_at: new Date().toISOString() },
    { id: '4', nombre: 'Rosado', codigo_hex: '#FF69B4', status: 'active', created_at: new Date().toISOString() },
    { id: '5', nombre: 'Beige', codigo_hex: '#F5F5DC', status: 'active', created_at: new Date().toISOString() },
    { id: '6', nombre: 'Dorado', codigo_hex: '#DAA520', status: 'active', created_at: new Date().toISOString() },
    { id: '7', nombre: 'Verde', codigo_hex: '#228B22', status: 'active', created_at: new Date().toISOString() },
    { id: '8', nombre: 'Morado', codigo_hex: '#800080', status: 'active', created_at: new Date().toISOString() },
  ],
  tallas: [
    { id: '1', nombre: 'XS', orden: 1, status: 'active', created_at: new Date().toISOString() },
    { id: '2', nombre: 'S', orden: 2, status: 'active', created_at: new Date().toISOString() },
    { id: '3', nombre: 'M', orden: 3, status: 'active', created_at: new Date().toISOString() },
    { id: '4', nombre: 'L', orden: 4, status: 'active', created_at: new Date().toISOString() },
    { id: '5', nombre: 'XL', orden: 5, status: 'active', created_at: new Date().toISOString() },
  ],
  modelos: [
    { id: '1', nombre: 'Universo', descripcion: 'Modelo universe de alta compresión', status: 'active', created_at: new Date().toISOString() },
    { id: '2', nombre: 'Natural', descripcion: 'Modelo natural de comodidad extrema', status: 'active', created_at: new Date().toISOString() },
    { id: '3', nombre: 'Fitnets', descripcion: 'Modelo fitnets con control abdominal', status: 'active', created_at: new Date().toISOString() },
  ],
  catalogos: [],
  selectedProduct: null,
  selectedCategory: null,
  selectedReserva: null,
  isProductModalOpen: false,
  isCategoryModalOpen: false,
  isDeleteModalOpen: false,
  deleteItemId: null,
  deleteItemType: null,
  searchQuery: '',
  categoryFilter: '',
  productsPage: 0,
  productsHasMore: true,
  productsLoading: false,
  catalogoFilter: 'todos',
  tipoCatalogoFilter: 'todos',
  liquidacionFilter: 'todos',

  setProducts: (products) => set({ products }),
  
  addProduct: async (product) => {
    console.log('=== addProduct called ===', product)
    console.log('supabase available:', !!supabase)
    
    if (supabase) {
      try {
        const { getSupabase } = await import('../services/supabaseClient')
        const supabase = getSupabase()
        
        if (!supabase) {
          throw new Error('Supabase no está disponible')
        }

        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Session:', sessionData?.session ? 'Active' : 'None')
        
        const productData: Record<string, any> = {
          codigo: product.codigo || null,
          nombre: product.name || 'Sin nombre',
          descripcion: product.description || null,
          precio: product.price || 0,
          stock: product.stock || 0,
          stock_minimo: 0,
          colores: product.colors || [],
          tallas: product.sizes || [],
          imagenes: product.images || [],
          estado_catalogo: product.estado_catalogo || 'clasico',
          tipo_catalogo: product.tipo_catalogo || 'permanente',
          coleccion: product.coleccion || '',
          activo: product.status !== 'inactive',
          en_liquidacion: product.en_liquidacion || false,
          precio_liquidacion: product.precio_liquidacion || null,
          slug: product.name?.toLowerCase().replace(/\s+/g, '-') || `product-${Date.now()}`,
          meta_titulo: product.name || null,
          meta_descripcion: product.description || null,
        }
        
        // Calcular stock total y precio desde variantes
        const totalStock = product.stockByVariants?.reduce((sum, v) => sum + v.stock, 0) || product.stock || 0
        const precios = product.stockByVariants?.filter(v => v.precio && v.precio > 0).map(v => v.precio) || []
        const precioBase = precios.length > 0 ? Math.max(...precios) : (product.price || 0)
        
        productData.stock = totalStock
        productData.precio = precioBase
        
        if (product.category && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.category)) {
          productData.category_id = product.category
        }
        
        if (product.modelo && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.modelo)) {
          productData.model_id = product.modelo
        }
        
        console.log('Sending to Supabase:', productData)
        
        const { data, error, status } = await supabase.from('products').insert(productData).select().single()
        
        console.log('Supabase response - status:', status, 'data:', data, 'error:', error)
        
        if (error) {
          console.error('Error guardando en Supabase:', error.code, error.message, error.details)
          // Guardar localmente como fallback
          set((state) => ({ products: [...state.products, product] }))
        } else if (data) {
          const newProduct: Product = {
            ...product,
            id: data.id,
            name: data.nombre,
            description: data.descripcion,
            price: data.precio,
            stock: data.stock,
            category: data.category_id,
            images: data.imagenes || [],
            sizes: data.tallas || [],
            colors: data.colores || [],
            status: data.activo ? 'active' : 'inactive',
            modelo: data.model_id,
            codigo: data.codigo,
            estado_catalogo: data.estado_catalogo,
            tipo_catalogo: data.tipo_catalogo,
            coleccion: data.coleccion,
            activo: data.activo,
            en_liquidacion: data.en_liquidacion,
            precio_liquidacion: data.precio_liquidacion,
            created_at: data.created_at,
            updated_at: data.updated_at,
            stockByVariants: product.stockByVariants || [],
          }
          set((state) => ({ products: [...state.products, newProduct] }))
          
          // Guardar stock por variante (color + talla + stock + precio + imagen)
          if (product.stockByVariants && product.stockByVariants.length > 0) {
            for (const variant of product.stockByVariants) {
              const sku = `${product.codigo || 'PROD'}-${variant.colorName}-${variant.sizeName}`.toUpperCase().replace(/\s+/g, '')
              await supabase.from('product_variants').insert({
                product_id: data.id,
                color_id: variant.colorId,
                size_id: variant.sizeId,
                stock: variant.stock,
                precio: variant.precio || 0,
                color_image: variant.colorImage || null,
                sku: sku
              })
            }
          }
        }
      } catch (err) {
        console.error('Exception in addProduct:', err)
        set((state) => ({ products: [...state.products, product] }))
      }
    } else {
      console.log('Supabase not available, saving locally')
      set((state) => ({ products: [...state.products, product] }))
    }
  },
  
  updateProduct: async (id, productUpdate) => {
    const { getSupabase } = await import('../services/supabaseClient')
    const supabase = getSupabase()
    
    // Calcular stock total y precio desde variantes
    const totalStock = productUpdate.stockByVariants?.reduce((sum, v) => sum + v.stock, 0) || productUpdate.stock || 0
    const precios = productUpdate.stockByVariants?.filter(v => v.precio && v.precio > 0).map(v => v.precio) || []
    const precioBase = precios.length > 0 ? Math.max(...precios) : (productUpdate.price || 0)
    
    if (supabase) {
      const { error } = await supabase.from('products').update({
        codigo: productUpdate.codigo,
        nombre: productUpdate.name,
        descripcion: productUpdate.description,
        precio: precioBase,
        stock: totalStock,
        category_id: productUpdate.category,
        model_id: productUpdate.modelo,
        colores: productUpdate.colors,
        tallas: productUpdate.sizes,
        imagenes: productUpdate.images,
        estado_catalogo: productUpdate.estado_catalogo,
        tipo_catalogo: productUpdate.tipo_catalogo,
        coleccion: productUpdate.coleccion,
        activo: productUpdate.status === 'inactive' ? false : true,
        en_liquidacion: productUpdate.en_liquidacion,
        precio_liquidacion: productUpdate.precio_liquidacion,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) {
        console.error('Error actualizando en Supabase:', error)
        return
      }
      
      // Actualizar stock por variante
      if (productUpdate.stockByVariants && productUpdate.stockByVariants.length > 0) {
        // Eliminar registros anteriores
        await supabase.from('product_variants').delete().eq('product_id', id)
        
        // Insertar nuevos registros
        for (const variant of productUpdate.stockByVariants) {
          const sku = `${productUpdate.codigo || 'PROD'}-${variant.colorName}-${variant.sizeName}`.toUpperCase().replace(/\s+/g, '')
          await supabase.from('product_variants').insert({
            product_id: id,
            color_id: variant.colorId,
            size_id: variant.sizeId,
            stock: variant.stock,
            precio: variant.precio || 0,
            color_image: variant.colorImage || null,
            sku: sku
          })
        }
      }
    }
    set((state) => ({
      products: state.products.map((p) => 
        p.id === id ? { ...p, ...productUpdate, stock: totalStock, updated_at: new Date().toISOString() } : p
      )
    }))
  },
  
  deleteProduct: async (id) => {
    const { getSupabase } = await import('../services/supabaseClient')
    const supabase = getSupabase()
    
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) {
        console.error('Error deleting product:', error)
        return
      }
    }
    set((state) => ({
      products: state.products.filter((p) => p.id !== id)
    }))
  },

  fetchProductsFromSupabase: async (reset = false) => {
    if (!supabase) return
    
    const currentState = get()
    const page = reset ? 0 : currentState.productsPage
    const pageSize = 20
    const from = page * pageSize
    const to = from + pageSize - 1
    
    if (currentState.productsLoading) return
    set({ productsLoading: true })
    
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Error fetching products from Supabase:', error)
      set({ productsLoading: false })
      return
    }
    
    // Si no hay datos o menos de lo esperado, no hay más páginas
    if (!data || data.length === 0) {
      set({ productsLoading: false, productsHasMore: false })
      return
    }
    
    if (data) {
      // Obtener stock por variante para cada producto
      const productsWithVariants = await Promise.all(data.map(async (p) => {
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*, colors(nombre, codigo_hex), sizes(nombre)')
          .eq('product_id', p.id)
        
        const stockByVariants: any[] = []
        
        if (variantsData) {
          for (const variant of variantsData) {
            stockByVariants.push({
              colorId: variant.color_id,
              colorName: variant.colors?.nombre || '',
              colorHex: variant.colors?.codigo_hex || '#000',
              colorImage: variant.color_image || '',
              sizeId: variant.size_id,
              sizeName: variant.sizes?.nombre || '',
              stock: variant.stock || 0,
              precio: variant.precio || 0
            })
          }
        }
        
        return { ...p, stockByVariants }
      }))
      
      // Calcular precio máximo de las variantes para cada producto
      const mappedProducts: Product[] = productsWithVariants.map((p) => {
        const precios = p.stockByVariants?.filter(v => v.precio && v.precio > 0).map(v => v.precio) || []
        const priceFromVariants = precios.length > 0 ? Math.max(...precios) : 0
        const finalPrice = priceFromVariants > 0 ? priceFromVariants : (p.precio || 0)
        
        return {
          id: p.id,
          name: p.nombre,
          description: p.descripcion,
          price: finalPrice,
          stock: p.stock,
          category: p.category_id,
          images: p.imagenes || [],
          sizes: p.tallas || [],
          colors: p.colores || [],
          status: p.activo ? 'active' : 'inactive',
          modelo: p.model_id,
          color: '',
          codigo: p.codigo,
          estado_catalogo: p.estado_catalogo,
          tipo_catalogo: p.tipo_catalogo,
          coleccion: p.coleccion,
          activo: p.activo,
          en_liquidacion: p.en_liquidacion,
          precio_liquidacion: p.precio_liquidacion,
          created_at: p.created_at,
          updated_at: p.updated_at,
          fecha_creacion: p.created_at,
          fecha_actualizacion: p.updated_at,
          stockByVariants: p.stockByVariants || [],
        }
      })
      
      const currentProducts = currentState.productsPage === 0 || reset ? [] : get().products
      const newProducts = reset ? mappedProducts : [...currentProducts, ...mappedProducts]
      const hasMore = count ? newProducts.length < count : false
      
      set({ 
        products: newProducts,
        productsPage: reset ? 0 : currentState.productsPage + 1,
        productsHasMore: hasMore,
        productsLoading: false
      })
    }
  },

  fetchCategoriesFromSupabase: async () => {
    if (!supabase) return
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('orden', { ascending: true })
    
    if (error) {
      console.error('Error fetching categories from Supabase:', error)
      return
    }
    
    if (data) {
      const mappedCategories: Category[] = data.map((c: any) => ({
        id: c.id,
        name: c.nombre,
        description: c.descripcion,
        image: c.imagen,
        status: c.activa ? 'active' : 'inactive',
        created_at: c.created_at,
      }))
      
      set((state) => {
        const existingIds = new Set(state.categories.map(c => c.id))
        const newCategories = mappedCategories.filter(c => !existingIds.has(c.id))
        return { categories: [...state.categories, ...newCategories] }
      })
    }
  },

  fetchModelsFromSupabase: async () => {
    if (!supabase) return
    
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })
    
    if (error) {
      console.error('Error fetching models from Supabase:', error)
      return
    }
    
    if (data) {
      const mappedModels: Modelo[] = data.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        descripcion: m.descripcion,
        status: m.activo ? 'active' : 'inactive',
        created_at: m.created_at,
      }))
      set({ modelos: mappedModels })
    }
  },

  fetchColorsFromSupabase: async () => {
    if (!supabase) return
    
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })
    
    if (error) {
      console.error('Error fetching colors from Supabase:', error)
      return
    }
    
    if (data) {
      const seen = new Map<string, Color>()
      data.forEach((c) => {
        const nombre = c.nombre?.toLowerCase().trim()
        if (nombre && !seen.has(nombre)) {
          seen.set(nombre, {
            id: c.id,
            nombre: c.nombre,
            codigo_hex: c.codigo_hex,
            status: c.activo ? 'active' : 'inactive',
            created_at: c.created_at,
          })
        }
      })
      set({ colors: Array.from(seen.values()) })
    }
  },


  fetchSizesFromSupabase: async () => {
    if (!supabase) return
    
    const { data, error } = await supabase
      .from('sizes')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })
    
    if (error) {
      console.error('Error fetching sizes from Supabase:', error)
      return
    }
    
    if (data) {
      const mappedTallas: Talla[] = data.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        orden: s.orden,
        status: s.activo ? 'active' : 'inactive',
        created_at: s.created_at,
      }))
      set({ tallas: mappedTallas })
    }
  },

  activateProduct: (id) => set((state) => ({
    products: state.products.map((p) =>
      p.id === id ? { 
        ...p, 
        activo: true, 
        status: 'active',
        estado_catalogo: 'clasico' as EstadoCatalogo,
        fecha_actualizacion: new Date().toISOString()
      } : p
    )
  })),

  deactivateProduct: (id) => set((state) => ({
    products: state.products.map((p) =>
      p.id === id ? { 
        ...p, 
        activo: false, 
        status: 'inactive',
        estado_catalogo: 'descontinuado' as EstadoCatalogo,
        fecha_actualizacion: new Date().toISOString()
      } : p
    )
  })),

  setEstadoCatalogo: (id, estado) => set((state) => ({
    products: state.products.map((p) =>
      p.id === id ? { 
        ...p, 
        estado_catalogo: estado,
        fecha_actualizacion: new Date().toISOString()
      } : p
    )
  })),

  setTipoCatalogo: (id, tipo) => set((state) => ({
    products: state.products.map((p) =>
      p.id === id ? { 
        ...p, 
        tipo_catalogo: tipo,
        fecha_actualizacion: new Date().toISOString()
      } : p
    )
  })),

  setColeccion: (id, coleccion) => set((state) => ({
    products: state.products.map((p) =>
      p.id === id ? { 
        ...p, 
        coleccion,
        fecha_actualizacion: new Date().toISOString()
      } : p
    )
  })),

  enviarLiquidacion: (id, precioLiquidacion) => set((state) => ({
    products: state.products.map((p) =>
      p.id === id ? { 
        ...p, 
        en_liquidacion: true,
        precio_liquidacion: precioLiquidacion,
        estado_catalogo: 'liquidacion' as EstadoCatalogo,
        fecha_actualizacion: new Date().toISOString()
      } : p
    )
  })),

  quitarLiquidacion: (id) => set((state) => ({
    products: state.products.map((p) =>
      p.id === id ? { 
        ...p, 
        en_liquidacion: false,
        precio_liquidacion: null,
        estado_catalogo: 'clasico' as EstadoCatalogo,
        fecha_actualizacion: new Date().toISOString()
      } : p
    )
  })),

  reactivarProducto: (id) => set((state) => ({
    products: state.products.map((p) =>
      p.id === id ? { 
        ...p, 
        activo: true,
        status: 'active',
        estado_catalogo: 'clasico' as EstadoCatalogo,
        en_liquidacion: false,
        precio_liquidacion: null,
        fecha_actualizacion: new Date().toISOString()
      } : p
    )
  })),

  actualizarCicloProducto: (id) => {
    const state = get();
    const product = state.products.find(p => p.id === id);
    if (!product) return;

    const fechaCreacion = new Date(product.fecha_creacion || product.created_at);
    const hoy = new Date();
    const dias = Math.floor((hoy.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));

    let nuevoEstado: EstadoCatalogo;
    if (dias <= 15) {
      nuevoEstado = 'exclusivo';
    } else if (dias <= 30) {
      nuevoEstado = 'tendencia';
    } else if (dias <= 45) {
      nuevoEstado = 'clasico';
    } else {
      nuevoEstado = 'descontinuado';
    }

    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { 
          ...p, 
          estado_catalogo: nuevoEstado,
          fecha_actualizacion: new Date().toISOString()
        } : p
      )
    }));
  },

  actualizarTodosLosCiclos: () => {
    const state = get();
    state.products.forEach(product => {
      const fechaCreacion = new Date(product.fecha_creacion || product.created_at);
      const hoy = new Date();
      const dias = Math.floor((hoy.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));

      let nuevoEstado: EstadoCatalogo;
      if (dias <= 15) {
        nuevoEstado = 'exclusivo';
      } else if (dias <= 30) {
        nuevoEstado = 'tendencia';
      } else if (dias <= 45) {
        nuevoEstado = 'clasico';
      } else {
        nuevoEstado = 'descontinuado';
      }

      set((state) => ({
        products: state.products.map((p) =>
          p.id === product.id && p.estado_catalogo !== 'liquidacion' ? { 
            ...p, 
            estado_catalogo: nuevoEstado,
            fecha_actualizacion: new Date().toISOString()
          } : p
        )
      }));
    });
  },
  
  setCategories: (categories) => set({ categories }),
  
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, category]
  })),

  updateCategory: (id, categoryUpdate) => set((state) => ({
    categories: state.categories.map((c) => 
      c.id === id ? { ...c, ...categoryUpdate } : c
    )
  })),

  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter((c) => c.id !== id)
  })),

  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  openProductModal: (product) => set({ 
    isProductModalOpen: true, 
    selectedProduct: product || null 
  }),
  
  closeProductModal: () => set({ 
    isProductModalOpen: false, 
    selectedProduct: null 
  }),
  
  openCategoryModal: (category) => set({ 
    isCategoryModalOpen: true, 
    selectedCategory: category || null 
  }),
  
  closeCategoryModal: () => set({ 
    isCategoryModalOpen: false, 
    selectedCategory: null 
  }),
  
  openDeleteModal: (id, type) => set({ 
    isDeleteModalOpen: true, 
    deleteItemId: id, 
    deleteItemType: type 
  }),
  
  closeDeleteModal: () => set({ 
    isDeleteModalOpen: false, 
    deleteItemId: null, 
    deleteItemType: null 
  }),
  
  confirmDelete: () => {
    const { deleteItemId, deleteItemType, deleteProduct, deleteCategory } = get();
    if (deleteItemId && deleteItemType === 'product') {
      deleteProduct(deleteItemId);
    } else if (deleteItemId && deleteItemType === 'category') {
      deleteCategory(deleteItemId);
    }
    set({ 
      isDeleteModalOpen: false, 
      deleteItemId: null, 
      deleteItemType: null 
    });
  },
  
  setSettings: (settingsUpdate) => set((state) => ({
    settings: { ...state.settings, ...settingsUpdate }
  })),
  
  incrementVisitas: () => set((state) => ({
    settings: { ...state.settings, visitas: (state.settings.visitas || 0) + 1 }
  })),
  
  updateTheme: (theme) => set((state) => ({
    settings: { ...state.settings, theme }
  })),
  
  updateContacts: (contactsUpdate) => set((state) => ({
    settings: { 
      ...state.settings, 
      contacts: { ...state.settings.contacts, ...contactsUpdate } 
    }
  })),
  
  addSocialNetwork: (network) => set((state) => ({
    settings: { 
      ...state.settings, 
      socialNetworks: [...state.settings.socialNetworks, network] 
    }
  })),
  
  updateSocialNetwork: (id, networkUpdate) => set((state) => ({
    settings: {
      ...state.settings,
      socialNetworks: state.settings.socialNetworks.map((n) =>
        n.id === id ? { ...n, ...networkUpdate } : n
      )
    }
  })),
  
  deleteSocialNetwork: (id) => set((state) => ({
    settings: {
      ...state.settings,
      socialNetworks: state.settings.socialNetworks.filter((n) => n.id !== id)
    }
  })),
  
  // ========== GESTIÓN DE VENTAS DIRECTAS ==========
  addDirectSale: async (sale) => {
    console.log("Guardando venta en direct_sales");
    set((state) => ({
      directSales: [...state.directSales, sale],
    }));
    
    const sb = (await import('../services/supabaseClient')).getSupabase();
    if (!sb) {
      console.warn('Supabase no disponible — venta guardada solo localmente');
      return;
    }

    let user_id = null;
    let usuario_nombre = '';
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        user_id = user.id;
        usuario_nombre = user.user_metadata?.nombre || user.email || '';
      }
    } catch {}

    try {
      const { data, error } = await sb.from('direct_sales').insert({
        codigo: sale.id,
        cliente: sale.cliente,
        cliente_id: sale.clienteId || null,
        email: sale.email || '',
        telefono: sale.telefono || '',
        direccion: sale.direccion || '',
        ciudad: sale.ciudad || '',
        items: sale.items,
        monto: sale.monto,
        estado: sale.estado,
        metodo_pago: sale.metodo_pago || 'efectivo',
        monto_pagado: sale.monto_pagado || 0,
        cambio: sale.cambio || 0,
        transferencia_imagen: sale.transferencia_imagen || null,
        tarjeta_last4: sale.tarjeta_last4 || null,
        tarjeta_autori: sale.tarjeta_autori || null,
        factura_generada: sale.factura_generada || false,
        notas: sale.notas || '',
        fecha: sale.fecha,
        user_id,
        usuario_nombre,
      }).select().single();
      if (error) {
        console.error('Error guardando en direct_sales:', error);
      } else {
        console.log('Venta guardada en direct_sales:', data);
      }
    } catch (err) {
      console.error('Exception guardando venta directa:', err);
    }
  },

  updateDirectSale: async (id, saleUpdate) => {
    set((state) => ({
      directSales: state.directSales.map((s) =>
        s.id === id ? { ...s, ...saleUpdate } : s
      ),
    }));

    const sb = (await import('../services/supabaseClient')).getSupabase();
    if (!sb) return;

    try {
      const updateData: any = {};
      if (saleUpdate.estado !== undefined) updateData.estado = saleUpdate.estado;
      if (saleUpdate.monto_pagado !== undefined) updateData.monto_pagado = saleUpdate.monto_pagado;
      if (saleUpdate.notas !== undefined) updateData.notas = saleUpdate.notas;
      if (saleUpdate.items !== undefined) updateData.items = saleUpdate.items;
      if (saleUpdate.monto !== undefined) updateData.monto = saleUpdate.monto;
      const { error } = await sb.from('direct_sales').update(updateData).eq('codigo', id);
      if (error) console.error('Error actualizando direct_sales:', error);
    } catch (err) {
      console.error('Exception actualizando venta:', err);
    }
  },

  deleteDirectSale: async (id) => {
    set((state) => ({
      directSales: state.directSales.filter((s) => s.id !== id),
    }));

    const sb = (await import('../services/supabaseClient')).getSupabase();
    if (!sb) return;

    try {
      const { error } = await sb.from('direct_sales').delete().eq('codigo', id);
      if (error) console.error('Error eliminando de direct_sales:', error);
    } catch (err) {
      console.error('Exception eliminando venta:', err);
    }
  },

  fetchDirectSalesFromSupabase: async () => {
    const sb = (await import('../services/supabaseClient')).getSupabase();
    if (!sb) return;

    console.log("Consultando ventas desde direct_sales");
    const { data, error } = await sb
      .from('direct_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching direct_sales:', error);
      return;
    }

    if (data && data.length > 0) {
      const mapped: DirectSale[] = data.map((p: any) => ({
        id: p.codigo,
        cliente: p.cliente,
        clienteId: p.cliente_id,
        email: p.email || '',
        telefono: p.telefono || '',
        direccion: p.direccion || '',
        ciudad: p.ciudad || '',
        items: p.items || [],
        monto: p.monto,
        estado: p.estado,
        fecha: p.fecha,
        metodo_pago: p.metodo_pago,
        monto_pagado: p.monto_pagado,
        cambio: p.cambio,
        transferencia_imagen: p.transferencia_imagen,
        tarjeta_last4: p.tarjeta_last4,
        tarjeta_autori: p.tarjeta_autori,
        factura_generada: p.factura_generada,
        notas: p.notas,
      }));
      set((state) => {
        const existingIds = new Set(state.directSales.map(s => s.id));
        const newItems = mapped.filter(s => !existingIds.has(s.id));
        return { directSales: [...state.directSales, ...newItems] };
      });
    }
  },

  // Gestión de clientes
  addCliente: async (cliente) => {
    set((state) => ({ 
      clientes: [...state.clientes, cliente] 
    }));
    
    const { getSupabase } = await import('../services/supabaseClient');
    const supabase = getSupabase();
    if (supabase) {
      try {
        const insertData: Record<string, any> = {
          nombre: cliente.nombre,
          telefono: cliente.telefono || '',
        };
        
        if (cliente.email) insertData.email = cliente.email;
        if (cliente.documento) insertData.documento = cliente.documento;
        if (cliente.tipo_documento) insertData.tipo_documento = cliente.tipo_documento;
        if (cliente.direccion) insertData.direccion = cliente.direccion;
        if (cliente.ciudad) insertData.ciudad = cliente.ciudad;
        if (cliente.observaciones) insertData.observaciones = cliente.observaciones;
        
        const { error } = await supabase.from('clients').insert(insertData);
        if (error) {
          console.error('Error guardando cliente en Supabase:', error.message, error.details, error.hint);
        }
      } catch (e) {
        console.error('Excepción guardando cliente:', e);
      }
    }
  },
  
  updateCliente: async (id, clienteUpdate) => {
    set((state) => ({
      clientes: state.clientes.map((c) => 
        c.id === id ? { ...c, ...clienteUpdate } : c
      )
    }));
    
    const { getSupabase } = await import('../services/supabaseClient');
    const supabase = getSupabase();
    if (supabase) {
      const updateData: Record<string, any> = {};
      
      if (clienteUpdate.nombre !== undefined) updateData.nombre = clienteUpdate.nombre;
      if (clienteUpdate.email !== undefined) updateData.email = clienteUpdate.email || null;
      if (clienteUpdate.telefono !== undefined) updateData.telefono = clienteUpdate.telefono || null;
      if (clienteUpdate.documento !== undefined) updateData.documento = clienteUpdate.documento || null;
      if (clienteUpdate.tipo_documento !== undefined) updateData.tipo_documento = clienteUpdate.tipo_documento || 'cc';
      if (clienteUpdate.direccion !== undefined) updateData.direccion = clienteUpdate.direccion || null;
      if (clienteUpdate.ciudad !== undefined) updateData.ciudad = clienteUpdate.ciudad || null;
      if (clienteUpdate.observaciones !== undefined) updateData.observaciones = clienteUpdate.observaciones || null;
      
      const { error } = await supabase.from('clients').update(updateData).eq('id', id);
      if (error) {
        console.error('Error actualizando cliente en Supabase:', error.message, error.details);
      }
    }
  },
  
  deleteCliente: async (id) => {
    set((state) => ({
      clientes: state.clientes.filter((c) => c.id !== id)
    }));
    
    const { getSupabase } = await import('../services/supabaseClient');
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        console.error('Error eliminando cliente en Supabase:', error);
      }
    }
  },
  
  searchClientes: (query) => {
    const state = get();
    if (!query) return state.clientes;
    const q = query.toLowerCase();
    return state.clientes.filter(c => 
      c.nombre.toLowerCase().includes(q) || 
      c.id.toLowerCase().includes(q) ||
      c.telefono.includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  },
  
  // Gestión de reservas
  addReserva: (reserva) => set((state) => ({ 
    reservas: [reserva, ...state.reservas] 
  })),
  
  updateReserva: async (id, reservaUpdate) => {
    set((state) => ({
      reservas: state.reservas.map((r) => 
        r.id === id ? { ...r, ...reservaUpdate } : r
      )
    }));

    const supabase = (await import('../services/supabaseClient')).getSupabase();
    if (!supabase) return;

    const updateData: any = {};
    if (reservaUpdate.estado_reserva !== undefined) updateData.status = reservaUpdate.estado_reserva;
    if (reservaUpdate.comprobante_url !== undefined) updateData.comprobante_url = reservaUpdate.comprobante_url;
    if (reservaUpdate.whatsapp_revisado !== undefined) updateData.whatsapp_revisado = reservaUpdate.whatsapp_revisado;
    if (reservaUpdate.comprobante_verificado !== undefined) updateData.comprobante_verificado = reservaUpdate.comprobante_verificado;
    if (reservaUpdate.abono_confirmado !== undefined) updateData.abono_confirmado = reservaUpdate.abono_confirmado;
    if (reservaUpdate.abono !== undefined) updateData.abono = reservaUpdate.abono;
    if (reservaUpdate.saldo !== undefined) updateData.saldo = reservaUpdate.saldo;
    if (reservaUpdate.notas_admin !== undefined) updateData.notas_admin = reservaUpdate.notas_admin;
    if (reservaUpdate.abonos !== undefined) updateData.abonos = reservaUpdate.abonos;

    const { error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id);

    if (error) console.error('Error actualizando reserva en Supabase:', error);
  },
  
  deleteReserva: (id) => set((state) => ({
    reservas: state.reservas.filter((r) => r.id !== id)
  })),
  
  setSelectedReserva: (reserva) => set({ selectedReserva: reserva }),
  
  toggleReservaCheck: (id, field) => set((state) => ({
    reservas: state.reservas.map((r) => 
      r.id === id ? { ...r, [field]: !r[field] } : r
    )
  })),
  
  // Gestión de consultas
  addConsulta: (consulta) => set((state) => ({ 
    consultas: [consulta, ...state.consultas] 
  })),
  clearConsultasOlderThan: (months: number) => set((state) => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return { consultas: state.consultas.filter(c => c.fecha && c.fecha >= cutoff.toISOString()) };
  }),
  
  getConsultasByProduct: (productId) => {
    const state = get();
    return state.consultas.filter(c => c.product_id === productId);
  },
  
  getAllConsultas: () => {
    const state = get();
    return state.consultas;
  },
  
  // Gestión de movimientos de stock
  addMovement: (movement) => set((state) => ({
    movements: [movement, ...state.movements]
  })),
  
  getMovementsByProduct: (productId) => {
    const state = get();
    return state.movements.filter(m => m.productId === productId);
  },
  
  getAllMovements: () => {
    const state = get();
    return state.movements;
  },
  
  addStock: (productId, cantidad, motivo, referencia, tipo) => {
    const state = get();
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const stock_anterior = product.stock;
    const stock_nuevo = stock_anterior + cantidad;
    
    const movement: StockMovement = {
      id: `MOV-${Date.now()}`,
      productId,
      productName: product.name,
      tipo,
      cantidad,
      stock_anterior,
      stock_nuevo,
      motivo,
      referencia,
      fecha: new Date().toISOString().split('T')[0]
    };
    
    set((state) => ({
      movements: [movement, ...state.movements],
      products: state.products.map(p => 
        p.id === productId ? { ...p, stock: stock_nuevo } : p
      )
    }));
    
    persistStockMovement(movement);
  },
  
  removeStock: (productId, cantidad, motivo, referencia) => {
    const state = get();
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stock < cantidad) return;
    
    const stock_anterior = product.stock;
    const stock_nuevo = stock_anterior - cantidad;
    
    const movement: StockMovement = {
      id: `MOV-${Date.now()}`,
      productId,
      productName: product.name,
      tipo: 'salida',
      cantidad: -cantidad,
      stock_anterior,
      stock_nuevo,
      motivo,
      referencia,
      fecha: new Date().toISOString().split('T')[0]
    };
    
    set((state) => ({
      movements: [movement, ...state.movements],
      products: state.products.map(p => 
        p.id === productId ? { ...p, stock: stock_nuevo } : p
      )
    }));
    
    persistStockMovement(movement);
  },
  
  // Gestión de campos de envío
  addShippingField: (field) => set((state) => ({
    settings: {
      ...state.settings,
      shippingFields: [...state.settings.shippingFields, field]
    }
  })),
  
  updateShippingField: (id, fieldUpdate) => set((state) => ({
    settings: {
      ...state.settings,
      shippingFields: state.settings.shippingFields.map((f) =>
        f.id === id ? { ...f, ...fieldUpdate } : f
      )
    }
  })),
  
  deleteShippingField: (id) => set((state) => ({
    settings: {
      ...state.settings,
      shippingFields: state.settings.shippingFields.filter((f) => f.id !== id)
    }
  })),
  
  reorderShippingFields: (fields) => set((state) => ({
    settings: {
      ...state.settings,
      shippingFields: fields
    }
  })),
  
  // Gestión de colores
  addColor: (color) => set((state) => ({ colors: [...state.colors, color] })),
  updateColor: (id, colorUpdate) => set((state) => ({
    colors: state.colors.map((c) => c.id === id ? { ...c, ...colorUpdate } : c)
  })),
  deleteColor: (id) => set((state) => ({ colors: state.colors.filter((c) => c.id !== id) })),
  toggleColorStatus: (id) => set((state) => ({
    colors: state.colors.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c)
  })),
  
  // Gestión de tallas
  addTalla: (talla) => set((state) => ({ tallas: [...state.tallas, talla] })),
  updateTalla: (id, tallaUpdate) => set((state) => ({
    tallas: state.tallas.map((t) => t.id === id ? { ...t, ...tallaUpdate } : t)
  })),
  deleteTalla: (id) => set((state) => ({ tallas: state.tallas.filter((t) => t.id !== id) })),
  toggleTallaStatus: (id) => set((state) => ({
    tallas: state.tallas.map((t) => t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t)
  })),
  
  // Gestión de modelos
  addModelo: (modelo) => set((state) => ({ modelos: [...state.modelos, modelo] })),
  updateModelo: (id, modeloUpdate) => set((state) => ({
    modelos: state.modelos.map((m) => m.id === id ? { ...m, ...modeloUpdate } : m)
  })),
  deleteModelo: (id) => set((state) => ({ modelos: state.modelos.filter((m) => m.id !== id) })),
  toggleModeloStatus: (id) => set((state) => ({
    modelos: state.modelos.map((m) => m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m)
  })),
  
  // Gestión de catálogos
  addCatalogo: (catalogo) => set((state) => ({ catalogos: [...state.catalogos, catalogo] })),
  updateCatalogo: (id, catalogoUpdate) => set((state) => ({
    catalogos: state.catalogos.map((c) => c.id === id ? { ...c, ...catalogoUpdate } : c)
  })),
  deleteCatalogo: (id) => set((state) => ({ catalogos: state.catalogos.filter((c) => c.id !== id) })),
  toggleCatalogoActivo: (id) => set((state) => ({
    catalogos: state.catalogos.map((c) => c.id === id ? { ...c, activo: !c.activo } : c)
  })),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (categoryId) => set({ categoryFilter: categoryId }),
  setCatalogoFilter: (filter) => set({ catalogoFilter: filter }),
  setTipoCatalogoFilter: (filter) => set({ tipoCatalogoFilter: filter }),
  setLiquidacionFilter: (filter) => set({ liquidacionFilter: filter })
}),
    {
      name: 'pane-catalogo-store',
      partialize: (state) => ({
        settings: state.settings,
        reservas: state.reservas,
        consultas: state.consultas,
        directSales: state.directSales,
        clientes: state.clientes,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.consultas) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 30);
          state.consultas = state.consultas.filter(c => c.fecha && c.fecha >= cutoff.toISOString());
        }
      },
    }
  )
);
