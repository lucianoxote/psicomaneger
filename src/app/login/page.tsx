'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [name, setName] = useState(''); // Only for first access
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for remembered email
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

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
        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
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
    <div className="login-container" style={{ backgroundColor: 'hsl(28, 30%, 93%)' }}>
      <div className="login-card glass">
        <div className="login-header">
          <div className="logo-section" style={{ marginBottom: '1.5rem' }}>
            <div className="logo-icon-wrapper" style={{ width: '280px', height: 'auto', background: 'none', boxShadow: 'none' }}>
              <img 
                src="/images/logo_livia_transparent.png" 
                alt="Lívia Brito Psicóloga" 
                className="light-logo"
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  display: 'block'
                }} 
              />
              <img 
                src="/images/logo_livia_white_text.png" 
                alt="Lívia Brito Psicóloga" 
                className="dark-logo"
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  mixBlendMode: 'screen',
                  clipPath: 'inset(2px)'
                }} 
              />
            </div>
          </div>
          <p className="welcome-text" style={{ marginTop: '1rem' }}>{isRegistering ? 'Configuração de Primeiro Acesso' : 'Gestão Clínica de Excelência'}</p>
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              <span>Lembrar-me</span>
            </label>
            {!isRegistering && (
              <Link href="/login/forgot-password" title="Recuperar acesso ao sistema" className="forgot-password">
                Esqueci minha senha
              </Link>
            )}
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
          --brand-brown: 25 45% 42%;
          --brand-brown-light: 25 45% 50%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, hsla(var(--brand-brown), 0.12), transparent),
                      radial-gradient(circle at bottom right, hsla(var(--brand-brown), 0.08), transparent),
                      hsl(28 30% 93%);
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
          margin-bottom: 2.5rem;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .logo-icon-wrapper {
          background: hsla(var(--brand-brown), 0.1);
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 1.25rem;
          position: relative;
        }

        .logo-icon {
          font-size: 2.5rem;
          filter: drop-shadow(0 0 10px hsla(var(--brand-brown), 0.5));
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-family: inherit;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsla(var(--foreground), 0.6) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }

        .brand-subtitle {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          opacity: 0.5;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .welcome-text {
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

        .password-input-wrapper {
          position: relative;
        }

        .password-input {
          padding-right: 3rem;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: hsla(var(--foreground), 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .password-toggle:hover {
          color: hsl(var(--brand-brown));
          background: hsla(var(--brand-brown), 0.1);
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
          margin-top: -0.5rem;
          position: relative;
          z-index: 10;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .remember-me:hover {
          opacity: 1;
        }

        .remember-me input {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          accent-color: hsl(var(--brand-brown));
          cursor: pointer;
        }

        .forgot-password {
          color: hsl(var(--brand-brown));
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
          cursor: pointer;
          position: relative;
          z-index: 11;
          padding: 0.5rem 0;
        }

        .forgot-password:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .login-button {
          margin-top: 0.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, hsl(var(--brand-brown)) 0%, hsl(var(--brand-brown-light)) 100%);
          color: white;
          border: none;
          border-radius: 1.25rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px hsla(var(--brand-brown), 0.3),
                      inset 0 1px 1px hsla(0, 0%, 100%, 0.2);
          position: relative;
          overflow: hidden;
        }

        .login-button::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -5px hsla(var(--brand-brown), 0.4),
                      0 4px 8px -2px hsla(var(--brand-brown), 0.2);
        }

        .login-button:hover:not(:disabled)::after {
          opacity: 1;
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 0.75rem;
          opacity: 0.4;
          line-height: 1.5;
        }

        .glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 40px 80px -20px rgba(92, 60, 44, 0.15);
        }

        :global(.dark) .glass {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.5);
        }

        .light-logo { display: block !important; }
        .dark-logo { display: none !important; }
        :global(.dark) .light-logo { display: none !important; }
        :global(.dark) .dark-logo { 
          display: block !important; 
          filter: contrast(150%) brightness(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.1));
          mix-blend-mode: screen;
        }
      `}</style>
    </div>
  );
}
