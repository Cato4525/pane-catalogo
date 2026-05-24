import { useState } from 'react';
import { useStore } from '../../../../store';
import { THEME_PRESETS, ThemeType } from '../../../../types';

export default function InventoryPage() {
  const settings = useStore(state => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const isEjecutivo = theme === 'ejecutivo';
  
  const { products } = useStore();
  const [filter, setFilter] = useState('todos');

  const filteredProducts = filter === 'todos' 
    ? products 
    : filter === 'bajo' 
      ? products.filter(p => p.stock <= 5)
      : products.filter(p => p.stock > 5);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const bajoStock = products.filter(p => p.stock <= 5).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Inventario</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Controla el stock de productos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Productos</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{products.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Stock Total</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{totalStock}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Stock Bajo</p>
          <p className="text-2xl font-bold" style={{ color: '#f87171' }}>{bajoStock}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['todos', 'bajo', 'normal'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm ${filter === f ? '' : ''}`}
            style={{ 
              backgroundColor: filter === f ? (isEjecutivo ? '#fbbf24' : 'var(--color-primary)') : (isEjecutivo ? '#000000' : 'rgba(100,116,139,0.2)'), 
              color: filter === f ? (isEjecutivo ? '#000000' : 'white') : (isEjecutivo ? '#ffffff' : 'var(--text-muted)') 
            }}
          >
            {f === 'bajo' ? 'Stock Bajo' : f === 'normal' ? 'Normal' : 'Todos'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table table-mobile-card">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td data-label="Producto" className="font-medium" style={{ color: 'var(--text)' }}>{product.name}</td>
                  <td data-label="Precio" style={{ color: 'var(--text-muted)' }}>${product.price.toFixed(2)}</td>
                  <td data-label="Stock" style={{ color: 'var(--text-muted)' }}>{product.stock}</td>
                  <td data-label="Estado">
                    <span className="badge" style={{ 
                      backgroundColor: product.stock === 0 ? 'rgba(239,68,68,0.15)' : product.stock <= 5 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                      color: product.stock === 0 ? '#f87171' : product.stock <= 5 ? '#fbbf24' : '#4ade80'
                    }}>
                      {product.stock === 0 ? 'Agotado' : product.stock <= 5 ? 'Bajo' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
