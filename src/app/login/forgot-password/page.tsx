'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ocorreu um erro ao processar sua solicitação.');
      } else {
        setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.');
        setEmail('');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass">
        <div className="login-header">
          <div className="logo-section">
            <div className="logo-icon-wrapper">
              <span className="logo-icon">🔒</span>
            </div>
            <div className="brand-text">
              <span className="brand-name">SinapsiGestão</span>
            </div>
          </div>
          <h1>Recuperar Senha</h1>
          <p className="welcome-text">Informe seu e-mail para receber as instruções</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>
        </form>

        <div className="login-footer">
          <Link href="/login" className="back-link">
            ← Voltar para o Login
          </Link>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, hsla(var(--primary), 0.15), transparent),
                      radial-gradient(circle at bottom right, hsla(var(--primary), 0.1), transparent),
                      hsl(var(--background));
          padding: 1.5rem;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          border-radius: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
        }

        .logo-icon-wrapper {
          background: hsla(var(--primary), 0.1);
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .logo-icon { font-size: 2rem; }
        .brand-name { font-size: 1.25rem; font-weight: 700; opacity: 0.8; }
        .login-header h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        .welcome-text { font-size: 0.875rem; opacity: 0.6; }

        .login-form { display: flex; flex-direction: column; gap: 1.25rem; }

        .success-message {
          padding: 1rem;
          background-color: hsla(var(--success), 0.1);
          color: hsl(var(--success));
          border-radius: 0.75rem;
          font-size: 0.875rem;
          text-align: center;
          border: 1px solid hsla(var(--success), 0.2);
          line-height: 1.4;
        }

        .error-message {
          padding: 1rem;
          background-color: hsla(var(--destructive), 0.1);
          color: hsl(var(--destructive));
          border-radius: 0.75rem;
          font-size: 0.875rem;
          text-align: center;
          border: 1px solid hsla(var(--destructive), 0.2);
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          opacity: 0.8;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 1rem;
          border: 1px solid hsla(var(--foreground), 0.1);
          background: hsla(var(--background), 0.5);
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 4px hsla(var(--primary), 0.1);
        }

        .login-button {
          padding: 1rem;
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(221, 83%, 60%) 100%);
          color: white;
          border: none;
          border-radius: 1.25rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px hsla(var(--primary), 0.3);
          margin-top: 0.5rem;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px hsla(var(--primary), 0.4);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
        }

        .back-link {
          font-size: 0.875rem;
          color: hsla(var(--foreground), 0.5);
          text-decoration: none;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: hsl(var(--primary));
        }

        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        :global(.dark) .glass {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
