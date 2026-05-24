import { useState, useRef, useEffect } from 'react';
import { Product, EstadoCatalogo } from '../../types';
import { useStore } from '../../store';

interface ProductActionsProps {
  product: Product;
  onViewDetails?: () => void;
  onEdit?: () => void;
}

const ESTADOS: { value: EstadoCatalogo; label: string; emoji: string; color: string }[] = [
  { value: 'exclusivo', label: 'Exclusivo', emoji: '⭐', color: '#9333ea' },
  { value: 'tendencia', label: 'Tendencia', emoji: '🔥', color: '#3b82f6' },
  { value: 'clasico', label: 'Clásico', emoji: '💎', color: '#22c55e' },
  { value: 'liquidacion', label: 'Liquidación', emoji: '🏷️', color: '#ef4444' },
  { value: 'descontinuado', label: 'Descontinuado', emoji: '🚫', color: '#6b7280' },
];

const COLECCIONES = [
  'Primavera-Verano 2024',
  'Otoño-Invierno 2024',
  'Primavera-Verano 2025',
  'Otoño-Invierno 2025',
  'Colección Básica',
  'Edición Limitada',
];

export default function ProductActions({ product, onViewDetails, onEdit }: ProductActionsProps) {
  const [open, setOpen] = useState(false);
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);
  const [showColeccionMenu, setShowColeccionMenu] = useState(false);
  const [showLiquidacionModal, setShowLiquidacionModal] = useState(false);
  const [precioLiquidacion, setPrecioLiquidacion] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    activateProduct,
    deactivateProduct,
    setEstadoCatalogo,
    setTipoCatalogo,
    setColeccion,
    enviarLiquidacion,
    quitarLiquidacion,
  } = useStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowEstadoMenu(false);
        setShowColeccionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleActivar = () => {
    activateProduct(product.id);
    setOpen(false);
  };

  const handleDesactivar = () => {
    deactivateProduct(product.id);
    setOpen(false);
  };

  const handleCambiarEstado = (estado: EstadoCatalogo) => {
    setEstadoCatalogo(product.id, estado);
    setShowEstadoMenu(false);
    setOpen(false);
  };

  const handleCambiarColeccion = (coleccion: string) => {
    setColeccion(product.id, coleccion);
    setShowColeccionMenu(false);
    setOpen(false);
  };

  const handleEnviarLiquidacion = () => {
    const precio = parseFloat(precioLiquidacion);
    if (precio > 0 && precio < product.price) {
      enviarLiquidacion(product.id, precio);
      setShowLiquidacionModal(false);
      setPrecioLiquidacion('');
      setOpen(false);
    }
  };

  const handleQuitarLiquidacion = () => {
    quitarLiquidacion(product.id);
    setOpen(false);
  };

  const handleHacerPermanente = () => {
    setTipoCatalogo(product.id, 'permanente');
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '5px 10px',
          background: '#1e1e2e',
          border: '1px solid #2d2d3e',
          borderRadius: 6,
          color: '#94a3b8',
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        ⋮
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            background: '#0d0d14',
            border: '1px solid #2d2d3e',
            borderRadius: 10,
            padding: '6px 0',
            minWidth: 200,
            zIndex: 50,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            animation: 'fadeUp 0.15s ease',
          }}
        >
          {onViewDetails && (
            <button
              onClick={() => { onViewDetails(); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>👁️</span> Ver detalles
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>✏️</span> Editar producto
            </button>
          )}

          <div style={{ height: 1, background: '#1e1e2e', margin: '4px 0' }} />

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowEstadoMenu(!showEstadoMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🔄</span> Cambiar estado
              <span style={{ marginLeft: 'auto', fontSize: 10 }}>▸</span>
            </button>

            {showEstadoMenu && (
              <div
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: 0,
                  marginLeft: 4,
                  background: '#0d0d14',
                  border: '1px solid #2d2d3e',
                  borderRadius: 8,
                  padding: '4px 0',
                  minWidth: 160,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }}
              >
                {ESTADOS.map((estado) => (
                  <button
                    key={estado.value}
                    onClick={() => handleCambiarEstado(estado.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '6px 12px',
                      background: product.estado_catalogo === estado.value ? `${estado.color}22` : 'transparent',
                      border: 'none',
                      color: product.estado_catalogo === estado.value ? estado.color : '#94a3b8',
                      fontSize: 11,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{estado.emoji}</span> {estado.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowColeccionMenu(!showColeccionMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>📦</span> Cambiar colección
              <span style={{ marginLeft: 'auto', fontSize: 10 }}>▸</span>
            </button>

            {showColeccionMenu && (
              <div
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: 0,
                  marginLeft: 4,
                  background: '#0d0d14',
                  border: '1px solid #2d2d3e',
                  borderRadius: 8,
                  padding: '4px 0',
                  minWidth: 180,
                  maxHeight: 200,
                  overflowY: 'auto',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }}
              >
                {COLECCIONES.map((col) => (
                  <button
                    key={col}
                    onClick={() => handleCambiarColeccion(col)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 12px',
                      background: product.coleccion === col ? '#4ade8022' : 'transparent',
                      border: 'none',
                      color: product.coleccion === col ? '#4ade80' : '#94a3b8',
                      fontSize: 11,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: '#1e1e2e', margin: '4px 0' }} />

          {product.en_liquidacion ? (
            <button
              onClick={handleQuitarLiquidacion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#f59e0b',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>💰</span> Quitar de liquidación
            </button>
          ) : (
            <button
              onClick={() => setShowLiquidacionModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🔥</span> Enviar a liquidación
            </button>
          )}

          {product.estado_catalogo === 'descontinuado' && !product.activo && (
            <button
              onClick={handleActivar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#4ade80',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>♻️</span> Reactivar producto
            </button>
          )}

          {product.tipo_catalogo !== 'permanente' && product.estado_catalogo !== 'descontinuado' && (
            <button
              onClick={handleHacerPermanente}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#22d3ee',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>⭐</span> Hacer permanente
            </button>
          )}

          <div style={{ height: 1, background: '#1e1e2e', margin: '4px 0' }} />

          {product.activo ? (
            <button
              onClick={handleDesactivar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🚫</span> Desactivar producto
            </button>
          ) : (
            <button
              onClick={handleActivar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                color: '#4ade80',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>✅</span> Activar producto
            </button>
          )}
        </div>
      )}

      {showLiquidacionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowLiquidacionModal(false)}
        >
          <div
            style={{
              background: '#0d0d14',
              border: '1px solid #2d2d3e',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 360,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', color: '#f1f5f9', fontSize: 16, fontWeight: 600 }}>
              🔥 Enviar a Liquidación
            </h3>
            <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 12 }}>
              Producto: <strong style={{ color: '#f1f5f9' }}>{product.name}</strong>
            </p>
            <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 12 }}>
              Precio actual: <strong style={{ color: '#4ade80' }}>${product.price.toFixed(2)}</strong>
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#64748b', fontSize: 11 }}>
                NUEVO PRECIO DE LIQUIDACIÓN
              </label>
              <input
                type="number"
                value={precioLiquidacion}
                onChange={(e) => setPrecioLiquidacion(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0f',
                  border: '1px solid #1e1e2e',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 14,
                  fontFamily: "'DM Mono',monospace",
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLiquidacionModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#1e1e2e',
                  border: '1px solid #2d2d3e',
                  borderRadius: 8,
                  color: '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarLiquidacion}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
