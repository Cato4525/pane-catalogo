import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../../../store';
import { Modal } from '../../../../components/ui/Modal';
import { Product, THEME_PRESETS, ThemeType, StockByVariant } from '../../../../types';
import { 
  uploadImageToSupabase, 
  validateImageFile, 
  createImagePreview, 
  revokeImagePreview,
  ImageFile,
  isLocalMode
} from '../../../../services/imageUploadService';

export interface ColorTallaStock {
  colorId: string;
  colorName: string;
  colorHex: string;
  image?: string;
  tallas: {
    sizeId: string;
    sizeName: string;
    stock: number;
    precio: number;
  }[];
}

const FORM_ID = 'product-form'

const emptyForm: Partial<Product> = {
  name: '',
  codigo: '',
  description: '',
  price: 0,
  stock: 0,
  category: '',
  images: [],
  sizes: [],
  colors: [],
  status: 'active',
  modelo: '',
  color: '',
}

export default function ProductsPage() {
  const settings = useStore((state) => state.settings);
  const theme = (settings.theme || 'moderno') as ThemeType;
  const tc = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  
  const {
    products,
    categories,
    searchQuery,
    setSearchQuery,
    openProductModal,
    isProductModalOpen,
    selectedProduct,
    closeProductModal,
    addProduct,
    updateProduct,
    deleteProduct,
    openDeleteModal,
    colors,
    tallas,
    modelos,
    fetchProductsFromSupabase,
    fetchCategoriesFromSupabase,
    fetchModelsFromSupabase,
    fetchColorsFromSupabase,
    fetchSizesFromSupabase,
    productsHasMore,
    productsLoading,
  } = useStore()

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchProductsFromSupabase(),
        fetchCategoriesFromSupabase(),
        fetchModelsFromSupabase(),
        fetchColorsFromSupabase(),
        fetchSizesFromSupabase(),
      ])
    }
    loadData()
  }, [])

  const [formData, setFormData] = useState<Partial<Product>>(emptyForm)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [colorTallaStock, setColorTallaStock] = useState<ColorTallaStock[]>([])
  const [activeColorIndex, setActiveColorIndex] = useState<number>(0)
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [viewDetailProduct, setViewDetailProduct] = useState<Product | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeColors = colors.filter(c => c.status === 'active')
  const activeTallas = tallas.filter(t => t.status === 'active')
  const activeModelos = modelos.filter(m => m.status === 'active')
  const activeCategories = categories.filter(c => c.status === 'active')

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    return () => {
      imageFiles.forEach(img => revokeImagePreview(img.preview));
    };
  }, []);

  const handleOpenModal = (product?: Product) => {
    const initialData = product ? { ...product } : { ...emptyForm }
    setFormData(initialData)
    setSelectedSizes(product?.sizes || [])
    setSelectedColors(product?.colors || [])
    
    if (product?.stockByVariants && product.stockByVariants.length > 0) {
      const colorMap: Record<string, ColorTallaStock> = {}
      for (const v of product.stockByVariants) {
        if (!colorMap[v.colorId]) {
          colorMap[v.colorId] = {
            colorId: v.colorId,
            colorName: v.colorName,
            colorHex: v.colorHex,
            image: v.colorImage,
            tallas: []
          }
        }
        colorMap[v.colorId].tallas.push({
          sizeId: v.sizeId,
          sizeName: v.sizeName,
          stock: v.stock,
          precio: v.precio || 0
        })
      }
      setColorTallaStock(Object.values(colorMap))
      setActiveColorIndex(0)
    } else {
      setColorTallaStock([])
      setActiveColorIndex(0)
    }
    
    if (product?.images?.length) {
      setFormData(prev => ({ ...prev, images: product.images }))
    } else {
      setFormData(prev => ({ ...prev, images: [] }))
    }
    
    setUploadError(null)
    openProductModal(product)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    const newImages: ImageFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file);
      
      if (!validation.valid) {
        setUploadError(validation.error || 'Archivo inválido');
        continue;
      }

      newImages.push({
        file,
        preview: createImagePreview(file)
      });
    }

    setImageFiles(prev => [...prev, ...newImages].slice(0, 5));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    const removed = imageFiles[idx];
    if (removed && removed.preview !== removed.file.name) {
      revokeImagePreview(removed.preview);
    }
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    try {
      const stockByVariants: StockByVariant[] = []
      for (const colorData of colorTallaStock) {
        for (const talla of colorData.tallas) {
          stockByVariants.push({
            colorId: colorData.colorId,
            colorName: colorData.colorName,
            colorHex: colorData.colorHex,
            colorImage: colorData.image,
            sizeId: talla.sizeId,
            sizeName: talla.sizeName,
            stock: talla.stock,
            precio: talla.precio
          })
        }
      }

      const productData = {
        ...formData,
        sizes: selectedSizes,
        colors: selectedColors,
        images: formData.images || [],
        codigo: formData.codigo || `LEG-${Date.now().toString().slice(-6)}`,
        stockByVariants,
      };

      if (selectedProduct) {
        updateProduct(selectedProduct.id, productData);
      } else {
        const newProduct: Product = {
          ...(productData as Product),
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        addProduct(newProduct);
      }
      
      setImageFiles([]);
      closeProductModal();
    } catch (error) {
      setUploadError('Error al guardar el producto');
    } finally {
      setIsUploading(false);
    }
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Sin categoría'
  }

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }

  const toggleColor = (colorName: string) => {
    const color = activeColors.find(c => c.nombre === colorName)
    if (!color) return
    
    if (selectedColors.includes(colorName)) {
      setSelectedColors(prev => prev.filter(c => c !== colorName))
      setColorTallaStock(prev => prev.filter(c => c.colorId !== color.id))
    } else {
      const newColorData: ColorTallaStock = {
        colorId: color.id,
        colorName: color.nombre,
        colorHex: color.codigo_hex || '#000',
        tallas: activeTallas.map(t => ({
          sizeId: t.id,
          sizeName: t.nombre,
          stock: 0,
          precio: formData.price || 0
        }))
      }
      setSelectedColors(prev => [...prev, colorName])
      setColorTallaStock(prev => [...prev, newColorData])
      setActiveColorIndex(colorTallaStock.length)
    }
  }

  const goToColor = (index: number) => {
    setActiveColorIndex(index)
  }

  const nextColor = () => {
    if (activeColorIndex < colorTallaStock.length - 1) {
      setActiveColorIndex(prev => prev + 1)
    }
  }

  const prevColor = () => {
    if (activeColorIndex > 0) {
      setActiveColorIndex(prev => prev - 1)
    }
  }

  const updateColorTallaStock = (colorId: string, sizeId: string, field: 'stock' | 'precio', value: number) => {
    setColorTallaStock(prev => prev.map(colorData => {
      if (colorData.colorId === colorId) {
        return {
          ...colorData,
          tallas: colorData.tallas.map(t => 
            t.sizeId === sizeId ? { ...t, [field]: value } : t
          )
        }
      }
      return colorData
    }))
  }

  const getTotalStock = () => colorTallaStock.reduce((sum, c) => 
    sum + c.tallas.reduce((s, t) => s + t.stock, 0), 0
  )

  const getPrecioPromedio = () => {
    const allPrices = colorTallaStock.flatMap(c => c.tallas.map(t => t.precio))
    if (allPrices.length === 0) return 0
    return allPrices.reduce((s, p) => s + p, 0) / allPrices.length
  }

  const getTotalInventoryValue = () => {
    return colorTallaStock.reduce((sum, c) => 
      sum + c.tallas.reduce((s, t) => s + (t.stock * t.precio), 0), 0
    )
  }

  const exportToExcel = () => {
    const data = colorTallaStock.flatMap(color => 
      color.tallas.map(talla => ({
        Producto: formData.name,
        Codigo: formData.codigo,
        Categoria: activeCategories.find(c => c.id === formData.category)?.name || '',
        Modelo: activeModelos.find(m => m.id === formData.modelo)?.nombre || '',
        Color: color.colorName,
        Talla: talla.sizeName,
        Stock: talla.stock,
        Precio: talla.precio,
        Subtotal: talla.stock * talla.precio,
      }))
    )

    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${formData.name || 'producto'}_variantes.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Productos</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Gestiona tus productos</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          + Nuevo Producto
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input max-w-md"
          />
        </div>

        <div className="table-wrapper">
          <table className="table table-mobile-card">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td data-label="Imagen">
                    <img
                      src={product.images[0] || 'https://placehold.co/50x50'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                      loading="lazy"
                    />
                  </td>
                  <td data-label="Código" style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>
                    {product.codigo || '-'}
                  </td>
                  <td data-label="Nombre" className="font-medium" style={{ color: 'var(--text)' }}>{product.name}</td>
                  <td data-label="Categoría" style={{ color: 'var(--text-muted)' }}>{getCategoryName(product.category)}</td>
                  <td data-label="Precio" style={{ color: 'var(--text)' }}>${product.price.toFixed(2)}</td>
                  <td data-label="Stock" style={{ color: 'var(--text-muted)' }}>{product.stock}</td>
                  <td data-label="Estado">
                    <span className={`badge ${product.status === 'active' ? 'badge-success' : 'badge-inactive'}`}>
                      {product.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewDetailProduct(product)}
                        style={{
                          background: 'rgba(59,130,246,0.2)',
                          border: '1px solid #3b82f6',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          color: '#3b82f6',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = 'brightness(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = 'brightness(1)';
                        }}
                      >
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => handleOpenModal(product)}
                        style={{
                          background: '#22c55e',
                          border: '1px solid #22c55e',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = 'brightness(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = 'brightness(1)';
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteProductId(product.id)}
                        style={{
                          background: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ef4444';
                          e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.background = '#b91c1c';
                          e.currentTarget.style.borderColor = '#b91c1c';
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.borderColor = '#dc2626';
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No se encontraron productos
          </div>
        )}

        {productsHasMore && (
          <div className="p-4 text-center">
            <button
              onClick={() => fetchProductsFromSupabase(false)}
              disabled={productsLoading}
              className="btn btn-outline"
            >
              {productsLoading ? 'Cargando...' : 'Cargar más productos'}
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
        footer={
          <>
            <button 
              type="button" 
              onClick={closeProductModal} 
              className="btn btn-outline"
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form={FORM_ID} 
              className="btn btn-primary"
              disabled={isUploading}
            >
              {isUploading ? 'Guardando...' : (selectedProduct ? 'Guardar Cambios' : 'Crear Producto')}
            </button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del Producto</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="label">Código del Producto</label>
              <input
                type="text"
                value={formData.codigo || ''}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="input"
                placeholder="Ej: LEG-001"
                disabled={isUploading}
              />
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Categoría</label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                required
                disabled={isUploading}
              >
                <option value="">Seleccionar</option>
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Modelo</label>
              <select
                value={formData.modelo || ''}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="input"
                disabled={isUploading}
              >
                <option value="">Seleccionar</option>
                {activeModelos.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
              Colores y Variantes
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Selecciona los colores disponibles. Para cada color, ingresa el stock y precio por cada talla.
            </p>
            
            <div className="mb-4">
              <label className="label">1. Selecciona los Colores</label>
              <div className="flex flex-wrap gap-2">
                {activeColors.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleColor(col.nombre)}
                    className="px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: selectedColors.includes(col.nombre) ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.2)',
                      color: 'var(--text)',
                      border: selectedColors.includes(col.nombre) ? '2px solid #22c55e' : '2px solid transparent',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      opacity: isUploading ? 0.6 : 1,
                    }}
                    disabled={isUploading}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: 3, background: col.codigo_hex }} />
                    {col.nombre}
                  </button>
                ))}
              </div>
              {activeColors.length === 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No hay colores configurados en Atributos</p>
              )}
            </div>

            {colorTallaStock.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="label mb-0">2. Configura Stock y Precio por Color y Talla</label>
                  <button
                    type="button"
                    onClick={exportToExcel}
                    className="btn btn-outline text-xs"
                    style={{ padding: '6px 12px' }}
                  >
                    📥 Exportar Excel
                  </button>
                </div>
                
                <div className="space-y-4">
                  {colorTallaStock.length > 0 && (
                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--background)' }}>
                        <div className="flex items-center gap-2">
                          {colorTallaStock.map((c, idx) => (
                            <button
                              key={c.colorId}
                              type="button"
                              onClick={() => goToColor(idx)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all"
                              style={{ 
                                background: activeColorIndex === idx ? c.colorHex : 'rgba(100,116,139,0.2)',
                                border: activeColorIndex === idx ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeColorIndex === idx ? (c.colorHex === '#ffffff' ? '#000' : '#fff') : 'var(--text-muted)',
                              }}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={prevColor}
                            disabled={activeColorIndex === 0}
                            className="px-3 py-1 rounded text-sm"
                            style={{ 
                              background: activeColorIndex === 0 ? 'rgba(100,116,139,0.1)' : 'var(--surface)',
                              color: activeColorIndex === 0 ? 'var(--text-muted)' : 'var(--text)',
                              cursor: activeColorIndex === 0 ? 'not-allowed' : 'pointer',
                              opacity: activeColorIndex === 0 ? 0.5 : 1
                            }}
                          >
                            ◀
                          </button>
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {activeColorIndex + 1} / {colorTallaStock.length}
                          </span>
                          <button
                            type="button"
                            onClick={nextColor}
                            disabled={activeColorIndex === colorTallaStock.length - 1}
                            className="px-3 py-1 rounded text-sm"
                            style={{ 
                              background: activeColorIndex === colorTallaStock.length - 1 ? 'rgba(100,116,139,0.1)' : 'var(--surface)',
                              color: activeColorIndex === colorTallaStock.length - 1 ? 'var(--text-muted)' : 'var(--text)',
                              cursor: activeColorIndex === colorTallaStock.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: activeColorIndex === colorTallaStock.length - 1 ? 0.5 : 1
                            }}
                          >
                            ▶
                          </button>
                        </div>
                      </div>

                      {colorTallaStock[activeColorIndex] && (
                        <div className="p-4" style={{ background: 'var(--surface)' }}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                                  {colorTallaStock[activeColorIndex].colorName}
                                </h4>
                                <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(100,116,139,0.2)', color: 'var(--text-muted)' }}>
                                  {colorTallaStock[activeColorIndex].tallas.length} tallas
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Stock: {colorTallaStock[activeColorIndex].tallas.reduce((s, t) => s + t.stock, 0)}</span>
                              <span className="text-sm block" style={{ color: 'var(--text-muted)' }}>Valor: ${colorTallaStock[activeColorIndex].tallas.reduce((s, t) => s + (t.stock * t.precio), 0).toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="label">Imagen de este color (opcional)</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                accept="image/*"
                                id={`color-img-${activeColorIndex}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onload = (ev) => {
                                      setColorTallaStock(prev => prev.map((c, idx) => 
                                        idx === activeColorIndex ? { ...c, image: ev.target?.result as string } : c
                                      ))
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                                className="input"
                                style={{ display: 'none' }}
                              />
                              {colorTallaStock[activeColorIndex].image ? (
                                <label htmlFor={`color-img-${activeColorIndex}`} className="cursor-pointer">
                                  <img 
                                    src={colorTallaStock[activeColorIndex].image} 
                                    alt={colorTallaStock[activeColorIndex].colorName}
                                    className="w-16 h-16 rounded-lg object-cover"
                                    style={{ border: '2px solid var(--border)' }}
                                  />
                                </label>
                              ) : (
                                <label 
                                  htmlFor={`color-img-${activeColorIndex}`}
                                  className="w-16 h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer"
                                  style={{ background: 'rgba(100,116,139,0.2)', border: '2px dashed var(--border)' }}
                                >
                                  <span style={{ color: 'var(--text-muted)', fontSize: 24 }}>+</span>
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Foto</span>
                                </label>
                              )}
                              {colorTallaStock[activeColorIndex].image && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setColorTallaStock(prev => prev.map((c, idx) => 
                                      idx === activeColorIndex ? { ...c, image: undefined } : c
                                    ))
                                  }}
                                  className="text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </div>

                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                <th className="text-left py-2 px-2" style={{ color: 'var(--text-muted)', width: '25%' }}>Talla</th>
                                <th className="text-center py-2 px-2" style={{ color: 'var(--text-muted)', width: '25%' }}>Stock</th>
                                <th className="text-center py-2 px-2" style={{ color: 'var(--text-muted)', width: '25%' }}>Precio ($)</th>
                                <th className="text-center py-2 px-2" style={{ color: 'var(--text-muted)', width: '25%' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {colorTallaStock[activeColorIndex].tallas.map(talla => (
                                <tr key={talla.sizeId} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td className="py-3 px-2">
                                    <span className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(100,116,139,0.2)' }}>
                                      {talla.sizeName}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      className="input text-center"
                                      style={{ width: '100%', padding: '8px' }}
                                      value={talla.stock}
                                      onChange={(e) => updateColorTallaStock(colorTallaStock[activeColorIndex].colorId, talla.sizeId, 'stock', parseInt(e.target.value) || 0)}
                                    />
                                  </td>
                                  <td className="py-3 px-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      className="input text-center"
                                      style={{ width: '100%', padding: '8px' }}
                                      value={talla.precio}
                                      onChange={(e) => updateColorTallaStock(colorTallaStock[activeColorIndex].colorId, talla.sizeId, 'precio', parseFloat(e.target.value) || 0)}
                                    />
                                  </td>
                                  <td className="py-3 px-2 text-center font-medium" style={{ color: 'var(--text)' }}>
                                    ${(talla.stock * talla.precio).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 p-3 rounded-lg flex justify-between items-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e' }}>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>
                    <span className="font-semibold">Total stock:</span> {getTotalStock()} unidades
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>
                    <span className="font-semibold">Precio promedio:</span> ${getPrecioPromedio().toFixed(2)}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>
                    <span className="font-semibold">Valor inventario:</span> ${getTotalInventoryValue().toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="label">Imagen del Producto</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    setFormData({ ...formData, images: [ev.target?.result as string] })
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="input"
              style={{ padding: '8px' }}
            />
            {formData.images?.[0] && (
              <img 
                src={formData.images[0]} 
                alt="Preview" 
                className="mt-2 w-24 h-24 object-cover rounded-lg"
                style={{ border: '1px solid var(--border)' }}
              />
            )}
          </div>

          <div>
            <label className="label">Estado</label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="input"
              disabled={isUploading}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteProductId}
        onClose={() => setDeleteProductId(null)}
        title="Confirmar Eliminación"
        footer={
          <>
            <button 
              type="button" 
              onClick={() => setDeleteProductId(null)}
              className="btn btn-outline"
            >
              No
            </button>
            <button 
              type="button" 
              onClick={() => {
                if (deleteProductId) {
                  deleteProduct(deleteProductId)
                  setDeleteProductId(null)
                }
              }}
              className="btn btn-danger"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              Sí, Eliminar
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text)' }}>
          ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
        </p>
      </Modal>

      {viewDetailProduct && (
        <Modal
          isOpen={!!viewDetailProduct}
          onClose={() => setViewDetailProduct(null)}
          title={`Detalle: ${viewDetailProduct.name}`}
        >
          <div className="space-y-4">
            <div className="text-center border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{viewDetailProduct.name}</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{viewDetailProduct.codigo || '-'}</p>
            </div>

            {viewDetailProduct.stockByVariants && viewDetailProduct.stockByVariants.length > 0 && (
              <div>
                <label className="label">Inventario por Color y Talla</label>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th className="text-left py-2" style={{ color: 'var(--text-muted)' }}>Color</th>
                      <th className="text-left py-2" style={{ color: 'var(--text-muted)' }}>Talla</th>
                      <th className="text-center py-2" style={{ color: 'var(--text-muted)' }}>Stock</th>
                      <th className="text-right py-2" style={{ color: 'var(--text-muted)' }}>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetailProduct.stockByVariants.filter(v => v.stock > 0).map((v, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span style={{ width: 14, height: 14, borderRadius: 3, background: v.colorHex }} />
                            <span style={{ color: 'var(--text)' }}>{v.colorName}</span>
                          </div>
                        </td>
                        <td className="py-2" style={{ color: 'var(--text)' }}>{v.sizeName}</td>
                        <td className="py-2 text-center" style={{ color: v.stock > 0 ? '#22c55e' : '#ef4444' }}>
                          {v.stock}
                        </td>
                        <td className="py-2 text-right" style={{ color: 'var(--text)' }}>${v.precio?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex justify-between p-2 rounded" style={{ background: 'var(--surface)' }}>
                  <span style={{ color: 'var(--text)' }}>Total: <strong>{viewDetailProduct.stockByVariants.reduce((s, t) => s + t.stock, 0)}</strong> unidades</span>
                  <span style={{ color: 'var(--text)' }}>Valor: <strong>${viewDetailProduct.stockByVariants.reduce((s, t) => s + (t.stock * (t.precio || 0)), 0).toFixed(2)}</strong></span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  setViewDetailProduct(null)
                  handleOpenModal(viewDetailProduct)
                }}
                className="btn btn-primary"
              >
                Editar Producto
              </button>
              <button
                onClick={() => setViewDetailProduct(null)}
                className="btn btn-outline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
