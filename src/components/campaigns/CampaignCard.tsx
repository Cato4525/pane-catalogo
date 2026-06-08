// ============================================================
// CAMPAIGN CARD v2 — Componente para tienda
// ============================================================

import { MktCampania, MKT_CATEGORIA_LABELS, MKT_CATEGORIA_COLORS, MKT_TIPO_LABELS, MKT_TIPO_COLORS } from '../../types/marketing'

interface Props {
  campania: MktCampania
  onSelect: (campania: MktCampania) => void
}

export default function MktCampaignCard({ campania, onSelect }: Props) {
  const regla = campania.reglas?.[0]
  const catColor = MKT_CATEGORIA_COLORS[campania.categoria] || MKT_TIPO_COLORS[campania.tipo] || '#6b7280'
  const catLabel = MKT_CATEGORIA_LABELS[campania.categoria] || MKT_TIPO_LABELS[campania.tipo] || campania.tipo

  return (
    <div
      onClick={() => onSelect(campania)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: `1px solid #e5e7eb`,
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
          display: 'inline-block', padding: '4px 10px', borderRadius: 8,
          fontSize: 11, fontWeight: 600, color: '#fff', background: catColor,
        }}>
          {catLabel}
        </span>
        {regla?.envio_gratis && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', color: '#059669', fontWeight: 600 }}>
            Envío gratis
          </span>
        )}
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
          {regla.cantidad_minima > 0 && <span>Mínimo: {regla.cantidad_minima}</span>}
          {regla.precio_fijo > 0 && <span style={{ fontWeight: 600, color: '#059669' }}>Precio: ${regla.precio_fijo.toFixed(2)}</span>}
          {regla.porcentaje > 0 && <span style={{ fontWeight: 600, color: '#2563eb' }}>{regla.porcentaje}% de descuento</span>}
          {regla.descuento_fijo > 0 && <span>Descuento: ${regla.descuento_fijo.toFixed(2)}</span>}
          {regla.monto_minimo > 0 && <span>Compra mín: $${regla.monto_minimo.toFixed(2)}</span>}
          {regla.envio_gratis && <span style={{ color: '#059669' }}>Envío gratis incluido</span>}
        </div>
      )}

      {/* Badges */}
      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {campania.permite_acumulacion && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', color: '#059669' }}>
            Acumulable
          </span>
        )}
        {campania.es_exclusiva && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#fef2f2', color: '#ef4444' }}>
            Exclusiva
          </span>
        )}
        {campania.fecha_fin && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#fefce8', color: '#a16207' }}>
            Vence: {new Date(campania.fecha_fin).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}
