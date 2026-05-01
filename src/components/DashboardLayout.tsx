'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useSettings } from './SettingsProvider';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { data: session } = useSession();
  const [latchedIsLuciano, setLatchedIsLuciano] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    if (session?.user?.email?.toLowerCase() === 'lucianoxote@hotmail.com') {
      setLatchedIsLuciano(true);
    }
  }, [session]);

  const isAuthPage = pathname?.startsWith('/login') || pathname === '/reset-password';
  const isLivia = session?.user?.email?.toLowerCase() === 'psi.liviabrito@gmail.com';
  const isLuciano = session?.user?.email?.toLowerCase() === 'lucianoxote@hotmail.com' || latchedIsLuciano;
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Determine the mobile icon
  let mobileIcon = "/favicon.png"; // Default to new SinapsiGestor logo
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
          <div className="mobile-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <img 
              src={mobileIcon} 
              alt="Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} 
            />
            <span className="mobile-header-title" style={{ fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
