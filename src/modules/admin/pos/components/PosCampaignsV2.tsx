import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../../../../store'
import { useMktCampanias, useMktProductosFiltrados, getExcludedProductIds } from '../../../../hooks/useCampaigns'
import { useCartCampaignStore } from '../../../../store/cartCampaignStore'
import { Product, ThemeColors, StockByVariant, CatalogoSeccion } from '../../../../types'
import {
  MktCampania, MKT_CATEGORIA_LABELS, MKT_CATEGORIA_COLORS, MKT_TIPO_LABELS, MKT_TIPO_COLORS,
} from '../../../../types/marketing'
import { fetchCatalogos } from '../../../../services/catalogosService'

interface Props {
  themeColors: ThemeColors
  onAddToPosCart?: (product: Product, quantity: number, precio: number, variantId?: string) => void
  /** Si es true, cada producto muestra botón "Agregar + POS" que añade directo al carrito */
  showDirectAdd?: boolean
  onClose?: () => void
}

const COLOR_TIPO_COLORS: Record<string, string> = {
  oscuro: '#1f2937',
  claro: '#f3f4f6',
  color: '#3b82f6',
  negro: '#000',
  blanco: '#fff',
  neutro: '#9ca3af',
  exclusivo: '#8b5cf6',
  premium: '#f59e0b',
  temporada: '#10b981',
  navidad: '#ef4444',
  black_friday: '#111827',
}

