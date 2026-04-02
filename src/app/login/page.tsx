'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for first access
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if system has users
    fetch('/api/auth/register')
      .then(res => res.json())
      .then(data => {
        setHasUsers(data.hasUsers);
        if (!data.hasUsers) {
          setIsRegistering(true);
        }
      })
      .catch(() => setHasUsers(true));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('E-mail ou senha inválidos');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Ocorreu um erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao registrar');
      } else {
        // Success! Now login automatically
        const loginResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        
        if (loginResult?.error) {
          setError('Usuário criado, mas erro ao entrar automaticamente. Tente fazer login.');
          setIsRegistering(false);
          setHasUsers(true);
        } else {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (hasUsers === null) return null;

  return (
    <div className="login-container">
      <div className="login-card glass">
        <div className="login-header">
          <div className="logo-icon">✨</div>
          <h1>PsicoManager</h1>
          <p>{isRegistering ? 'Configuração de Primeiro Acesso' : 'Bem-vindo de volta'}</p>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                className="form-input"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

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

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Processando...' : (isRegistering ? 'Criar Minha Conta' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="login-footer">
          <p>Proteja as informações de seus pacientes com segurança.</p>
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

        .logo-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 0 10px hsla(var(--primary), 0.5));
        }

        .login-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
          background: linear-gradient(to bottom right, hsl(var(--foreground)), hsla(var(--foreground), 0.7));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          font-size: 0.875rem;
          opacity: 0.6;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .error-message {
          padding: 0.75rem;
          background-color: hsla(var(--destructive), 0.1);
          color: hsl(var(--destructive));
          border-radius: 0.75rem;
          font-size: 0.875rem;
          text-align: center;
          border: 1px solid hsla(var(--destructive), 0.2);
        }

        .login-button {
          margin-top: 0.5rem;
          padding: 0.875rem;
          background-color: hsl(var(--primary));
          color: white;
          border: none;
          border-radius: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px hsla(var(--primary), 0.3);
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px hsla(var(--primary), 0.4);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.75rem;
          opacity: 0.4;
          line-height: 1.5;
        }

        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        :global(.dark) .glass {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
