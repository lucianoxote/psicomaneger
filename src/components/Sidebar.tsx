'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from './SettingsProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const { t, settings } = useSettings();

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
    <aside className="sidebar">
      <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'hsl(var(--primary))' }}>
          PsicoManager
        </h2>
        <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '0.2rem' }}>{settings.nomeClinica}</div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map((link, idx) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
          return (
            <Link
              key={idx}
              href={link.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{link.icon}</span> {link.label}
            </Link>
          );
        })}
        <Link
          href="/configuracoes"
          className={`nav-link ${pathname === '/configuracoes' ? 'active' : ''}`}
          style={{ marginTop: 'auto' }}
        >
          <span>⚙️</span> {t('Configurações')}
        </Link>
      </nav>
    </aside>
  );
}
