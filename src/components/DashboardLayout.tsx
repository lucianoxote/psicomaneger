'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { useSettings } from './SettingsProvider';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith('/login') || pathname === '/reset-password';
  
  if (isAuthPage) {
    return <>{children}</>;
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
              src="/images/synapsis-icone.png" 
              alt="Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
            />
            <span className="mobile-header-title">{settings.nomeClinica || 'SynaPSIS'}</span>
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
