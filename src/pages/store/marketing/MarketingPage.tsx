// ============================================================
// STORE MARKETING PAGE v2
// Muestra campañas agrupadas por categoría (Promociones,
// Descuentos, Ofertas, Combos, Liquidación, Black Friday, etc.)
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../store'
import { useMktCampanias } from '../../../hooks/useCampaigns'
import MktCampaignCard from '../../../components/campaigns/CampaignCard'
import { MktCampania, MktCategoriaCampania, MKT_CATEGORIA_LABELS, MKT_CATEGORIA_COLORS } from '../../../types/marketing'

const CATEGORIAS_VISIBLES: MktCategoriaCampania[] = [
  'PROMOCION', 'DESCUENTO', 'OFERTA', 'LIQUIDACION', 'BLACK_FRIDAY', 'TEMPORADA',
]

export default function MarketingStorePage() {
  const navigate = useNavigate()
  const settings = useStore(s => s.settings)
  const [categoriaActiva, setCategoriaActiva] = useState<MktCategoriaCampania | null>(null)
  const { campanias, loading } = useMktCampanias({ activas: true })

  const handleSelect = (campania: MktCampania) => {
    navigate(`/tienda/marketing/${campania.id}`)
  }

  const filtradas = categoriaActiva
    ? campanias.filter(c => c.categoria === categoriaActiva)
    : campanias

  const storeName = settings?.storeName || 'Tienda'

  return (
    <div style={{ minHeight: '100vh', background: settings?.backgroundImage ? `url(${settings.backgroundImage}) center/cover fixed no-repeat` : '#f9fafb' }}>
      {settings?.backgroundImage && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />}
      <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
          Ofertas y Promociones
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>
          {storeName} — Aprovecha nuestras campañas activas
        </p>
      </div>

      {/* Pestañas de categoría */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => setCategoriaActiva(null)}
          style={{
            padding: '8px 16px', borderRadius: 20, border: 'none',
            background: !categoriaActiva ? '#111827' : '#f3f4f6',
            color: !categoriaActiva ? '#fff' : '#374151',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}
        >
          Todas
        </button>
        {CATEGORIAS_VISIBLES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: 'none',
              background: categoriaActiva === cat ? MKT_CATEGORIA_COLORS[cat] : '#f3f4f6',
              color: categoriaActiva === cat ? '#fff' : '#374151',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            {MKT_CATEGORIA_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          Cargando ofertas...
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, color: '#9ca3af',
          background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        }}>
          No hay {categoriaActiva ? MKT_CATEGORIA_LABELS[categoriaActiva]?.toLowerCase() : 'campañas'} activas en este momento
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtradas.map(c => (
            <MktCampaignCard key={c.id} campania={c} onSelect={handleSelect} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
