import { useState } from 'react';
import { useStore } from '../../store';
import { Modal } from '../../components/ui/Modal';
import { Product } from '../../types';

const FORM_ID = 'product-form'

const emptyForm: Partial<Product> = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: '',
  images: [],
  sizes: [],
  colors: [],
  status: 'active',
}

export function Products() {
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
    openDeleteModal,
  } = useStore()

  const [formData, setFormData] = useState<Partial<Product>>(emptyForm)
  const [imageInput, setImageInput] = useState('')
  const [sizeInput, setSizeInput] = useState('')
  const [colorInput, setColorInput] = useState('')

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenModal = (product?: Product) => {
    setFormData(product ? { ...product } : { ...emptyForm })
    setImageInput('')
    setSizeInput('')
    setColorInput('')
    openProductModal(product)
  }

  // ✅ handleSubmit solo en el form — el botón del footer usa type="submit" form={FORM_ID}
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProduct) {
      updateProduct(selectedProduct.id, formData)
    } else {
      const newProduct: Product = {
        ...(formData as Product),
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      addProduct(newProduct)
    }
    closeProductModal()
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Sin categoría'
  }

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), imageInput.trim()] }))
      setImageInput('')
    }
  }

  const removeImage = (idx: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))
  }

  const addSize = () => {
    if (sizeInput.trim()) {
      setFormData((prev) => ({ ...prev, sizes: [...(prev.sizes || []), sizeInput.trim()] }))
      setSizeInput('')
    }
  }

  const removeSize = (idx: number) => {
    setFormData((prev) => ({ ...prev, sizes: prev.sizes?.filter((_, i) => i !== idx) }))
  }

  const addColor = () => {
    if (colorInput.trim()) {
      setFormData((prev) => ({ ...prev, colors: [...(prev.colors || []), colorInput.trim()] }))
      setColorInput('')
    }
  }

  const removeColor = (idx: number) => {
    setFormData((prev) => ({ ...prev, colors: prev.colors?.filter((_, i) => i !== idx) }))
  }

  // Permitir agregar con Enter en los inputs de tags
  const handleTagKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">Gestiona tus productos</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          + Nuevo Producto
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input max-w-md"
          />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Imagen</th>
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
                <td>
                  <img
                    src={product.images[0] || 'https://placehold.co/50x50'}  // ✅ via.placeholder.com está caído
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                </td>
                <td className="font-medium text-gray-900">{product.name}</td>
                <td>{getCategoryName(product.category)}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td>
                  <span className={`badge ${product.status === 'active' ? 'badge-success' : 'badge-inactive'}`}>
                    {product.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="btn btn-outline text-xs py-1 px-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => openDeleteModal(product.id, 'product')}
                      className="btn btn-danger text-xs py-1 px-2"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No se encontraron productos
          </div>
        )}
      </div>

      <Modal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
        footer={
          <>
            <button type="button" onClick={closeProductModal} className="btn btn-outline">
              Cancelar
            </button>
            {/* ✅ Conectado al form via id — evita doble submit */}
            <button type="submit" form={FORM_ID} className="btn btn-primary">
              {selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Precio</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} // ✅ || 0 evita NaN
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Stock</label>
              <input
                type="number"
                min="0"
                value={formData.stock || ''}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} // ✅ || 0 evita NaN
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Categoría</label>
            <select
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Imágenes */}
          <div>
            <label className="label">Imágenes (URLs)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => handleTagKeyDown(e, addImage)}
                placeholder="https://..."
                className="input flex-1"
              />
              <button type="button" onClick={addImage} className="btn btn-outline">
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.images?.map((img, idx) => (
                // ✅ key basado en valor + índice para evitar conflictos al eliminar
                <div key={`${img}-${idx}`} className="relative">
                  <img src={img} alt="" className="w-12 h-12 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tallas */}
          <div>
            <label className="label">Tallas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => handleTagKeyDown(e, addSize)}
                placeholder="Ej: Grande"
                className="input flex-1"
              />
              <button type="button" onClick={addSize} className="btn btn-outline">
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.sizes?.map((size, idx) => (
                <span
                  key={`${size}-${idx}`}
                  className="badge bg-gray-100 text-gray-700 cursor-pointer"
                  onClick={() => removeSize(idx)}
                >
                  {size} ×
                </span>
              ))}
            </div>
          </div>

          {/* Colores */}
          <div>
            <label className="label">Colores</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => handleTagKeyDown(e, addColor)}
                placeholder="Ej: Rojo"
                className="input flex-1"
              />
              <button type="button" onClick={addColor} className="btn btn-outline">
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.colors?.map((color, idx) => (
                <span
                  key={`${color}-${idx}`}
                  className="badge bg-gray-100 text-gray-700 cursor-pointer"
                  onClick={() => removeColor(idx)}
                >
                  {color} ×
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Estado</label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="input"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}