export default function PosCampaignsV2({ themeColors, onAddToPosCart, showDirectAdd, onClose }: Props) {
  const tc = themeColors
  const products = useStore(s => s.products)
  const { campanias, loading } = useMktCampanias({ activas: true })
  const cartStore = useCartCampaignStore()

  const [selCampaniaId, setSelCampaniaId] = useState<string | null>(null)
  const [cuponInput, setCuponInput] = useState('')
  const [cuponMsg, setCuponMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'lista' | 'carrito'>('lista')
  const [variantPicker, setVariantPicker] = useState<{ product: Product; variants: StockByVariant[]; mode: 'cart' | 'pos' } | null>(null)
  const [catalogosSecciones, setCatalogosSecciones] = useState<CatalogoSeccion[]>([])

  useEffect(() => {
    fetchCatalogos().then(setCatalogosSecciones)
  }, [])

  const activeProducts = useMemo(() => products.filter(p => p.status === 'active'), [products])

  const selCampania = campanias.find(c => c.id === selCampaniaId) || null

  const productosCampania = useMktProductosFiltrados(
    selCampania,
    activeProducts,
    getExcludedProductIds(selCampania?.catalogos_excluidos, catalogosSecciones)
  )

  useEffect(() => {
    if (selCampania) {
      cartStore.initFromCampania(selCampania)
      setActiveTab('carrito')
    }
  }, [selCampania?.id])

  const getPromoPrecio = (producto: Product): number => {
    let precioPromo = producto.price
    const regla = selCampania?.reglas?.[0]
    if (regla) {
      switch (regla.tipo_regla) {
        case 'PRECIO_FIJO':
        case 'COMBO':
          if (regla.cantidad_minima && regla.precio_fijo)
            precioPromo = regla.precio_fijo / regla.cantidad_minima
          break
        case 'PORCENTAJE':
          precioPromo = producto.price * (1 - regla.porcentaje / 100)
          break
        case 'MONTO_FIJO':
          precioPromo = producto.price - (regla.descuento_fijo || regla.monto_minimo)
          break
      }
    }
    return Math.max(precioPromo, 0)
  }

  const handleAddProduct = (producto: Product) => {
    const variants = (producto as any).stockByVariants as StockByVariant[] | undefined
    if (variants && variants.length > 0) {
      setVariantPicker({ product: producto, variants, mode: 'cart' })
      return
    }
    cartStore.addItem(producto, getPromoPrecio(producto))
  }

  const handleAddDirect = (producto: Product) => {
    const variants = (producto as any).stockByVariants as StockByVariant[] | undefined
    if (variants && variants.length > 0) {
      setVariantPicker({ product: producto, variants, mode: 'pos' })
      return
    }
    addDirectToCart(producto)
  }

  const addDirectToCart = (producto: Product, variant?: StockByVariant) => {
    if (!onAddToPosCart) return
    const precio = getPromoPrecio(producto)
    onAddToPosCart(producto, 1, precio, variant?.id)
    setVariantPicker(null)
  }

  const handleAplicarCupon = async () => {
    if (!cuponInput.trim()) return
    cartStore.setCupon(cuponInput.trim().toUpperCase())
    setCuponMsg('Aplicando...')
    setTimeout(() => {
      if (cartStore.resultadoMulti?.resultados.length) {
        setCuponMsg(`✅ Descuento total: $${cartStore.resultadoMulti.total_descuento.toFixed(2)}`)
      } else {
        setCuponMsg('El cupón no aplica a estos productos')
      }
    }, 400)
  }

  const handleEnviarAPOS = () => {
    if (!onAddToPosCart) return
    for (const item of cartStore.items) {
      onAddToPosCart(item.producto, item.cantidad, item.precio_promocion, item.variantId)
    }
    cartStore.clearCart()
    onClose?.()
  }

  const catColor = selCampania
    ? (MKT_CATEGORIA_COLORS[selCampania.categoria] || tc.primary || '#6b7280')
    : tc.primary || '#6b7280'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button onClick={() => setActiveTab('lista')}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: activeTab === 'lista' ? tc.primary : tc.surface || '#f3f4f6',
            color: activeTab === 'lista' ? '#fff' : tc.text, fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}>
          Campañas
        </button>
        <button onClick={() => setActiveTab('carrito')}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: activeTab === 'carrito' ? tc.primary : tc.surface || '#f3f4f6',
            color: activeTab === 'carrito' ? '#fff' : tc.text, fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}>
          Carrito {cartStore.items.length > 0 ? `(${cartStore.items.length})` : ''}
        </button>
      </div>

      {activeTab === 'lista' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando campañas...</div>
          ) : campanias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No hay campañas activas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {campanias.map(c => (
                <button key={c.id} onClick={() => setSelCampaniaId(c.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 4, width: '100%',
                    padding: '12px 14px', borderRadius: 10, border: `1px solid ${selCampaniaId === c.id ? catColor : '#e5e7eb'}`,
                    background: selCampaniaId === c.id ? catColor + '12' : '#fff',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                      color: '#fff', background: MKT_CATEGORIA_COLORS[c.categoria] || '#6b7280',
                    }}>
                      {MKT_CATEGORIA_LABELS[c.categoria] || c.categoria}
                    </span>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{MKT_TIPO_LABELS[c.tipo]}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.nombre}</div>
                  {c.descripcion && (
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{c.descripcion}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'carrito' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selCampania ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              Selecciona una campaña primero
            </div>
          ) : (
            <>
              {/* Productos de la campaña */}
              <div style={{ flex: '0 0 auto', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{selCampania.nombre}</span>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>({productosCampania.length} prod.)</span>
                </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: showDirectAdd ? 180 : 220, overflow: 'auto', paddingRight: 4 }}>
                  {productosCampania.slice(0, 30).map(p => {
                    const inCart = cartStore.items.find(i => i.producto.id === p.id)
                    const variants = (p as any).stockByVariants as StockByVariant[] | undefined
                    const hasVariants = variants && variants.length > 0
                    const uniqueColors = hasVariants ? [...new Map(variants.filter(v => v.stock > 0).map(v => [v.colorId, v]))].map(([_, v]) => v) : []
                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 8px', borderRadius: 8, background: '#f9fafb',
                      }}>
                        <img src={p.images?.[0] || ''} alt={p.name}
                          style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0, fontSize: 11 }}>
                          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ color: '#6b7280' }}>${p.price.toFixed(2)}</div>
                          {hasVariants && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                              {uniqueColors.length > 0 ? uniqueColors.map(v => (
                                <span key={v.colorId} style={{
                                  width: 10, height: 10, borderRadius: '50%',
                                  background: v.colorHex || '#ccc',
                                  border: '1px solid #d1d5db', display: 'inline-block',
                                }} title={v.colorName} />
                              )) : <span style={{ fontSize: 9, color: '#ef4444' }}>sin stock</span>}
                              {uniqueColors.length > 0 && (
                                <span style={{ fontSize: 9, color: '#6b7280' }}>
                                  {uniqueColors.length} colores
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {inCart ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button onClick={() => cartStore.updateCantidad(inCart.variantId || p.id, inCart.cantidad - 1)}
                                style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '16px' }}>
                                −
                              </button>
                              <span style={{ fontSize: 12, fontWeight: 600, width: 16, textAlign: 'center' }}>{inCart.cantidad}</span>
                              <button onClick={() => cartStore.updateCantidad(inCart.variantId || p.id, inCart.cantidad + 1)}
                                style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '16px' }}>
                                +
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => handleAddProduct(p)}
                              style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: catColor, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 10 }}>
                              Agregar
                            </button>
                          )}
                          {showDirectAdd && onAddToPosCart && (
                            <button onClick={() => handleAddDirect(p)}
                              style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #22c55e', background: '#f0fdf4', color: '#059669', fontWeight: 600, cursor: 'pointer', fontSize: 10 }}>
                              + POS
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Carrito resumen */}
              <div style={{ flex: 1, overflow: 'auto', marginBottom: 8 }}>
                {cartStore.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 12 }}>
                    Agrega productos a la campaña
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {cartStore.items.map(item => (
                      <div key={item.producto.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 8px', background: '#fff', borderRadius: 6, fontSize: 11,
                      }}>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.producto.name} x{item.cantidad}
                        </span>
                        <span style={{ fontWeight: 600, marginLeft: 6 }}>${(item.precio_promocion * item.cantidad).toFixed(2)}</span>
                        <button onClick={() => cartStore.removeItem(item.variantId || item.producto.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, marginLeft: 4 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totales */}
              {cartStore.resultadoMulti && cartStore.items.length > 0 && (
                <div style={{ borderTop: `1px solid ${tc.border || '#e5e7eb'}`, paddingTop: 8, marginBottom: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span>Subtotal</span><span>${cartStore.resultadoMulti.total_original.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: 2 }}>
                    <span>Descuento</span><span>-${cartStore.resultadoMulti.total_descuento.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: `1px solid ${tc.border || '#e5e7eb'}`, paddingTop: 2 }}>
                    <span>Total v2</span><span>${cartStore.resultadoMulti.total_final.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Cupón + Enviar */}
              <div style={{ marginTop: 'auto', borderTop: `1px solid ${tc.border || '#e5e7eb'}`, paddingTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  <input value={cuponInput} onChange={e => setCuponInput(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 11, outline: 'none' }}
                    placeholder="CUPÓN" />
                  <button onClick={handleAplicarCupon}
                    style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#111827', color: '#fff', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                    OK
                  </button>
                </div>
                {cuponMsg && <div style={{ fontSize: 10, marginBottom: 4, color: cuponMsg.includes('✅') ? '#059669' : '#ef4444' }}>{cuponMsg}</div>}

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleEnviarAPOS}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    Enviar a POS
                  </button>
                  <button onClick={() => cartStore.clearCart()}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 11 }}>
                    Limpiar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Variant Picker Modal */}
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
                if (!acc[v.colorId]) acc[v.colorId] = { colorName: v.colorName, colorHex: v.colorHex, colorImage: v.colorImage, colorTipo: v.color_tipo, sizes: [] as StockByVariant[] }
                acc[v.colorId].sizes.push(v)
                return acc
              }, {} as Record<string, { colorName: string; colorHex: string; colorImage?: string; colorTipo?: string; sizes: StockByVariant[] }>)
            ).map(([colorId, group]) => (
              <div key={colorId} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {group.colorImage ? (
                    <img src={group.colorImage} alt={group.colorName} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: group.colorHex || '#ccc', border: '1px solid #d1d5db', flexShrink: 0 }} />
                  )}
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{group.colorName}</span>
                  {group.colorTipo && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                      background: '#f3e8ff', color: '#7c3aed',
                    }}>
                      {group.colorTipo}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {group.sizes.map(variant => (
                    <button
                      key={`${variant.id || `${variant.colorId}-${variant.sizeId}`}`}
                      onClick={() => {
                        if (variantPicker.mode === 'cart') {
                          const precio = getPromoPrecio(variantPicker.product)
                          cartStore.addItem(variantPicker.product, precio, {
                            variantId: variant.id,
                            colorId: variant.colorId,
                            colorName: variant.colorName,
                            colorHex: variant.colorHex,
                            sizeId: variant.sizeId,
                            sizeName: variant.sizeName,
                          })
                        } else {
                          addDirectToCart(variantPicker.product, variant)
                        }
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
                      onMouseLeave={e => { if (variant.stock > 0) { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#22c55e' } }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: variant.stock > 0 ? '#059669' : '#9ca3af' }}>
                        {variant.sizeName || 'Único'}
                      </span>
                      <span style={{ fontSize: 10, color: variant.stock > 0 ? '#6b7280' : '#d1d5db' }}>
                        Stock: {variant.stock}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                        ${(variant.precio || variantPicker.product.price).toFixed(2)}
                      </span>
                    </button>
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
    </div>
  )
}
