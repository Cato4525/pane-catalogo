import { useState, useEffect, useCallback } from 'react';
import { CarouselSlide } from '../../types/product';
import ProductSlide from './ProductSlide';

interface ProductCarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
  onAddToCart?: (slide: CarouselSlide) => void;
  onViewDetails?: (slide: CarouselSlide) => void;
}

export default function ProductCarousel({ 
  slides, 
  autoPlayInterval = 5000,
  onAddToCart,
  onViewDetails 
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, goToNext, slides.length]);

  const handleAddToCart = (slide: CarouselSlide) => {
    if (onAddToCart) {
      onAddToCart(slide);
    } else {
      console.log('Agregar al carrito:', slide.producto.nombre);
    }
  };

  const handleViewDetails = (slide: CarouselSlide) => {
    if (onViewDetails) {
      onViewDetails(slide);
    } else {
      console.log('Ver detalles:', slide.producto.nombre);
    }
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div 
      className="carousel-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px 0',
      }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Contenedor principal del carrusel */}
      <div style={{
        position: 'relative',
        background: '#fff',
        borderRadius: '28px',
        boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        {/* Slides */}
        <div style={{
          position: 'relative',
          minHeight: '420px',
        }}>
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              style={{
                display: index === currentIndex ? 'block' : 'none',
              }}
            >
              <ProductSlide
                slide={slide}
                isActive={index === currentIndex}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            </div>
          ))}
        </div>

        {/* Botones de navegación */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              aria-label="Anterior"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fff',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: '#1e293b',
                transition: 'all 0.3s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
              }}
            >
              ←
            </button>

            <button
              onClick={goToNext}
              aria-label="Siguiente"
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fff',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: '#1e293b',
                transition: 'all 0.3s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
              }}
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Indicadores inferiores */}
      {slides.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginTop: '20px',
        }}>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              aria-label={`Ir a slide ${index + 1}`}
              style={{
                width: index === currentIndex ? '32px' : '10px',
                height: '10px',
                borderRadius: '10px',
                background: index === currentIndex ? slide.accent : '#e2e8f0',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* Información de autoplay */}
      {slides.length > 1 && (
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '0.75rem',
          color: '#94a3b8',
        }}>
          {isAutoPlaying ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: '#22c55e',
                animation: 'blink 1.5s infinite',
              }} />
              Reproducción automática
            </span>
          ) : (
            <span>Reproducción pausada</span>
          )}
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        .carousel-wrapper button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
