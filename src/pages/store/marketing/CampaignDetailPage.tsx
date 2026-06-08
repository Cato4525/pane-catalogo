// ============================================================
// STORE CAMPAIGN DETAIL PAGE v2
// Detalle de campaña con grid de productos y carrito
// independiente (usa cartCampaignStore).
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../../store'
import { useMktCampaniaDetalle, useMktProductosFiltrados, getExcludedProductIds } from '../../../hooks/useCampaigns'
import { useCartCampaignStore } from '../../../store/cartCampaignStore'
import { Product, CatalogoSeccion, StockByVariant } from '../../../types'
import {
  MktCampania, MKT_CATEGORIA_LABELS, MKT_CATEGORIA_COLORS,
  MKT_TIPO_LABELS, MKT_TIPO_COLORS,
} from '../../../types/marketing'
import { fetchCatalogos } from '../../../services/catalogosService'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const products = useStore(s => s.products)
  const settings = useStore(s => s.settings)
  const { campania, loading, error } = useMktCampaniaDetalle(id)
  const cartStore = useCartCampaignStore()

  const [cuponInput, setCuponInput] = useState('')
  const [cuponMsg, setCuponMsg] = useState<{ ok: boolean; msg: string } | null>(null)
  const [showModal, setShowModal] = useState<'cotizacion' | null>(null)
  const [catalogosSecciones, setCatalogosSecciones] = useState<CatalogoSeccion[]>([])
  const [variantPicker, setVariantPicker] = useState<{ product: Product; variants: StockByVariant[] } | null>(null)

  useEffect(() => {
    fetchCatalogos().then(setCatalogosSecciones)
  }, [])

  const activeProducts = useMemo(() => products.filter(p => p.status === 'active'), [products])
  const productosFiltrados = useMktProductosFiltrados(
    campania,
    activeProducts,
    getExcludedProductIds(campania?.catalogos_excluidos, catalogosSecciones)
  )

  // Inicializar carrito al cargar la campaña
  useEffect(() => {
    if (campania) {
      cartStore.initFromCampania(campania)
    }
    return () => { /* mantener carrito al navegar */ }
  }, [campania?.id])

  const handleAddProduct = (producto: Product, variant?: { variantId?: string; colorId?: string; colorName?: string; colorHex?: string; sizeId?: string; sizeName?: string; colorTipo?: string }) => {
    const variants = (producto as any).stockByVariants as StockByVariant[] | undefined
    if (variants && variants.length > 0 && !variant) {
      setVariantPicker({ product: producto, variants })
      return
    }

    let precioPromo = producto.price

    if (campania) {
      const regla = campania.reglas?.[0]
      if (regla) {
        switch (regla.tipo_regla) {
          case 'PRECIO_FIJO':
          case 'COMBO':
            if (regla.cantidad_minima && regla.precio_fijo) {
              precioPromo = regla.precio_fijo / regla.cantidad_minima
            }
            break
          case 'PORCENTAJE':
            precioPromo = producto.price * (1 - regla.porcentaje / 100)
            break
          case 'MONTO_FIJO':
            precioPromo = producto.price - (regla.descuento_fijo || regla.monto_minimo)
            break
        }
      }
    }

    cartStore.addItem(producto, Math.max(precioPromo, 0), variant)
  }

  const handleAplicarCupon = useCallback(async () => {
    if (!cuponInput.trim()) return
    cartStore.setCupon(cuponInput.trim().toUpperCase())
    setCuponMsg({ ok: true, msg: 'Cupón aplicado. Recalculando...' })
    setTimeout(() => {
      if (cartStore.resultadoMulti?.resultados.length) {
        setCuponMsg({ ok: true, msg: `✅ Cupón aplicado. Descuento: $${cartStore.resultadoMulti.total_descuento.toFixed(2)}` })
      } else {
        setCuponMsg({ ok: false, msg: 'El cupón no aplica a los productos seleccionados' })
      }
    }, 500)
  }, [cuponInput])

  // Forzar recálculo cuando cambia el carrito
  useEffect(() => {
    if (cartStore.items.length > 0) {
      cartStore.recalcular()
    }
  }, [cartStore.items.length])

  const regla = campania?.reglas?.[0]
  const catColor = campania ? (MKT_CATEGORIA_COLORS[campania.categoria] || MKT_TIPO_COLORS[campania.tipo] || '#6b7280') : '#6b7280'
  const catLabel = campania ? (MKT_CATEGORIA_LABELS[campania.categoria] || MKT_TIPO_LABELS[campania.tipo] || '') : ''

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: settings?.backgroundImage ? `url(${settings.backgroundImage}) center/cover fixed no-repeat` : '#f9fafb' }}>
        {settings?.backgroundImage && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />}
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: 24, textAlign: 'center', color: '#9ca3af', minHeight: '100vh' }}>
          Cargando campaña...
        </div>
      </div>
    )
  }

  if (error || !campania) {
    return (
      <div style={{ minHeight: '100vh', background: settings?.backgroundImage ? `url(${settings.backgroundImage}) center/cover fixed no-repeat` : '#f9fafb' }}>
        {settings?.backgroundImage && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />}
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: 24, minHeight: '100vh' }}>
          <div style={{ background: '#fef2f2', borderRadius: 12, padding: 24, textAlign: 'center', color: '#ef4444', border: '1px solid #fecaca' }}>
            {error || 'Campaña no encontrada'}
          </div>
          <button onClick={() => navigate('/tienda/marketing')}
            style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
            Volver a ofertas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: settings?.backgroundImage ? `url(${settings.backgroundImage}) center/cover fixed no-repeat` : '#f9fafb' }}>
      {settings?.backgroundImage && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />}
      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <button onClick={() => navigate('/tienda/marketing')}
          style={{ marginBottom: 16, padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
          ← Volver a ofertas
        </button>

        {/* Cabecera de campaña */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#fff', background: catColor }}>
              {catLabel}
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', color: '#059669', fontWeight: 500 }}>
              {MKT_TIPO_LABELS[campania.tipo]}
            </span>
          </div>

          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
            {campania.nombre}
          </h1>
          {campania.descripcion && (
            <p style={{ margin: '0 0 12px', fontSize: 14, color: '#6b7280' }}>{campania.descripcion}</p>
          )}

          {regla && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: '#4b5563' }}>
              {regla.cantidad_minima > 0 && (
                <span style={{ background: '#f0fdf4', padding: '4px 10px', borderRadius: 6, color: '#059669' }}>
                  Mínimo: {regla.cantidad_minima} productos
                </span>
              )}
              {regla.precio_fijo > 0 && (
                <span style={{ background: '#f0fdf4', padding: '4px 10px', borderRadius: 6, color: '#059669', fontWeight: 600 }}>
                  ${regla.precio_fijo.toFixed(2)} por {regla.cantidad_minima || 'lote'}
                </span>
              )}
              {regla.porcentaje > 0 && (
                <span style={{ background: '#eff6ff', padding: '4px 10px', borderRadius: 6, color: '#2563eb', fontWeight: 600 }}>
                  {regla.porcentaje}% de descuento
                </span>
              )}
              {regla.envio_gratis && (
                <span style={{ background: '#f0fdf4', padding: '4px 10px', borderRadius: 6, color: '#059669', fontWeight: 600 }}>
                  Envío gratis
                </span>
              )}
              {campania.fecha_fin && (
                <span style={{ background: '#fefce8', padding: '4px 10px', borderRadius: 6, color: '#a16207' }}>
                  Vence: {new Date(campania.fecha_fin).toLocaleDateString('es-EC')}
                </span>
              )}
            </div>
          )}

          {/* Badges */}
          {(campania.permite_acumulacion || campania.es_exclusiva) && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {campania.permite_acumulacion && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', color: '#059669' }}>
                  Acumulable con otras ofertas
                </span>
              )}
              {campania.es_exclusiva && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#fef2f2', color: '#ef4444' }}>
                  Oferta exclusiva
                </span>
              )}
            </div>
          )}
        </div>

        {/* Grid de productos + carrito */}
        {productosFiltrados.length > 0 && (
          <div className="promo-grid">
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#111827' }}>
                Productos disponibles ({productosFiltrados.length})
              </h3>

              {cartStore.mensajePromo && (
                <div style={{
                  marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13,
                  background: cartStore.mensajePromo.startsWith('✅') ? '#f0fdf4' : cartStore.mensajePromo.startsWith('⚠️') ? '#fef2f2' : '#eff6ff',
                  border: `1px solid ${cartStore.mensajePromo.startsWith('✅') ? '#86efac' : cartStore.mensajePromo.startsWith('⚠️') ? '#fca5a5' : '#93c5fd'}`,
                  color: cartStore.mensajePromo.startsWith('✅') ? '#166534' : cartStore.mensajePromo.startsWith('⚠️') ? '#dc2626' : '#1e40af',
                  fontWeight: 500,
                }}>
                  {cartStore.mensajePromo}
                </div>
              )}

              <div style={{ display: 'grid', gap: 12 }}>
                {productosFiltrados.map(producto => {
                  const inCart = cartStore.items.find(i => i.producto.id === producto.id)
                  const variants = (producto as any).stockByVariants as StockByVariant[] | undefined
                  const hasVariants = variants && variants.length > 0
                  const uniqueColors = hasVariants ? [...new Map(variants.filter(v => v.stock > 0).map(v => [v.colorId, v]))].map(([_, v]) => v) : []
                  return (
                    <div key={producto.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12,
                      background: inCart ? '#f0fdf4' : '#fff', border: `1px solid ${inCart ? '#86efac' : '#e5e7eb'}`,
                    }}>
                      <img src={producto.images?.[0] || ''} alt={producto.name}
                        style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{producto.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>${producto.price.toFixed(2)}</div>
                        {hasVariants && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                            {uniqueColors.length > 0 ? uniqueColors.map(v => (
                              <span key={v.colorId} style={{
                                width: 10, height: 10, borderRadius: '50%',
                                background: v.colorHex || '#ccc',
                                border: '1px solid #d1d5db', display: 'inline-block',
                              }} title={v.colorName} />
                            )) : <span style={{ fontSize: 10, color: '#ef4444' }}>sin stock</span>}
                            {uniqueColors.length > 0 && (
                              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 1 }}>
                                {uniqueColors.length} colores
                              </span>
                            )}
                          </div>
                        )}
                        {inCart?.colorName && (
                          <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                            {inCart.colorName}{inCart.sizeName ? ` / ${inCart.sizeName}` : ''}{inCart.colorTipo ? ` (${inCart.colorTipo})` : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {inCart ? (
                          <>
                            <button onClick={() => cartStore.updateCantidad(inCart.variantId || producto.id, inCart.cantidad - 1)}
                              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                              −
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 600, width: 20, textAlign: 'center' }}>{inCart.cantidad}</span>
                            <button onClick={() => cartStore.updateCantidad(inCart.variantId || producto.id, inCart.cantidad + 1)}
                              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                              +
                            </button>
                            <button onClick={() => cartStore.removeItem(inCart.variantId || producto.id)}
                              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444' }}>
                              ×
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleAddProduct(producto)}
                            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: catColor, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Carrito lateral */}
            <div className="promo-cart-sidebar">
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#111827' }}>
                  Tu carrito ({cartStore.items.length})
                </h3>
                {cartStore.items.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Agrega productos de la promoción</p>
                ) : (
                  <>
                    {cartStore.items.map(item => (
                      <div key={item.variantId || item.producto.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13,
                      }}>
                        <span style={{ flex: 1, color: '#374151' }}>
                          {item.producto.name} x{item.cantidad}
                          {item.colorName && <span style={{ fontSize: 11, color: '#6b7280' }}> ({item.colorName}{item.sizeName ? ` / ${item.sizeName}` : ''})</span>}
                        </span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          ${(item.precioPromocion * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {cartStore.resultadoMulti && cartStore.resultadoMulti.resultados.length > 0 && (
                      <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                          <span>Subtotal</span>
                          <span>${cartStore.resultadoMulti.total_original.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669' }}>
                          <span>Descuento</span>
                          <span>-${cartStore.resultadoMulti.total_descuento.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#111827', marginTop: 4 }}>
                          <span>Total</span>
                          <span>${cartStore.resultadoMulti.total_final.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    <button onClick={() => setShowModal('cotizacion')}
                      style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                      Solicitar cotización
                    </button>
                  </>
                )}
              </div>

              {/* Cupón */}
              <div style={{ marginTop: 12, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#111827' }}>¿Tienes un cupón?</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={cuponInput} onChange={e => setCuponInput(e.target.value.toUpperCase())}
                    placeholder="CUPÓN"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, textTransform: 'uppercase' }} />
                  <button onClick={handleAplicarCupon}
                    style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#111827', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
                    Aplicar
                  </button>
                </div>
                {cuponMsg && (
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: cuponMsg.ok ? '#059669' : '#ef4444' }}>
                    {cuponMsg.msg}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {productosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
            No hay productos disponibles para esta campaña
          </div>
        )}

        {/* Variant picker modal */}
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
                    {group.sizes[0]?.colorTipo && (
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>
                        {group.sizes[0].colorTipo}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {group.sizes.map(v => (
                      <button key={`${v.colorId}-${v.sizeId}`}
                        disabled={v.stock === 0}
                        onClick={() => {
                          handleAddProduct(variantPicker.product, {
                            variantId: `${v.colorId}-${v.sizeId}`,
                            colorId: v.colorId,
                            colorName: v.colorName,
                            colorHex: v.colorHex,
                            sizeId: v.sizeId,
                            sizeName: v.sizeName,
                            colorTipo: v.colorTipo,
                          })
                          setVariantPicker(null)
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db',
                          background: v.stock === 0 ? '#f3f4f6' : '#fff', cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                          fontSize: 12, color: v.stock === 0 ? '#9ca3af' : '#374151',
                          opacity: v.stock === 0 ? 0.5 : 1,
                        }}>
                        {v.sizeName} {v.stock > 0 ? `(${v.stock})` : '(agotado)'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal cotización */}
        {showModal === 'cotizacion' && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 380, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#111827' }}>Solicitar cotización</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Recibirás un resumen de tu pedido por WhatsApp
              </p>
              <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 10, fontSize: 13 }}>
                {cartStore.items.map(item => (
                  <div key={item.variantId || item.producto.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.producto.name} x{item.cantidad}{item.colorName ? ` (${item.colorName}${item.sizeName ? ` / ${item.sizeName}` : ''})` : ''}</span>
                    <span style={{ fontWeight: 600 }}>${(item.precioPromocion * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
                {cartStore.resultadoMulti && (
                  <>
                    <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>Total</span>
                      <span>${cartStore.resultadoMulti.total_final.toFixed(2)}</span>
                    </div>
                    {cartStore.resultadoMulti.total_descuento > 0 && (
                      <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
                        Descuento aplicado: -${cartStore.resultadoMulti.total_descuento.toFixed(2)}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowModal(null)}
                  style={{ flex: 1, padding: '10px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={() => {
                  const items = cartStore.items.map(i =>
                    `${i.producto.name}${i.colorName ? ` (${i.colorName}${i.sizeName ? ` / ${i.sizeName}` : ''})` : ''} x${i.cantidad} - $${(i.precioPromocion * i.cantidad).toFixed(2)}`
                  ).join('\n')
                  const total = cartStore.resultadoMulti?.total_final || 0
                  const msg = `Hola, quiero una cotización de la promoción "${campania.nombre}".\n\n${items}\n\nTotal: $${total.toFixed(2)}`
                  window.open(`https://wa.me/593999999999?text=${encodeURIComponent(msg)}`, '_blank')
                  setShowModal(null)
                }}
                  style={{ flex: 1, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
