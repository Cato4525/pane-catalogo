import { useState, useMemo } from 'react'
import { Product, CarritoPromocionItem, StockByVariant } from '../../types'
import { getCartColorTypesTip, ValidatePromotionItem } from '../../services/promotionValidator'

interface Props {
  productos: Product[]
  selectedItems: CarritoPromocionItem[]
  onAdd: (producto: Product, colorTipo?: string) => void
  onRemove: (productId: string) => void
  onUpdateCantidad: (productId: string, cantidad: number) => void
}

export default function PromocionProductsGrid({
  productos,
  selectedItems,
  onAdd,
  onRemove,
  onUpdateCantidad,
}: Props) {
  const selectedIds = new Set(selectedItems.map(i => i.producto.id))
  const [variantPicker, setVariantPicker] = useState<{ product: Product; variants: StockByVariant[] } | null>(null)

  const tiposEnCarrito = useMemo(() => {
    return [...new Set(selectedItems.map(i => i.colorTipo).filter(Boolean))]
  }, [selectedItems])

  const hasMixedTypes = tiposEnCarrito.length >= 2

  const handleAddClick = (producto: Product) => {
    const variants = (producto as any).stockByVariants as StockByVariant[] | undefined
    if (variants && variants.length > 0) {
      setVariantPicker({ product: producto, variants })
      return
    }
    onAdd(producto)
  }

  if (productos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>
        No hay productos disponibles para esta promoción
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {productos.map(producto => {
          const isSelected = selectedIds.has(producto.id)
          const selectedItem = selectedItems.find(i => i.producto.id === producto.id)
          const variants = (producto as any).stockByVariants as StockByVariant[] | undefined
          const hasVariants = variants && variants.length > 0
          const uniqueColors = hasVariants ? [...new Map(variants.filter(v => v.stock > 0).map(v => [v.colorId, v]))].map(([_, v]) => v) : []

          return (
            <div
              key={producto.id}
              style={{
                background: isSelected ? '#f0fdf4' : '#fff',
                borderRadius: 12,
                border: `1px solid ${isSelected ? '#22c55e' : '#e5e7eb'}`,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'border-color 0.2s',
              }}
            >
              {producto.images?.[0] && (
                <img
                  src={producto.images[0]}
                  alt={producto.name}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                />
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                  {producto.name}
                </div>
                {producto.codigo && (
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                    {producto.codigo}
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                  ${producto.price.toFixed(2)}
                </div>
                {hasVariants && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
                    {uniqueColors.length > 0 ? uniqueColors.map(v => (
                      <span key={v.colorId} style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: v.colorHex || '#ccc',
                        border: '1px solid #d1d5db', display: 'inline-block',
                      }} title={v.colorName} />
                    )) : <span style={{ fontSize: 10, color: '#ef4444' }}>sin stock</span>}
                    {uniqueColors.length > 0 && (
                      <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 2 }}>
                        {uniqueColors.length} colores
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isSelected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => onUpdateCantidad(producto.id, (selectedItem?.cantidad || 1) - 1)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db',
                      background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                    {selectedItem?.cantidad || 1}
                  </span>
                  <button
                    onClick={() => onUpdateCantidad(producto.id, (selectedItem?.cantidad || 1) + 1)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db',
                      background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemove(producto.id)}
                    style={{
                      marginLeft: 'auto',
                      width: 28, height: 28, borderRadius: 6, border: '1px solid #fca5a5',
                      background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
               ) : (
                <button
                  onClick={() => handleAddClick(producto)}
                  style={{
                    width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                    background: '#059669', color: '#fff', fontWeight: 600, cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Agregar
                </button>
              )}
              {tiposEnCarrito.length === 1 && !hasMixedTypes && selectedItems.length > 0 && (
                <div style={{ fontSize: 10, color: '#f59e0b', textAlign: 'center', marginTop: 2 }}>
                  💡 Elige tipo diferente
                </div>
              )}
            </div>
          )
        })}
      </div>

      {variantPicker && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }} onClick={() => setVariantPicker(null)}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 20, width: 400,
            maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
              {variantPicker.product.name}
            </h3>
            {variantPicker.product.codigo && (
              <p style={{ margin: '0 0 12px', fontSize: 11, color: '#6b7280' }}>
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
                    <div key={`${variant.id || `${variant.colorId}-${variant.sizeId}`}`}>
                      <button
                        onClick={() => {
                          onAdd(variantPicker.product, variant.color_tipo)
                          setVariantPicker(null)
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
                      {tiposEnCarrito.length === 1 && !hasMixedTypes && selectedItems.length > 0 && variant.color_tipo === tiposEnCarrito[0] && (
                        <div style={{ fontSize: 9, color: '#f59e0b', textAlign: 'center', marginTop: 2, maxWidth: 100 }}>
                          💡 mismo tipo
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setVariantPicker(null)}
              style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
