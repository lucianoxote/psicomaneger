'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { useSettings } from './SettingsProvider';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { data: session } = useSession();
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith('/login') || pathname === '/reset-password';
  const isLivia = session?.user?.email === 'psi.liviabrito@gmail.com';
  const isLuciano = session?.user?.email === 'lucianoxote@hotmail.com';
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Determine the mobile icon
  let mobileIcon = "/favicon-sinapsi.png"; // Default to new SinapsiGestor brain
  if (isLivia && !settings.logoUrl) {
    mobileIcon = "/images/livia_brain_icon.png";
  } else if (settings.logoUrl && !isLuciano) {
    mobileIcon = settings.logoUrl;
  }

  return (
    <div className="layout-wrapper">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-content">
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            ☰
          </button>
          <div className="mobile-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={mobileIcon} 
              alt="Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
            />
            <span className="mobile-header-title" style={{ fontWeight: '700' }}>
              {isLuciano ? (
                <>
                  <span style={{ color: '#8a3ab9' }}>Luciano Peixoto</span>{' '}
                  <span style={{ color: '#10b981' }}>| ADM</span>
                </>
              ) : (
                settings.nomeClinica || 'Sinapsi Gestor'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
