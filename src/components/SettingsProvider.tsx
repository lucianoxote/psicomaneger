'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

type Settings = {
  nomeClinica: string;
  crp: string;
  tema: string;
  idioma: string;
  logoUrl?: string;
  tipoAtividade?: string;
  issRate?: number;
  uf?: string;
  cidade?: string;
  cidadeAtuacao?: string;
  regimeTributario?: string;
};

type SettingsContextType = {
  settings: Settings;
  setSettings: (s: Settings) => void;
  refreshSettings: () => Promise<void>;
  t: (key: string) => string;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<string, Record<string, string>> = {
  'Português (Brasil)': {
    'Dashboard': 'Painel Clínico',
    'Pacientes': 'Pacientes',
    'Prontuários': 'Prontuários',
    'Agendamento': 'Agenda',
    'Financeiro': 'Financeiro',
    'Documentos': 'Documentos',
    'Tarefas': 'Tarefas',
    'Família': 'Família',
    'Configurações': 'Configurações',
    'Salvar Alterações': 'Salvar Alterações',
    'Nome da Clínica / Profissional': 'Nome da Clínica / Profissional',
    'Registro Profissional (CRP)': 'Registro Profissional (CRP)',
    'Tema Visual': 'Tema Visual',
    'Idioma': 'Idioma'
  },
  'English': {
    'Dashboard': 'Clinical Panel',
    'Pacientes': 'Patients',
    'Prontuários': 'Records',
    'Agendamento': 'Schedule',
    'Financeiro': 'Finance',
    'Documentos': 'Documents',
    'Tarefas': 'Tasks',
    'Família': 'Family',
    'Configurações': 'Settings',
    'Salvar Alterações': 'Save Changes',
    'Nome da Clínica / Profissional': 'Clinic / Professional Name',
    'Registro Profissional (CRP)': 'Professional ID (CRP)',
    'Tema Visual': 'Visual Theme',
    'Idioma': 'Language'
  }
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [settings, setSettingsState] = useState<Settings>({
    nomeClinica: 'SynaPSIS',
    crp: '',
    tema: 'Tema Claro (Premium)',
    idioma: 'Português (Brasil)',
    tipoAtividade: 'CPF',
    issRate: 5,
    uf: 'BA',
    cidade: 'Lauro de Freitas',
    cidadeAtuacao: 'Lauro de Freitas-BA',
    regimeTributario: 'Anexo III'
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/configuracoes', { cache: 'no-store' });
      const data = await res.json();
      if (data && !data.error) {
        setSettingsState(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const applyTheme = (theme: string) => {
        if (theme === 'Tema Escuro') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'Tema Claro' || theme === 'Tema Claro (Premium)') {
          document.documentElement.classList.remove('dark');
        } else if (theme === 'Automático (Sistema)') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };

      applyTheme(settings.tema);
    }
  }, [settings.tema]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, session]);

  const t = (key: string) => {
    return translations[settings.idioma]?.[key] || key;
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings: setSettingsState, refreshSettings: fetchSettings, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
