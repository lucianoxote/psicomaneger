'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from './SettingsProvider';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, settings } = useSettings();

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
        <div style={{ padding: '0' }}>
          <img 
            src="/images/logo_livia_transparent.png" 
            alt="SynaPSIS Logo" 
            className="sidebar-logo light-logo"
            style={{ 
              width: '100%', 
              maxWidth: '185px', 
              height: 'auto',
              transition: 'all 0.3s ease'
            }} 
          />
          <img 
            src="/images/logo_livia_white_text.png" 
            alt="SynaPSIS Logo" 
            className="sidebar-logo dark-logo"
            style={{ 
              width: '100%', 
              maxWidth: '185px', 
              height: 'auto',
              transition: 'all 0.3s ease',
              mixBlendMode: 'screen',
              clipPath: 'inset(2px)'
            }} 
          />
          <div style={{ fontSize: '0.625rem', opacity: 0.6, marginTop: '0', letterSpacing: '0.05em', fontWeight: '500' }}>
            {settings.nomeClinica || 'Lívia Brito'} | {settings.crp || 'CRP 03/11745'}
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

          <button
            onClick={handleSignOut}
            className="nav-link"
            style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span>🚪</span> {t('Sair')}
          </button>

          {/* Powered By SynaPSIS Watermark */}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.9rem', color: 'hsl(var(--primary))' }}>
               <img 
                 src="/images/synapsis-icone.png" 
                 alt="Ícone SynaPSIS" 
                 style={{ width: '16px', height: '16px', objectFit: 'contain' }} 
               />
               SynaPSIS
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .light-logo { display: block !important; }
        .dark-logo { display: none !important; }
        :global(.dark) .light-logo { display: none !important; }
        :global(.dark) .dark-logo { 
          display: block !important; 
          filter: contrast(150%) brightness(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.1));
          mix-blend-mode: screen;
        }
      `}</style>
    </aside>
  );
}
