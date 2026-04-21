'use client';
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
  
  const isLivia = session?.user?.email === 'psi.liviabrito@gmail.com';
  const isLuciano = session?.user?.email === 'lucianoxote@hotmail.com';

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
          ) : settings.logoUrl ? (
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', margin: '0 auto 0.5rem auto', backgroundColor: 'hsl(var(--primary)/0.1)', borderRadius: '50%', color: 'hsl(var(--primary))', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '2px solid hsl(var(--primary)/0.2)' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{settings.nomeClinica ? settings.nomeClinica.charAt(0).toUpperCase() : '🧠'}</span>
            </div>
          )}
          <div className="clinic-name-text" style={{ fontSize: '0.7rem', opacity: 1, marginTop: '0.15rem', letterSpacing: '0.05em', fontWeight: '600', textAlign: 'left' }}>
            {settings.nomeClinica || session?.user?.name || 'Profissional'} {settings.crp ? `| ${settings.crp}` : ''}
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

          {session?.user?.email === 'lucianoxote@hotmail.com' && (
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

          {/* Powered By SinapsiGestão Watermark */}
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid hsla(var(--border), 0.3)',
            textAlign: 'center',
            opacity: 0.5,
            fontSize: '0.65rem',
            letterSpacing: '0.02em',
            transition: 'opacity 0.3s ease',
            cursor: 'default',
            paddingBottom: '0.5rem' // Ensure it doesn't touch the absolute bottom of viewport
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          >
            <span style={{ display: 'block', marginBottom: '0.2rem' }}>Powered by</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: 'hsl(var(--primary))' }}>
               <img 
                 src="/logo-sinapsi.png" 
                 alt="Ícone SinapsiGestão" 
                 style={{ width: '20px', height: 'auto', objectFit: 'contain' }} 
               />
               SinapsiGestão
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
