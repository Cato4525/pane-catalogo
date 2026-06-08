import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { usePromociones } from '../../hooks/usePromociones'
import PromocionCard from '../../components/promociones/PromocionCard'
import { Campania } from '../../types'

export default function PromocionesPage() {
  const navigate = useNavigate()
  const settings = useStore(s => s.settings)
  const { campanias, loading, error } = usePromociones()

  const handleSelect = (campania: Campania) => {
    navigate(`/tienda/promociones/${campania.id}`)
  }

  const pageTitle = settings?.storeName || 'Promociones'

  return (
    <div style={{ minHeight: '100vh', background: settings?.backgroundImage ? `url(${settings.backgroundImage}) center/cover fixed no-repeat` : '#f9fafb' }}>
      {settings?.backgroundImage && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />}
      <div style={{
        position: 'relative',
        maxWidth: 900,
        margin: '0 auto',
        padding: '24px 16px',
      }}>
        <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
          Promociones
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>
          {pageTitle} — Aprovecha nuestras ofertas especiales
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          Cargando promociones...
        </div>
      )}

      {error && (
        <div style={{
          textAlign: 'center', padding: 40, color: '#ef4444',
          background: '#fef2f2', borderRadius: 12,
        }}>
          {error}
        </div>
      )}

      {!loading && !error && campanias.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 60, color: '#9ca3af',
          background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        }}>
          No hay promociones activas en este momento
        </div>
      )}

      {!loading && campanias.length > 0 && (
        <div style={{ display: 'grid', gap: 16 }}>
          {campanias.map(campania => (
            <PromocionCard
              key={campania.id}
              campania={campania}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
