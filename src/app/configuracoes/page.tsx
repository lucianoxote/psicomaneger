'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/components/SettingsProvider';

export default function ConfiguracoesPage() {
  const { settings, refreshSettings, t } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings)
      });
      if (res.ok) {
        await refreshSettings();
        alert(settings.idioma === 'English' ? 'Settings saved!' : 'Configurações salvas com sucesso!');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="configuracoes-container">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{t('Configurações')}</h1>
        <p style={{ opacity: 0.6 }}>Gerencie suas preferências, dados da clínica e personalização do sistema.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>{t('Informações da Clínica')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">{t('Nome da Clínica / Profissional')}</label>
              <input 
                type="text" 
                className="form-input" 
                value={localSettings.nomeClinica} 
                onChange={e => setLocalSettings({...localSettings, nomeClinica: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Registro Profissional (CRP)')}</label>
              <input 
                type="text" 
                className="form-input" 
                value={localSettings.crp} 
                onChange={e => setLocalSettings({...localSettings, crp: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>{t('Preferências do Sistema')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">{t('Tema Visual')}</label>
              <select 
                className="form-input" 
                value={localSettings.tema} 
                onChange={e => setLocalSettings({...localSettings, tema: e.target.value})}
              >
                <option>Tema Claro (Premium)</option>
                <option>Tema Escuro</option>
                <option>Automático (Sistema)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Idioma')}</label>
              <select 
                className="form-input" 
                value={localSettings.idioma} 
                onChange={e => setLocalSettings({...localSettings, idioma: e.target.value})}
              >
                <option>Português (Brasil)</option>
                <option>English</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.75rem 2rem' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '...' : t('Salvar Alterações')}
        </button>
      </div>
    </div>
  );
}
