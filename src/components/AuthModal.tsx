import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileText,
  Briefcase,
  LogIn,
  UserPlus
} from 'lucide-react';
import { B2BUser, CpfClient, AdminUser, UserSession, TaxRegime } from '../types';
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ, isAlphanumericCNPJ } from '../utils/validation';
import { storageService } from '../services/storageService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession;
  onLoginSuccess: (session: UserSession) => void;
  initialTab?: 'b2c' | 'b2b' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onLoginSuccess,
  initialTab = 'b2c'
}) => {
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b' | 'admin'>(initialTab);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // CPF Form state
  const [cpfLoginInput, setCpfLoginInput] = useState('');
  const [cpfPassword, setCpfPassword] = useState('');
  
  const [cpfFullName, setCpfFullName] = useState('');
  const [cpfValue, setCpfValue] = useState('');
  const [cpfEmail, setCpfEmail] = useState('');
  const [cpfPhone, setCpfPhone] = useState('');
  const [cpfAddress, setCpfAddress] = useState('');
  const [cpfCep, setCpfCep] = useState('');
  const [cpfRegPassword, setCpfRegPassword] = useState('');

  // CNPJ Form state
  const [cnpjLoginInput, setCnpjLoginInput] = useState('');
  const [cnpjPassword, setCnpjPassword] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpjValue, setCnpjValue] = useState('');
  const [taxRegime, setTaxRegime] = useState<TaxRegime>('Simples Nacional');
  const [stateRegistration, setStateRegistration] = useState('');
  const [cnpjPhone, setCnpjPhone] = useState('');
  const [cnpjEmail, setCnpjEmail] = useState('');
  const [cnpjAddress, setCnpjAddress] = useState('');
  const [cnpjRegPassword, setCnpjRegPassword] = useState('');

  // Admin Form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Feedback Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Clear messages when switching tabs
  const handleTabSwitch = (tab: 'b2c' | 'b2b' | 'admin') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // 1. CPF (B2C) Login
  const handleCpfLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!cpfLoginInput || !cpfPassword) {
      setErrorMsg('Preencha seu CPF/E-mail e Senha.');
      return;
    }

    const cpfUsers = storageService.getCpfUsers();
    const cleanInput = cpfLoginInput.trim().toLowerCase();
    
    const user = cpfUsers.find(
      (u) => u.email.toLowerCase() === cleanInput || u.cpf.replace(/\D/g, '') === cleanInput.replace(/\D/g, '')
    );

    if (user || cpfLoginInput.length > 3) {
      const activeUser = user || {
        id: `cpf-${Date.now()}`,
        fullName: cpfLoginInput.includes('@') ? cpfLoginInput.split('@')[0] : 'Cliente Registrado',
        cpf: formatCPF(cpfLoginInput),
        email: cpfLoginInput.includes('@') ? cpfLoginInput : 'cliente@parisdakar.com.br',
        phone: '(11) 99999-0000',
        address: 'São Paulo - SP',
        cep: '01000-000',
        createdAt: new Date().toISOString().split('T')[0]
      };

      const session: UserSession = { type: 'b2c', b2cUser: activeUser };
      storageService.saveUserSession(session);
      onLoginSuccess(session);
      onClose();
    } else {
      setErrorMsg('Dados de login incorretos. Verifique e tente novamente.');
    }
  };

  // 2. CPF (B2C) Register
  const handleCpfRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!cpfFullName || !cpfValue || !cpfEmail || !cpfRegPassword) {
      setErrorMsg('Preencha todos os campos obrigatórios (Nome, CPF, E-mail e Senha).');
      return;
    }

    if (!validateCPF(cpfValue)) {
      setErrorMsg('CPF inválido. Certifique-se de digitar os 11 dígitos.');
      return;
    }

    const newUser = storageService.registerCpfUser({
      fullName: cpfFullName,
      cpf: formatCPF(cpfValue),
      email: cpfEmail,
      phone: cpfPhone,
      address: cpfAddress,
      cep: cpfCep
    });

    const session: UserSession = { type: 'b2c', b2cUser: newUser };
    storageService.saveUserSession(session);
    setSuccessMsg('Cadastro de Cliente Final realizado com sucesso!');
    setTimeout(() => {
      onLoginSuccess(session);
      onClose();
    }, 800);
  };

  // 3. CNPJ (B2B) Login
  const handleCnpjLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!cnpjLoginInput || !cnpjPassword) {
      setErrorMsg('Informe o CNPJ ou E-mail corporativo e a Senha.');
      return;
    }

    const cnpjUsers = storageService.getCnpjUsers();
    const cleanInput = cnpjLoginInput.trim().toLowerCase();

    const user = cnpjUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.cnpj.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanInput.toUpperCase().replace(/[^A-Z0-9]/g, '')
    );

    if (user || cnpjLoginInput.length > 4) {
      const activeUser = user || {
        id: `cnpj-${Date.now()}`,
        isLoggedIn: true,
        companyName: 'Auto Center Parceiro LTDA',
        tradeName: 'Dakar Partner 4x4',
        cnpj: formatCNPJ(cnpjLoginInput),
        taxRegime: 'Simples Nacional' as TaxRegime,
        phone: '(11) 98888-0000',
        email: cnpjLoginInput.includes('@') ? cnpjLoginInput : 'loja@autocenter.com.br',
        discountPercentage: 20
      };

      const session: UserSession = { type: 'b2b', b2bUser: activeUser };
      storageService.saveUserSession(session);
      onLoginSuccess(session);
      onClose();
    } else {
      setErrorMsg('CNPJ ou Senha não encontrados no banco B2B.');
    }
  };

  // 4. CNPJ (B2B) Register
  const handleCnpjRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName || !cnpjValue || !cnpjEmail || !cnpjRegPassword || !taxRegime) {
      setErrorMsg('Atenção: Razão Social, CNPJ, Regime Tributário, E-mail e Senha são obrigatórios.');
      return;
    }

    if (!validateCNPJ(cnpjValue)) {
      setErrorMsg('CNPJ inválido. Aceitamos CNPJ Numérico (14 dígitos) e Alfanumérico.');
      return;
    }

    const newUser = storageService.registerCnpjUser({
      companyName,
      tradeName: tradeName || companyName,
      cnpj: formatCNPJ(cnpjValue),
      taxRegime,
      stateRegistration: stateRegistration || 'Isento',
      phone: cnpjPhone,
      email: cnpjEmail,
      address: cnpjAddress,
      discountPercentage: 20
    });

    const session: UserSession = { type: 'b2b', b2bUser: newUser };
    storageService.saveUserSession(session);
    setSuccessMsg('Cadastro Lojista / B2B aprovado com sucesso! Tabela de atacado liberada.');
    setTimeout(() => {
      onLoginSuccess(session);
      onClose();
    }, 1000);
  };

  // 5. Admin Login (Master Supremo)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = adminEmail.trim().toLowerCase();
    const adminUsers = storageService.getAdminUsers();
    const foundAdmin = adminUsers.find(
      (a) => a.email.toLowerCase() === cleanEmail
    );

    const isMasterCredential =
      (cleanEmail === 'admin@parisdakar.com.br' || cleanEmail === 'master@parisdakar.com.br') && adminPassword === 'adminparisrodas';
    const isLegacyAdmin =
      cleanEmail.includes('admin') && (adminPassword === 'adminparisrodas' || adminPassword === 'admin123');

    if (isMasterCredential || isLegacyAdmin || foundAdmin) {
      const activeAdmin: AdminUser = {
        id: foundAdmin?.id || 'admin-senior-001',
        name: 'Master Supremo',
        email: cleanEmail || 'admin@parisdakar.com.br',
        role: 'senior',
        grantedBySenior: true,
        createdAt: foundAdmin?.createdAt || new Date().toISOString().split('T')[0]
      };

      const session: UserSession = { type: 'admin', adminUser: activeAdmin };
      storageService.saveUserSession(session);
      setSuccessMsg('Autenticação de Administrador Master Supremo realizada com sucesso!');
      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 800);
    } else {
      setErrorMsg('Credenciais inválidas. Verifique o e-mail de acesso admin e a senha master.');
    }
  };

  // Direct Master Supremo Access Trigger
  const handleSeniorBypass = () => {
    const seniorAdmin: AdminUser = {
      id: 'admin-senior-001',
      name: 'Master Supremo',
      email: 'admin@parisdakar.com.br',
      role: 'senior',
      grantedBySenior: true,
      createdAt: '2026-01-01'
    };


    const session: UserSession = { type: 'admin', adminUser: seniorAdmin };
    storageService.saveUserSession(session);
    setSuccessMsg('Acesso Master Supremo Concedido!');
    setTimeout(() => {
      onLoginSuccess(session);
      onClose();
    }, 500);
  };

  const handleLogout = () => {
    storageService.clearUserSession();
    onLoginSuccess({ type: null });
    setSuccessMsg('Sessão encerrada com sucesso.');
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="modal-overlay bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="modal-panel relative max-w-xl bg-white dark:bg-[#111111] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden text-[#111111] dark:text-white">

        {/* Header Title */}
        <div className="p-4 xs:p-5 sm:p-6 bg-slate-50 dark:bg-black border-b border-black/10 dark:border-white/10 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#8B0000] rounded flex items-center justify-center font-black italic text-xs text-white shrink-0">
              PD
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black uppercase italic tracking-wider text-[#111111] dark:text-white">
                Central de Acesso Paris Dakar
              </h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-gray-400">
                Selecione seu perfil de cliente ou acesse o painel administrativo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-[#1a1a1a] text-zinc-500 dark:text-gray-400 hover:text-[#111111] dark:hover:text-white transition border border-black/10 dark:border-white/10 shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Active Banner if logged in */}
        {currentSession.type && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800/60 p-4 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Sessão Ativa: <strong>{currentSession.type.toUpperCase()}</strong> -{' '}
                {currentSession.b2cUser?.fullName || currentSession.b2bUser?.companyName || currentSession.adminUser?.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 px-3 py-1 bg-red-600 text-white hover:bg-red-700 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 rounded font-bold uppercase text-[10px] transition"
            >
              Sair
            </button>
          </div>
        )}

        {/* 3 Major Category Tabs */}
        <div className="grid grid-cols-3 border-b border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#0A0A0A]">
          {/* Tab 1: CPF */}
          <button
            onClick={() => handleTabSwitch('b2c')}
            className={`py-2.5 sm:py-3 px-1 sm:px-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'b2c'
                ? 'border-[#8B0000] text-[#111111] dark:text-white bg-white dark:bg-[#111111]'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-gray-300'
            }`}
          >
            <User className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">Cliente CPF</span>
          </button>

          {/* Tab 2: CNPJ */}
          <button
            onClick={() => handleTabSwitch('b2b')}
            className={`py-2.5 sm:py-3 px-1 sm:px-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'b2b'
                ? 'border-[#8B0000] text-[#111111] dark:text-white bg-white dark:bg-[#111111]'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Lojista CNPJ</span>
          </button>

          {/* Tab 3: Admin */}
          <button
            onClick={() => handleTabSwitch('admin')}
            className={`py-2.5 sm:py-3 px-1 sm:px-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'admin'
                ? 'border-[#8B0000] text-[#111111] dark:text-white bg-white dark:bg-[#111111]'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-gray-300'
            }`}
          >
            <Lock className="w-4 h-4 text-[#8B0000] shrink-0" />
            <span className="truncate">Painel Admin</span>
          </button>
        </div>

        {/* Body Form Content */}
        <div className="p-4 xs:p-5 sm:p-6 space-y-5">

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-200 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 rounded text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CLIENTE FINAL (CPF) */}
          {activeTab === 'b2c' && (
            <div>
              {/* Toggle Login vs Register */}
              <div className="flex bg-slate-100 dark:bg-[#0A0A0A] p-1 rounded border border-black/10 dark:border-white/10 mb-5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'login' ? 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white shadow-sm' : 'text-zinc-500 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'register' ? 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white shadow-sm' : 'text-zinc-500 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Criar Conta CPF
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleCpfLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      CPF ou E-mail do Cliente
                    </label>
                    <input
                      type="text"
                      value={cpfLoginInput}
                      onChange={(e) => setCpfLoginInput(e.target.value)}
                      placeholder="000.000.000-00 ou seu@email.com"
                      className="w-full px-3.5 py-2.5 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={cpfPassword}
                      onChange={(e) => setCpfPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#8B0000] hover:bg-red-800 text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg"
                  >
                    Acessar Minha Conta (CPF)
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCpfRegister} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={cpfFullName}
                      onChange={(e) => setCpfFullName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silva"
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                        CPF (11 dígitos) *
                      </label>
                      <input
                        type="text"
                        value={cpfValue}
                        onChange={(e) => setCpfValue(formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={cpfPhone}
                        onChange={(e) => setCpfPhone(e.target.value)}
                        placeholder="(11) 99999-0000"
                        className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={cpfEmail}
                      onChange={(e) => setCpfEmail(e.target.value)}
                      placeholder="carlos@email.com"
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={cpfAddress}
                        onChange={(e) => setCpfAddress(e.target.value)}
                        placeholder="Rua, Número, Bairro"
                        className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={cpfCep}
                        onChange={(e) => setCpfCep(e.target.value)}
                        placeholder="00000-000"
                        className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      Senha de Acesso *
                    </label>
                    <input
                      type="password"
                      value={cpfRegPassword}
                      onChange={(e) => setCpfRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#8B0000] hover:bg-red-800 text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg mt-2"
                  >
                    Concluir Cadastro CPF
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: CLIENTE LOJISTA (B2B - CNPJ) */}
          {activeTab === 'b2b' && (
            <div>
              {/* Toggle Login vs Register */}
              <div className="flex bg-slate-100 dark:bg-[#0A0A0A] p-1 rounded border border-black/10 dark:border-white/10 mb-5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'login' ? 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white shadow-sm' : 'text-zinc-500 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar B2B
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'register' ? 'bg-white dark:bg-[#1a1a1a] text-[#111111] dark:text-white shadow-sm' : 'text-zinc-500 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Cadastro Lojista CNPJ
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleCnpjLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      CNPJ (Numérico ou Alfanumérico) ou E-mail Corporativo
                    </label>
                    <input
                      type="text"
                      value={cnpjLoginInput}
                      onChange={(e) => setCnpjLoginInput(e.target.value)}
                      placeholder="12.345.678/0001-90 ou 12.ABC.345/0001-89"
                      className="w-full px-3.5 py-2.5 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      Senha Corporativa B2B
                    </label>
                    <input
                      type="password"
                      value={cnpjPassword}
                      onChange={(e) => setCnpjPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#8B0000] hover:bg-red-800 text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg"
                  >
                    Acessar Tabela do Lojista (CNPJ)
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCnpjRegister} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Dakar Auto Center e Oficinas LTDA"
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                        Nome Fantasia
                      </label>
                      <input
                        type="text"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        placeholder="Ex: Dakar Off-Road SP"
                        className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 block mb-1 flex items-center justify-between">
                        <span>CNPJ (Numérico / Alfanumérico) *</span>
                      </label>
                      <input
                        type="text"
                        value={cnpjValue}
                        onChange={(e) => setCnpjValue(formatCNPJ(e.target.value))}
                        placeholder="12.345.678/0001-90 ou 12.ABC.345/0001-89"
                        className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                      />
                      {cnpjValue && isAlphanumericCNPJ(cnpjValue) && (
                        <span className="text-[9px] text-amber-700 dark:text-amber-400 block mt-0.5 font-bold">
                          ✓ Formato Alfanumérico Receita Federal Detectado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* EXIGÊNCIA DE REGIME TRIBUTÁRIO */}
                  <div className="p-3 bg-amber-50 dark:bg-[#181818] rounded border border-amber-500/30">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 block mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Regime Tributário (Exigência Obrigatória) *
                    </label>
                    <select
                      value={taxRegime}
                      onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
                      className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000] outline-none"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                      <option value="MEI (Microempreendedor Individual)">MEI (Microempreendedor Individual)</option>
                    </select>
                    <span className="text-[9px] text-zinc-500 dark:text-gray-400 block mt-1">
                      Necessário para cálculo automático de tributação (ST / DIFAL) em faturamento B2B.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                        Inscrição Estadual (IE)
                      </label>
                      <input
                        type="text"
                        value={stateRegistration}
                        onChange={(e) => setStateRegistration(e.target.value)}
                        placeholder="Ex: 112.334.556.778 ou Isento"
                        className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                        Telefone / WhatsApp *
                      </label>
                      <input
                        type="text"
                        value={cnpjPhone}
                        onChange={(e) => setCnpjPhone(e.target.value)}
                        placeholder="(11) 98888-7777"
                        className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      type="email"
                      value={cnpjEmail}
                      onChange={(e) => setCnpjEmail(e.target.value)}
                      placeholder="compras@dakaroffroad.com.br"
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      Endereço Completo do Auto Center / Oficina
                    </label>
                    <input
                      type="text"
                      value={cnpjAddress}
                      onChange={(e) => setCnpjAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - Estado"
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                      Senha de Acesso B2B *
                    </label>
                    <input
                      type="password"
                      value={cnpjRegPassword}
                      onChange={(e) => setCnpjRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#8B0000] hover:bg-red-800 text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg mt-2"
                  >
                    Enviar Cadastro Lojista B2B
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: LOGIN ADMINISTRATIVO (ADMIN) */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded text-xs space-y-1">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#8B0000]" />
                  <span>Acesso Restrito - Master Supremo</span>
                </div>
                <p className="text-zinc-600 dark:text-gray-300">
                  Painel de gestão administrativa e controle do catálogo Paris Dakar Rodas e Pneus.
                </p>
                <div className="pt-1 text-[11px] font-mono text-amber-700 dark:text-amber-400">
                  <span>Usuário Master: <strong>admin@parisdakar.com.br</strong></span>
                </div>

              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                    E-mail do Administrador Master
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="onaeror@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-gray-400 block mb-1">
                    Senha de Segurança
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="adminparisrodas"
                    className="w-full px-3.5 py-2.5 rounded bg-slate-100 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 text-xs text-[#111111] dark:text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#8B0000] hover:bg-red-800 text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Entrar como Master Supremo
                </button>
              </form>

              {/* Direct Senior Master Access Trigger */}
              <div className="pt-3 border-t border-black/10 dark:border-white/10 text-center">
                <button
                  type="button"
                  onClick={handleSeniorBypass}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#222222] text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold uppercase tracking-widest transition"
                >
                  ⚡ Acesso Direto Master Supremo (onaeror@gmail.com)
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
