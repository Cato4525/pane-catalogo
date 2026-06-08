import { Campania } from '../../types'

const TIPO_BADGE: Record<string, { label: string; color: string }> = {
  PRECIO_FIJO: { label: 'Precio Fijo', color: '#22c55e' },
  PORCENTAJE: { label: '% Descuento', color: '#3b82f6' },
  MONTO_FIJO: { label: 'Descuento Fijo', color: '#f59e0b' },
  COMPRA_X_LLEVA_Y: { label: 'Compra x Lleva y', color: '#8b5cf6' },
  COMBO: { label: 'Combo', color: '#ec4899' },
  ENVIO_GRATIS: { label: 'Envío Gratis', color: '#06b6d4' },
}

interface Props {
  campania: Campania
  onSelect: (campania: Campania) => void
}

export default function PromocionCard({ campania, onSelect }: Props) {
  const badge = TIPO_BADGE[campania.tipo] || { label: campania.tipo, color: '#6b7280' }
  const regla = campania.reglas?.[0]

  return (
    <div
      onClick={() => onSelect(campania)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        padding: 20,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          background: badge.color,
        }}>
          {badge.label}
        </span>
      </div>

      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
        {campania.nombre}
      </h3>

      {campania.descripcion && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>
          {campania.descripcion}
        </p>
      )}

      {regla && (
        <div style={{ fontSize: 12, color: '#4b5563', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {regla.cantidad_minima > 0 && <span>Cantidad mínima: {regla.cantidad_minima}</span>}
          {regla.precio_fijo > 0 && <span>Precio: ${regla.precio_fijo.toFixed(2)}</span>}
          {regla.porcentaje > 0 && <span>{regla.porcentaje}% de descuento</span>}
          {regla.monto_minimo > 0 && <span>Compra mínima: ${regla.monto_minimo.toFixed(2)}</span>}
          {regla.envio_gratis && <span>Envío gratis incluido</span>}
        </div>
      )}

      {campania.fecha_fin && (
        <div style={{ marginTop: 12, fontSize: 11, color: '#9ca3af' }}>
          Vence: {new Date(campania.fecha_fin).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
    </div>
  )
}
