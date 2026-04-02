'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { useSettings } from './SettingsProvider';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
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
          <span className="mobile-header-title">{settings.nomeClinica || 'PsicoManager'}</span>
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
