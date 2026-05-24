import { useState } from 'react';
import { CarouselSlide } from '../../types/product';

interface ProductSlideProps {
  slide: CarouselSlide;
  isActive: boolean;
  onAddToCart: (product: CarouselSlide) => void;
  onViewDetails: (product: CarouselSlide) => void;
}

export default function ProductSlide({ slide, isActive, onAddToCart, onViewDetails }: ProductSlideProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const { producto, tag, titulo, subtitulo, emoji, precio, accent } = slide;

  return (
    <div 
      className={`slide-container ${isActive ? 'active' : ''}`}
      style={{
        display: 'none',
        gridTemplateColumns: '1fr 1.2fr 1fr',
        gap: '2rem',
        alignItems: 'center',
        padding: '2rem 3rem',
        minHeight: '420px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        borderRadius: '24px',
        boxShadow: isActive ? `0 25px 50px -12px ${accent}25` : 'none',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'scale(1)' : 'scale(0.95)',
      }}
    >
      {/* Columna Izquierda - Información básica */}
      <div className="slide-left" style={{
        animation: isActive ? 'slideInLeft 0.6s ease forwards' : 'none',
        animationDelay: '0.1s',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            color: '#fff',
            background: accent,
            padding: '4px 12px',
            borderRadius: '20px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {tag}
          </span>
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            color: '#94a3b8',
            fontWeight: 500,
            letterSpacing: '0.05em',
          }}>
            {producto.sku}
          </span>
        </div>
        
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: 800,
          color: '#1e293b',
          marginBottom: '0.5rem',
          lineHeight: 1.2,
          fontFamily: "'Playfair Display', serif",
        }}>
          {titulo}
        </h2>
        
        <p style={{ 
          fontSize: '0.9rem', 
          color: '#64748b',
          marginBottom: '1rem',
        }}>
          {producto.categoria}
        </p>
        
        {producto.tag && (
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            background: accent + '15',
            borderRadius: '20px',
            border: `1px solid ${accent}30`,
          }}>
            <span style={{ fontSize: '0.75rem', color: accent, fontWeight: 600 }}>
              ★ {producto.tag}
            </span>
          </div>
        )}
      </div>

      {/* Columna Centro - Imagen principal */}
      <div 
        className="slide-center"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Fondo con glow */}
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'pulse 3s ease-in-out infinite',
        }} />
        
        {/* Imagen/ Emoji con animaciones */}
        <div style={{
          fontSize: '8rem',
          position: 'relative',
          zIndex: 1,
          cursor: 'pointer',
          transition: 'all 0.4s ease',
          transform: isHovered ? 'scale(1.15) translateY(-10px)' : 'scale(1) translateY(0)',
          animation: isActive ? 'float 4s ease-in-out infinite' : 'none',
          filter: isHovered ? `drop-shadow(0 20px 30px ${accent}40)` : 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
        }}>
          {emoji}
        </div>
        
        {/* Indicador de precio flotante */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff',
          padding: '8px 20px',
          borderRadius: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 2,
        }}>
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            color: accent,
            fontFamily: "'Playfair Display', serif",
          }}>
            ${precio.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Columna Derecha - Detalles */}
      <div className="slide-right" style={{
        animation: isActive ? 'slideInRight 0.6s ease forwards' : 'none',
        animationDelay: '0.2s',
      }}>
        <p style={{ 
          fontSize: '0.9rem', 
          color: '#475569',
          lineHeight: 1.7,
          marginBottom: '1.5rem',
        }}>
          {producto.descripcion}
        </p>
        
        {/* Características */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            fontSize: '0.75rem', 
            color: '#94a3b8',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}>
            Características
          </h4>
          {producto.caracteristicas?.slice(0, 3).map((carac, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '0.5rem',
            }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: accent,
              }} />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {carac}
              </span>
            </div>
          ))}
        </div>
        
        {/* Botones de acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => onAddToCart(slide)}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: accent,
              border: 'none',
              borderRadius: '14px',
              color: '#1e293b',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: `0 4px 15px ${accent}40`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 25px ${accent}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${accent}40`;
            }}
          >
            + Agregar al carrito
          </button>
          
          <button
            onClick={() => onViewDetails(slide)}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: 'transparent',
              border: '2px solid #e2e8f0',
              borderRadius: '14px',
              color: '#475569',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.color = accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#475569';
            }}
          >
            Ver detalles
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @media (max-width: 1024px) {
          .slide-container {
            grid-template-columns: 1fr !important;
            text-align: center;
            padding: 1.5rem !important;
            min-height: auto !important;
          }
          
          .slide-left, .slide-right {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .slide-right button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
