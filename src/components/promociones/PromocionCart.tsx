import { useMemo } from 'react'
import { Campania, CarritoPromocionItem, CalculoPromocion, ABONO_MINIMO } from '../../types'
import { calcularPromocion } from '../../services/promocionesService'
import { validate2x28Promotion, Validate2x28Result, validatePromotionRules, ValidatePromotionItem } from '../../services/promotionValidator'

interface Props {
  campania: Campania
  items: CarritoPromocionItem[]
  onUpdateCantidad: (productId: string, cantidad: number) => void
  onRemove: (productId: string) => void
  onSolicitar: () => void
  onReservar: (abono: number) => void
  costoEnvio?: number
}

export default function PromocionCart({
  campania,
  items,
  onUpdateCantidad,
  onRemove,
  onSolicitar,
  onReservar,
  costoEnvio,
}: Props) {
  if (items.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        padding: 24,
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 14,
      }}>
        Selecciona productos para ver el resumen
      </div>
    )
  }

  const calculo = calcularPromocion(
    campania,
    items.map(i => ({ producto: i.producto, cantidad: i.cantidad })),
    costoEnvio ?? 0
  )

  const validationResult: { valid: boolean; message?: string } | null = useMemo(() => {
    const regla = campania.reglas?.[0]
    if (!regla) return null
    const config = (regla as any).configuracion_json || {}
    const promRules = config.promotion_rules

    const validateItems = items.map(i => ({
      productId: i.producto.id,
      price: i.producto.price,
      quantity: i.cantidad,
      colorTipo: i.colorTipo,
      colorName: i.producto.color,
    }))

    if (promRules) {
      const result = validatePromotionRules(promRules, validateItems)
      return result.valid ? null : result
    }

    if (!regla.parear_color_tipo) return null
    const legacy = validate2x28Promotion(validateItems)
    return legacy.valid ? null : legacy
  }, [campania, items])

  const isPromoInvalid = validationResult !== null

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #e5e7eb',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'sticky',
      top: 20,
    }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
          Resumen
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
          {campania.nombre}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
        {items.map(item => (
          <div
            key={item.producto.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 10,
              background: '#f9fafb',
            }}
          >
            {item.producto.images?.[0] && (
              <img
                src={item.producto.images[0]}
                alt={item.producto.name}
                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.producto.name}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                ${item.precioPromocion.toFixed(2)} c/u
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => onUpdateCantidad(item.producto.id, item.cantidad - 1)}
                style={{
                  width: 36, height: 36, borderRadius: 6, border: '1px solid #d1d5db',
                  background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}
              >
                -
              </button>
              <span style={{ fontSize: 16, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>
                {item.cantidad}
              </span>
              <button
                onClick={() => onUpdateCantidad(item.producto.id, item.cantidad + 1)}
                style={{
                  width: 36, height: 36, borderRadius: 6, border: '1px solid #d1d5db',
                  background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}
              >
                +
              </button>
            </div>
            <button
              onClick={() => onRemove(item.producto.id)}
              style={{
                width: 36, height: 36, borderRadius: 6, border: 'none',
                background: '#fef2f2', cursor: 'pointer', fontSize: 20, color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
          <span>Subtotal</span>
          <span>${calculo.subtotalOriginal.toFixed(2)}</span>
        </div>
        {calculo.descuentoTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669' }}>
            <span>Descuento</span>
            <span>-${calculo.descuentoTotal.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: calculo.envio === 0 ? '#059669' : '#6b7280' }}>
          <span>Envío</span>
          <span>{calculo.envio === 0 ? 'GRATIS' : `$${calculo.envio.toFixed(2)}`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#111827', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          <span>Total</span>
          <span>${calculo.total.toFixed(2)}</span>
        </div>
      </div>

      {isPromoInvalid && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13,
          background: '#fef2f2', border: '1px solid #fca5a5',
          color: '#dc2626', fontWeight: 500, textAlign: 'center',
        }}>
          {validationResult?.message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onSolicitar}
          disabled={isPromoInvalid}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            background: isPromoInvalid ? '#d1d5db' : '#059669',
            color: isPromoInvalid ? '#9ca3af' : '#fff',
            fontWeight: 700, cursor: isPromoInvalid ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          Solicitar Cotización
        </button>
        <button
          onClick={() => onReservar(calculo.total * 0.5)}
          disabled={isPromoInvalid}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: '1px solid',
            borderColor: isPromoInvalid ? '#d1d5db' : '#059669',
            background: isPromoInvalid ? '#f3f4f6' : '#fff',
            color: isPromoInvalid ? '#9ca3af' : '#059669',
            fontWeight: 600, cursor: isPromoInvalid ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          Reservar con 50% Abono
        </button>
        <button
          onClick={() => onReservar(ABONO_MINIMO)}
          disabled={isPromoInvalid}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: '1px solid',
            borderColor: isPromoInvalid ? '#d1d5db' : '#d97706',
            background: isPromoInvalid ? '#f3f4f6' : '#fffbeb',
            color: isPromoInvalid ? '#9ca3af' : '#d97706',
            fontWeight: 600, cursor: isPromoInvalid ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          Reservar con Abono
        </button>
      </div>
    </div>
  )
}
