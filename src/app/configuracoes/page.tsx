'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSettings } from '@/components/SettingsProvider';

export default function ConfiguracoesPage() {
  const { settings, setSettings, refreshSettings, t } = useSettings();
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === 'lucianoxote@hotmail.com';
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  
  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Password Change State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [changingPass, setChangingPass] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    fetchUsers();
  }, [settings]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/register');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
    }
  };

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Usuário criado com sucesso!');
        setNewUser({ name: '', email: '', password: '' });
        setShowAddUser(false);
        fetchUsers();
      } else {
        alert(data.error || 'Erro ao criar usuário.');
      }
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return alert('A nova senha e a confirmação não coincidem.');
    }
    if (passwords.new.length < 6) {
      return alert('A senha deve ter pelo menos 6 caracteres.');
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Senha alterada com sucesso!');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        alert(data.error || 'Erro ao alterar senha.');
      }
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="configuracoes-container">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{t('Configurações')}</h1>
        <p style={{ opacity: 0.6 }}>Gerencie suas preferências, dados da clínica e acesso de usuários.</p>
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
            <div className="form-group">
              <label className="form-label">Caminho da Logomarca (Opcional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: /images/minha-marca.png"
                value={localSettings.logoUrl || ''} 
                onChange={e => setLocalSettings({...localSettings, logoUrl: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* Gestão de Acesso - SOMENTE ADMIN */}
        {isAdmin && (
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Gestão de Acesso</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {users.map((u, i) => (
                <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid hsla(var(--border), 0.5)', fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: '500' }}>{u.name}</div>
                  <div style={{ opacity: 0.6, fontSize: '0.75rem' }}>{u.email}</div>
                </div>
              ))}
            </div>
            
            {!showAddUser ? (
              <button 
                className="btn" 
                style={{ backgroundColor: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', marginTop: '1rem' }}
                onClick={() => setShowAddUser(true)}
              >
                + Adicionar Novo Psicólogo
              </button>
            ) : (
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', padding: '1rem', backgroundColor: 'hsla(var(--accent), 0.5)', borderRadius: 'var(--radius)' }}>
                <input 
                  type="text" 
                  placeholder="Nome" 
                  className="form-input" 
                  style={{ fontSize: '0.875rem' }}
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  required
                />
                <input 
                  type="email" 
                  placeholder="E-mail" 
                  className="form-input" 
                  style={{ fontSize: '0.875rem' }}
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  required
                />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  className="form-input" 
                  style={{ fontSize: '0.875rem' }}
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  required
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={creatingUser}>
                    {creatingUser ? '...' : 'Salvar'}
                  </button>
                  <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowAddUser(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        )}

        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Gestão de Assinatura</h3>
          <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'hsla(var(--primary), 0.05)', border: '1px solid hsla(var(--primary), 0.1)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em' }}>Plano Atual</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--primary))' }}>
                  {(session?.user as any)?.plan || 'Gratuito'}
                </div>
              </div>
              <div style={{ 
                padding: '0.4rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700',
                background: (session?.user as any)?.subscriptionStatus === 'Ativo' ? '#10B981' : '#EF4444',
                color: 'white'
              }}>
                {(session?.user as any)?.subscriptionStatus || 'Ativo'}
              </div>
            </div>

            {(session?.user as any)?.plan === 'Trial' && (
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                Seu período de teste expira em: <b>{ (session?.user as any)?.trialEndsAt ? new Date((session?.user as any)?.trialEndsAt).toLocaleDateString() : '--/--/----' }</b>
              </div>
            )}
          </div>
          
          <div style={{ fontSize: '0.875rem' }}>
            <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Deseja fazer um upgrade ou tem dúvidas sobre sua fatura?</p>
            {!showSupport ? (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', fontWeight: '600' }}
                onClick={() => setShowSupport(true)}
              >
                Falar com Consultor
              </button>
            ) : (
              <div className="interactive-card" style={{ 
                padding: '1rem', 
                background: 'hsla(var(--primary), 0.08)', 
                border: '1px solid hsla(var(--primary), 0.2)',
                borderRadius: '12px',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.6 }}>Consultor:</span>
                    <span style={{ fontWeight: '600' }}>Luciano Peixoto</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.6 }}>WhatsApp:</span>
                    <a href="https://wa.me/5571988339502" target="_blank" style={{ fontWeight: '700', color: 'hsl(var(--primary))', textDecoration: 'none' }}>71 98833-9502</a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.6 }}>E-mail:</span>
                    <span style={{ fontWeight: '500' }}>lucianoxote@hotmail.com</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSupport(false)}
                  style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.7rem', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>Mudar Minha Senha</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label">Senha Atual</label>
              <input 
                type="password" 
                className="form-input" 
                style={{ fontSize: '0.875rem' }}
                value={passwords.current}
                onChange={e => setPasswords({...passwords, current: e.target.value})}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label">Nova Senha</label>
              <input 
                type="password" 
                className="form-input" 
                style={{ fontSize: '0.875rem' }}
                value={passwords.new}
                onChange={e => setPasswords({...passwords, new: e.target.value})}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label">Confirmar Nova Senha</label>
              <input 
                type="password" 
                className="form-input" 
                style={{ fontSize: '0.875rem' }}
                value={passwords.confirm}
                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={changingPass}>
              {changingPass ? '...' : 'Atualizar Minha Senha'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>{t('Preferências do Sistema')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">{t('Tema Visual')}</label>
              <select 
                className="form-input" 
                value={localSettings.tema} 
                onChange={e => {
                  const newTema = e.target.value;
                  setLocalSettings({...localSettings, tema: newTema});
                  // Instant preview without waiting for save
                  setSettings({...settings, tema: newTema});
                }}
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
