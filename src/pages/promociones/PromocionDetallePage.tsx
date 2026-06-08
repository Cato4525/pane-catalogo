import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { usePromocionDetalle, useProductosFiltrados, useCalculoPromocion } from '../../hooks/usePromociones'
import { usePromocionesCartStore } from '../../store/promocionesCartStore'
import PromocionProductsGrid from '../../components/promociones/PromocionProductsGrid'
import PromocionCart from '../../components/promociones/PromocionCart'
import { Product, Cliente, ABONO_MINIMO } from '../../types'
import { WHATSAPP_NUMBER } from '../../services/supabaseClient'
import { dataService } from '../../services/dataService'
import supabase from '../../services/supabaseClient'

export default function PromocionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const products = useStore(s => s.products)
  const settings = useStore(s => s.settings)
  const addReserva = useStore(s => s.addReserva)
  const { campania, loading, error } = usePromocionDetalle(id)

  const storeCart = usePromocionesCartStore()
  const { items, addItem, removeItem, updateCantidad, clearCart, initCart, mensajePromo } = storeCart

  const [showModal, setShowModal] = useState<'cotizacion' | 'reserva' | null>(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteCiudad, setClienteCiudad] = useState('')
  const [abono, setAbono] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [comprobante, setComprobante] = useState<string>('')
  const [costoEnvioPersonalizado, setCostoEnvioPersonalizado] = useState('')

  const productosFiltrados = useProductosFiltrados(campania, products.filter(p => p.status === 'active'))
  const costoEnvio = settings?.costo_envio ?? 5
  const calculo = useCalculoPromocion(
    campania,
    items,
    costoEnvio
  )

  useEffect(() => {
    if (campania) initCart(campania)
  }, [campania, initCart])

  const handleAddProduct = (producto: Product, colorTipo?: string) => {
    if (campania && campania.reglas?.[0]?.precio_fijo && campania.reglas[0].cantidad_minima) {
      const unitPrice = campania.reglas[0].precio_fijo / campania.reglas[0].cantidad_minima
      addItem(producto, Math.min(unitPrice, producto.price), colorTipo)
    } else if (campania && campania.reglas?.[0]?.porcentaje) {
      const discountedPrice = producto.price * (1 - campania.reglas[0].porcentaje / 100)
      addItem(producto, discountedPrice, colorTipo)
    } else {
      addItem(producto, producto.price, colorTipo)
    }
  }

  const handleSolicitar = () => {
    setShowModal('cotizacion')
  }

  const handleReservar = (abonoSugerido: number) => {
    setAbono(abonoSugerido)
    setShowModal('reserva')
  }

  const enviarCotizacion = async () => {
    if (!campania || !calculo) return

    const detalle = items.map(i =>
      `${i.producto.name} x${i.cantidad} - $${(i.precioPromocion * i.cantidad).toFixed(2)}`
    ).join('\n')
    const mensajeTexto =
      `Hola, quiero una cotización de la promoción "${campania.nombre}".\n\n${detalle}` +
      `\n\nSubtotal: $${calculo.subtotalOriginal.toFixed(2)}` +
      `\nDescuento: $${calculo.descuentoTotal.toFixed(2)}` +
      `\nTotal: $${calculo.total.toFixed(2)}` +
      (clienteNombre ? `\n\nCliente: ${clienteNombre}` : '') +
      (clienteCiudad ? `\nCiudad: ${clienteCiudad}` : '')

    // Guardar en consultas
    try {
      await dataService.createConsulta({
        cliente_nombre: clienteNombre || 'Anónimo',
        cliente_telefono: '',
        mensaje: `Cotización promoción "${campania.nombre}":\n${detalle}\n\nTotal: $${calculo.total.toFixed(2)}`,
        origen: 'promocion',
      })
      if (clienteNombre && clienteCiudad) {
        localStorage.setItem('cliente_nombre', clienteNombre)
        localStorage.setItem('cliente_ciudad', clienteCiudad)
      }
    } catch (e) {
      console.error('Error guardando consulta:', e)
    }

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensajeTexto)}`, '_blank')
    setShowModal(null)
  }

  const confirmarReserva = async () => {
    if (!clienteNombre || !clienteTelefono) return
    setSubmitting(true)
    try {
      const envio = costoEnvioPersonalizado ? parseFloat(costoEnvioPersonalizado) : costoEnvio
      const cliente: Cliente = {
        id: `cli-promo-${Date.now()}`,
        nombre: clienteNombre,
        telefono: clienteTelefono,
        email: '',
        direccion: '',
        ciudad: '',
        documento: '',
        tipo_documento: 'cc',
        fecha_registro: new Date().toISOString(),
        observaciones: `Costo envío: $${envio.toFixed(2)}`,
        origen: 'tienda',
      }
      storeCart.setCliente(cliente)
      const result = await storeCart.crearReservaPromocion(abono)
      if (result) {
        // Guardar cliente en localStorage para que Mis Reservas lo encuentre
        localStorage.setItem('cliente_id', cliente.id)
        localStorage.setItem('cliente_nombre', cliente.nombre)
        localStorage.setItem('cliente_telefono', cliente.telefono)

        // Si hay comprobante, actualizar la reserva en Supabase
        if (comprobante) {
          try {
            await supabase
              .from('reservations')
              .update({ comprobante_url: comprobante, notas_admin: `Costo envío: $${envio.toFixed(2)}. Promoción: ${campania?.nombre}` })
              .eq('id', result.reserva.id)
          } catch (e) {
            console.error('Error actualizando comprobante:', e)
          }
        }

        const fechaLimite24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        // Agregar la reserva al store global
        addReserva({
          id: result.reserva.id,
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre,
          cliente_telefono: cliente.telefono,
          total: result.resumen.total,
          abono,
          saldo: result.resumen.total - abono,
          estado_reserva: abono >= ABONO_MINIMO ? 'abonado' : 'pendiente',
          fecha_reserva: new Date().toISOString(),
          fecha_limite_abono: fechaLimite24h,
          fecha_limite_pago: new Date(Date.now() + 7 * 86400000).toISOString(),
          comprobante_url: comprobante || null,
          whatsapp_revisado: false,
          comprobante_verificado: false,
          abono_confirmado: false,
          notas_admin: `Costo envío: $${envio.toFixed(2)}`,
          origen: 'store',
          items: items.map(i => ({
            id: `item-${Date.now()}-${i.producto.id}`,
            reserva_id: result.reserva.id,
            producto_id: i.producto.id,
            producto_nombre: i.producto.name,
            cantidad: i.cantidad,
            precio_unitario: i.precioPromocion,
            subtotal: i.precioPromocion * i.cantidad,
          })),
        })

        alert(`Reserva creada exitosamente.\nTotal: $${result.resumen.total.toFixed(2)}\nAbono: $${abono.toFixed(2)}\nSaldo: $${(result.resumen.total - abono).toFixed(2)}\n\nTienes 24 horas para validar tu reserva. Caso contrario será cancelada.`)
        clearCart()
        navigate('/tienda')
      } else {
        alert('Error al crear la reserva. Intenta de nuevo.')
      }
    } catch (e: any) {
      alert('Error: ' + (e?.message || 'Error desconocido'))
    }
    setSubmitting(false)
    setShowModal(null)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', marginTop: 4,
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, textAlign: 'center', color: '#9ca3af' }}>
        Cargando promoción...
      </div>
    )
  }

  if (error || !campania) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <div style={{
          background: '#fef2f2', borderRadius: 12, padding: 24, textAlign: 'center',
          color: '#ef4444', border: '1px solid #fecaca',
        }}>
          {error || 'Promoción no encontrada'}
        </div>
        <button
          onClick={() => navigate('/tienda/promociones')}
          style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          Volver a promociones
        </button>
      </div>
    )
  }

  const regla = campania.reglas?.[0]

  return (
    <div style={{ minHeight: '100vh', background: settings?.backgroundImage ? `url(${settings.backgroundImage}) center/cover fixed no-repeat` : '#f9fafb' }}>
      {settings?.backgroundImage && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />}
      <div style={{
        position: 'relative',
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px 16px',
      }}>
        <button
          onClick={() => navigate('/tienda/promociones')}
          style={{
            marginBottom: 16, padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#059669', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          ← Volver a promociones
        </button>

      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        padding: 24, marginBottom: 24,
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
          {campania.nombre}
        </h1>
        {campania.descripcion && (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
            {campania.descripcion}
          </p>
        )}
        {regla && (
          <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#4b5563' }}>
            {regla.cantidad_minima > 0 && (
              <span style={{ background: '#f0fdf4', padding: '4px 10px', borderRadius: 6, color: '#059669' }}>
                Mínimo: {regla.cantidad_minima} productos
              </span>
            )}
            {regla.precio_fijo > 0 && (
              <span style={{ background: '#f0fdf4', padding: '4px 10px', borderRadius: 6, color: '#059669' }}>
                Precio especial: ${regla.precio_fijo.toFixed(2)}
              </span>
            )}
            {regla.porcentaje > 0 && (
              <span style={{ background: '#eff6ff', padding: '4px 10px', borderRadius: 6, color: '#2563eb' }}>
                {regla.porcentaje}% de descuento
              </span>
            )}
            {regla.monto_minimo > 0 && (
              <span style={{ background: '#fffbeb', padding: '4px 10px', borderRadius: 6, color: '#d97706' }}>
                Compra mínima: ${regla.monto_minimo.toFixed(2)}
              </span>
            )}
            {campania.fecha_fin && (
              <span style={{ background: '#fef2f2', padding: '4px 10px', borderRadius: 6, color: '#ef4444' }}>
                Vence: {new Date(campania.fecha_fin).toLocaleDateString('es-EC')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="promo-grid">
        {mensajePromo && (
          <div style={{
            gridColumn: '1 / -1', padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: mensajePromo.startsWith('✅') ? '#f0fdf4' : mensajePromo.startsWith('⚠️') ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${mensajePromo.startsWith('✅') ? '#86efac' : mensajePromo.startsWith('⚠️') ? '#fca5a5' : '#93c5fd'}`,
            color: mensajePromo.startsWith('✅') ? '#166534' : mensajePromo.startsWith('⚠️') ? '#dc2626' : '#1e40af',
            fontWeight: 500,
          }}>
            {mensajePromo}
          </div>
        )}
        <PromocionProductsGrid
          productos={productosFiltrados}
          selectedItems={items}
          onAdd={handleAddProduct}
          onRemove={removeItem}
          onUpdateCantidad={updateCantidad}
        />

        <PromocionCart
          campania={campania}
          items={items}
          onUpdateCantidad={updateCantidad}
          onRemove={removeItem}
          onSolicitar={handleSolicitar}
          onReservar={handleReservar}
          costoEnvio={costoEnvio}
        />
      </div>

      {showModal === 'cotizacion' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24, width: 380,
            maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Solicitar Cotización</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Nombre</label>
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} style={inputStyle} placeholder="Tu nombre" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Ciudad</label>
                <input value={clienteCiudad} onChange={e => setClienteCiudad(e.target.value)} style={inputStyle} placeholder="Tu ciudad" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowModal(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={enviarCotizacion} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'reserva' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24, width: 440,
            maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Reservar Promoción</h2>
            {calculo && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Total promoción:</span><span style={{ fontWeight: 600 }}>${calculo.total.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Envío:</span>
                  <span>
                    {costoEnvioPersonalizado
                      ? `$${parseFloat(costoEnvioPersonalizado).toFixed(2)}`
                      : calculo.envio === 0 ? 'GRATIS' : `$${calculo.envio.toFixed(2)}`
                    }
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Abono:</span><span style={{ fontWeight: 600 }}>${abono.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTop: '1px solid #e5e7eb', fontWeight: 700 }}>
                  <span>Saldo pendiente:</span><span>$${((costoEnvioPersonalizado ? parseFloat(costoEnvioPersonalizado) : calculo.total) - abono).toFixed(2)}</span>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Nombre</label>
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} style={inputStyle} placeholder="Nombre completo" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Teléfono</label>
                <input value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} style={inputStyle} placeholder="+593..." />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Costo de envío (opcional)</label>
                <input type="number" value={costoEnvioPersonalizado} onChange={e => setCostoEnvioPersonalizado(e.target.value)} style={inputStyle} placeholder={calculo ? `$${calculo.envio.toFixed(2)}` : '0.00'} step={0.01} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Monto a abonar</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button type="button" onClick={() => setAbono(ABONO_MINIMO)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: abono === ABONO_MINIMO ? '2px solid #059669' : '1px solid #d1d5db', background: abono === ABONO_MINIMO ? '#ecfdf5' : '#fff', color: '#059669', fontWeight: 600, cursor: 'pointer', fontSize: 11 }}>
                    Mín. ${ABONO_MINIMO.toFixed(2)}
                  </button>
                  <button type="button" onClick={() => calculo && setAbono(calculo.total * 0.5)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: abono === (calculo ? calculo.total * 0.5 : 0) ? '2px solid #059669' : '1px solid #d1d5db', background: abono === (calculo ? calculo.total * 0.5 : 0) ? '#ecfdf5' : '#fff', color: '#059669', fontWeight: 600, cursor: 'pointer', fontSize: 11 }}>
                    50%
                  </button>
                  <button type="button" onClick={() => calculo && setAbono(calculo.total)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: calculo && abono === calculo.total ? '2px solid #059669' : '1px solid #d1d5db', background: calculo && abono === calculo.total ? '#ecfdf5' : '#fff', color: '#059669', fontWeight: 600, cursor: 'pointer', fontSize: 11 }}>
                    Total
                  </button>
                </div>
                <input type="number" value={abono} onChange={e => setAbono(Number(e.target.value))} style={{ ...inputStyle, marginTop: 8 }} min={ABONO_MINIMO} step={0.01} placeholder="Otro valor" />
                {abono < ABONO_MINIMO && (
                  <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>El abono mínimo es ${ABONO_MINIMO.toFixed(2)}</p>
                )}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Comprobante de pago (opcional)</label>
                {comprobante ? (
                  <div style={{ position: 'relative', display: 'inline-block', marginTop: 6 }}>
                    <img src={comprobante} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8 }} />
                    <button onClick={() => setComprobante('')}
                      style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>×</button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, border: '2px dashed #d1d5db', borderRadius: 8, cursor: 'pointer', background: '#f9fafb', marginTop: 6 }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = () => setComprobante(reader.result as string)
                          reader.readAsDataURL(file)
                        }
                      }} />
                    <span style={{ color: '#6b7280', fontSize: 12 }}>📷 Subir comprobante de transferencia</span>
                  </label>
                )}
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
              ⚠️ <strong>Importante:</strong> Tienes <strong>24 horas</strong> para validar tu reserva. Si no se valida en ese tiempo, la reserva será cancelada automáticamente. Sube tu comprobante de pago para agilizar la validación.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowModal(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={confirmarReserva}
                disabled={submitting || !clienteNombre || !clienteTelefono || abono < ABONO_MINIMO}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: '#059669', color: '#fff', fontWeight: 600, cursor: 'pointer',
                  opacity: (submitting || !clienteNombre || !clienteTelefono || abono < ABONO_MINIMO) ? 0.5 : 1,
                }}
              >
                {submitting ? 'Reservando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
