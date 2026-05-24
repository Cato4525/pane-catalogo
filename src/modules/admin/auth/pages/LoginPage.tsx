import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '../../../../store/authStore'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginAdmin(email, password)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      navigate('/admin/dashboard')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0a;
        }

        .lp-deco {
          position: relative;
          overflow: hidden;
          background: #0f0f0f;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 48px;
        }
        .lp-deco-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .lp-deco-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }
        .lp-deco-circle:nth-child(2) {
          width: 380px; height: 380px;
          top: -60px; left: -80px;
          background: radial-gradient(circle, #c8a96e33, transparent 70%);
        }
        .lp-deco-circle:nth-child(3) {
          width: 280px; height: 280px;
          bottom: 80px; right: -40px;
          background: radial-gradient(circle, #6e8fc833, transparent 70%);
        }
        .lp-deco-tag {
          position: absolute;
          top: 48px; left: 48px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #c8a96e;
        }
        .lp-deco-content { position: relative; }
        .lp-deco-headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(36px, 4vw, 52px);
          line-height: 1.1;
          color: #f5f0e8;
          margin-bottom: 20px;
        }
        .lp-deco-headline em {
          font-style: italic;
          color: #c8a96e;
        }
        .lp-deco-sub {
          font-size: 14px;
          font-weight: 300;
          color: #666;
          line-height: 1.7;
          max-width: 320px;
        }

        .lp-form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: #111;
        }
        .lp-form-wrap {
          width: 100%;
          max-width: 380px;
        }

        .lp-admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #c8a96e15;
          border: 1px solid #c8a96e33;
          border-radius: 20px;
          font-size: 11px;
          color: #c8a96e;
          margin-bottom: 20px;
        }
        .lp-admin-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #c8a96e;
          animation: pulse-gold 2s infinite;
        }
        @keyframes pulse-gold {
          0%, 100% { opacity: 1; }
          50% { opacity: .3; }
        }

        .lp-title {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: #f5f0e8;
          margin-bottom: 6px;
        }
        .lp-subtitle {
          font-size: 13px;
          font-weight: 300;
          color: #555;
          margin-bottom: 28px;
        }

        .lp-field { margin-bottom: 14px; }
        .lp-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 7px;
        }
        .lp-input {
          width: 100%;
          padding: 12px 14px;
          background: #1a1a1a;
          border: 1px solid #252525;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #f5f0e8;
          outline: none;
          transition: border-color .15s;
        }
        .lp-input::placeholder { color: #333; }
        .lp-input:focus { border-color: #c8a96e55; }

        .lp-btn-admin {
          width: 100%;
          padding: 13px;
          margin-top: 8px;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all .2s;
          background: #1a1a1a;
          color: #c8a96e;
          border: 1px solid #c8a96e44;
        }
        .lp-btn-admin:hover:not(:disabled) {
          background: #c8a96e11;
          border-color: #c8a96e88;
        }
        .lp-btn-admin:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .lp-error {
          margin-top: 14px;
          padding: 11px 14px;
          background: #2a1515;
          border: 1px solid #5a2020;
          border-radius: 7px;
          font-size: 13px;
          color: #e07070;
        }

        .lp-spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid #c8a96e44;
          border-top-color: #c8a96e;
          border-radius: 50%;
          animation: spin .6s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .lp-root { grid-template-columns: 1fr; }
          .lp-deco { display: none; }
          .lp-form-panel { padding: 32px 24px; }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-deco">
          <div className="lp-deco-grid" />
          <div className="lp-deco-circle" />
          <div className="lp-deco-circle" />
          <span className="lp-deco-tag">Panel Admin</span>
          <div className="lp-deco-content">
            <h1 className="lp-deco-headline">
              Bienvenido<br />de <em>vuelta.</em>
            </h1>
            <p className="lp-deco-sub">
              Gestiona tu catálogo, pedidos y clientes desde un solo lugar.
            </p>
          </div>
        </div>

        <div className="lp-form-panel">
          <div className="lp-form-wrap">
            <div className="lp-admin-badge">
              <span className="lp-admin-dot" />
              Acceso restringido
            </div>
            <h2 className="lp-title">Panel admin</h2>
            <p className="lp-subtitle">Solo personal autorizado</p>

            <form onSubmit={handleSubmit}>
              <div className="lp-field">
                <label className="lp-label">Email</label>
                <input
                  className="lp-input"
                  type="email"
                  placeholder="admin@tienda.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="lp-field">
                <label className="lp-label">Contraseña</label>
                <input
                  className="lp-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                className="lp-btn-admin"
                type="submit"
                disabled={loading}
              >
                {loading && <span className="lp-spinner" />}
                Ingresar al panel
              </button>
            </form>

            {error && <div className="lp-error">{error}</div>}
          </div>
        </div>
      </div>
    </>
  )
}
