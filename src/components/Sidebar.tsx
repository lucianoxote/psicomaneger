'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from './SettingsProvider';
import { signOut, useSession } from 'next-auth/react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, settings } = useSettings();
  const { data: session } = useSession();
  const [latchedIsLuciano, setLatchedIsLuciano] = useState(false);

  useEffect(() => {
    if (session?.user?.email?.toLowerCase() === 'lucianoxote@hotmail.com') {
      setLatchedIsLuciano(true);
    }
  }, [session]);
  
  const isLivia = session?.user?.email?.toLowerCase() === 'psi.liviabrito@gmail.com';
  const isLuciano = session?.user?.email?.toLowerCase() === 'lucianoxote@hotmail.com' || latchedIsLuciano;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const links = [
    { href: '/', label: t('Dashboard'), icon: '📊' },
    { href: '/pacientes', label: t('Pacientes'), icon: '👥' },
    { href: '/agenda', label: t('Agendamento'), icon: '📅' },
    { href: '/financeiro', label: t('Financeiro'), icon: '💰' },
    { href: '/documentos', label: t('Documentos'), icon: '📄' },
    { href: '/tarefas', label: t('Tarefas'), icon: '✅' },
    { href: '/familia', label: t('Família'), icon: '👨‍👩‍👧' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div style={{ marginBottom: '2rem', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ padding: '0', width: '100%' }}>
          {isLivia && !settings.logoUrl ? (
            <>
              <img 
                src="/images/logo_livia_transparent.png" 
                alt="Logo Lívia" 
                className="sidebar-logo light-logo"
                style={{ 
                  width: '100%', 
                  maxWidth: '185px', 
                  height: 'auto',
                  transition: 'all 0.3s ease'
                }} 
              />
              <img 
                src="/images/logo_livia_white_text_v2.png" 
                alt="Logo Lívia" 
                className="sidebar-logo dark-logo"
                style={{ 
                  width: '100%', 
                  maxWidth: '185px', 
                  height: 'auto',
                  transition: 'all 0.3s ease',
                  clipPath: 'inset(2px)'
                }} 
              />
            </>
          ) : settings.logoUrl && !settings.logoUrl.toLowerCase().includes('synapsis') && !isLuciano ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.nomeClinica || "Logo da Clínica"} 
              className="custom-logo"
              style={{ 
                width: '100%', 
                maxWidth: '185px', 
                height: 'auto',
                marginBottom: '0.5rem',
                transition: 'all 0.3s ease'
              }} 
            />
          ) : (
            <div style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'center' }}>
              <img 
                src="/images/logo-sinapsi.png" 
                alt="SinapsiGestor Logo" 
                className="sidebar-brand-logo light-logo"
                style={{ 
                  width: '100%', 
                  maxWidth: '185px', 
                  height: 'auto',
                  transition: 'all 0.3s ease'
                }} 
              />
              <img 
                src="/images/logo-sinapsi-white.png" 
                alt="SinapsiGestor Logo" 
                className="sidebar-brand-logo dark-logo"
                style={{ 
                  width: '100%', 
                  maxWidth: '185px', 
                  height: 'auto',
                  transition: 'all 0.3s ease'
                }} 
              />
            </div>
          )}
          <div className="clinic-name-text" style={{ fontSize: '0.85rem', opacity: 1, marginTop: '1rem', letterSpacing: '0.05em', fontWeight: '700', textAlign: 'left' }}>
            {isLuciano ? (
              <>
                <span style={{ color: '#8a3ab9' }}>Luciano Peixoto</span>
                <span style={{ color: '#10b981', fontWeight: '700' }}> | ADM</span>
              </>
            ) : (
              <>
                {settings.nomeClinica || session?.user?.name || 'Profissional'} {settings.crp ? `| ${settings.crp}` : ''}
              </>
            )}
          </div>
        </div>
        {onClose && (
          <button className="mobile-close-btn" onClick={onClose} aria-label="Fechar menu">
            ✕
          </button>
        )}
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
        {links.map((link, idx) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
          return (
            <Link
              key={idx}
              href={link.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span>{link.icon}</span> {link.label}
            </Link>
          );
        })}
        
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            href="/configuracoes"
            className={`nav-link ${pathname === '/configuracoes' ? 'active' : ''}`}
            onClick={onClose}
          >
            <span>⚙️</span> {t('Configurações')}
          </Link>

          {session?.user?.email?.toLowerCase() === 'lucianoxote@hotmail.com' && (
            <Link
              href="/admin"
              className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}
              onClick={onClose}
              style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
            >
              <span>🚀</span> {t('Painel SaaS')}
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="nav-link"
            style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span>🚪</span> {t('Sair')}
          </button>

          {/* Powered By SinapsiGestor Watermark */}
          <div style={{
            marginTop: '1rem',
            paddingTop: '0.8rem',
            borderTop: '1px solid hsla(var(--border), 0.1)',
            textAlign: 'center',
            opacity: 0.6,
            transition: 'opacity 0.3s ease',
            cursor: 'default',
            paddingBottom: '2.5rem' // Increased significantly for mobile framing
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
          >
            <span style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.6rem', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Powered by</span>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <img 
                 src="/images/logo-sinapsi.png" 
                 alt="SinapsiGestor" 
                 className="light-logo footer-brand-img"
                 style={{ width: '100%', maxWidth: '100px', height: 'auto', objectFit: 'contain' }} 
               />
               <img 
                 src="/images/logo-sinapsi-white.png" 
                 alt="SinapsiGestor" 
                 className="dark-logo footer-brand-img"
                 style={{ width: '100%', maxWidth: '100px', height: 'auto', objectFit: 'contain' }} 
               />
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .custom-logo {
          mix-blend-mode: multiply;
        }
        :global(.dark) .custom-logo {
          mix-blend-mode: screen;
          filter: invert(1) hue-rotate(180deg) brightness(1.7) !important;
        }
        .light-logo { display: block !important; }
        .dark-logo { display: none !important; }
        :global(.dark) .light-logo { display: none !important; }
        :global(.dark) .dark-logo { 
          display: block !important; 
          filter: contrast(150%) brightness(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.1));
        }
        .clinic-name-text { color: hsl(25 30% 30%); }
        :global(.dark) .clinic-name-text { color: rgba(255, 255, 255, 0.85); }
      `}</style>
    </aside>
  );
}
