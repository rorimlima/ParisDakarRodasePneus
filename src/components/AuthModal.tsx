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
import { AuthError, authService, isAuthConfigured } from '../services/authService';

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
  const [adminSubmitting, setAdminSubmitting] = useState(false);
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
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!adminEmail.trim() || !adminPassword) {
      setErrorMsg('Informe e-mail e senha.');
      return;
    }

    setAdminSubmitting(true);
    try {
      // A verificação acontece no Firebase. O app não conhece nenhuma senha.
      const adminUser = await authService.signInAdmin(adminEmail, adminPassword);

      setAdminPassword('');
      setSuccessMsg('Acesso autorizado.');
      const session: UserSession = { type: 'admin', adminUser };
      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 500);
    } catch (error) {
      setErrorMsg(
        error instanceof AuthError ? error.message : 'Não foi possível concluir o login.'
      );
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleLogout = () => {
    // Sessão de admin vive no Firebase; limpar só o localStorage não desloga.
    void authService.signOut();
    storageService.clearUserSession();
    onLoginSuccess({ type: null });
    setSuccessMsg('Sessão encerrada com sucesso.');
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pd-overlay-bg pd-anim-rise overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-xl pd-surface rounded-2xl border pd-border shadow-2xl my-4 sm:my-8 overflow-hidden pd-text">

        {/* Header Title */}
        <div className="p-4 sm:p-6 pd-bg-alt border-b pd-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#8B0000] rounded flex items-center justify-center font-black italic text-xs text-white">
              PD
            </div>
            <div>
              <h2 className="text-base font-black uppercase italic tracking-wider pd-text">
                Central de Acesso Paris Dakar
              </h2>
              <p className="text-[11px] pd-text-2">
                Selecione seu perfil de cliente ou acesse o painel administrativo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full pd-surface-2 pd-text-2 transition border pd-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Active Banner if logged in */}
        {currentSession.type && (
          <div className="bg-emerald-950/60 border-b border-emerald-800/60 p-4 flex items-center justify-between text-xs pd-success-text">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 pd-success-text shrink-0" />
              <span>
                Sessão Ativa: <strong>{currentSession.type.toUpperCase()}</strong> -{' '}
                {currentSession.b2cUser?.fullName || currentSession.b2bUser?.companyName || currentSession.adminUser?.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-950 pd-brand-text hover:bg-red-900 rounded font-bold uppercase text-[10px] transition"
            >
              Sair
            </button>
          </div>
        )}

        {/* 3 Major Category Tabs */}
        <div className="grid grid-cols-3 border-b pd-border pd-page">
          {/* Tab 1: CPF */}
          <button
            onClick={() => handleTabSwitch('b2c')}
            className={`py-3 px-2 text-center text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'b2c'
                ? 'border-[#8B0000] pd-text pd-surface'
                : 'border-transparent pd-text-3'
            }`}
          >
            <User className="w-4 h-4 pd-info-text" />
            <span>Cliente CPF</span>
          </button>

          {/* Tab 2: CNPJ */}
          <button
            onClick={() => handleTabSwitch('b2b')}
            className={`py-3 px-2 text-center text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'b2b'
                ? 'border-[#8B0000] pd-text pd-surface'
                : 'border-transparent pd-text-3'
            }`}
          >
            <Building2 className="w-4 h-4 pd-gold-text" />
            <span>Lojista CNPJ</span>
          </button>

          {/* Tab 3: Admin */}
          <button
            onClick={() => handleTabSwitch('admin')}
            className={`py-3 px-2 text-center text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'border-[#8B0000] pd-text pd-surface'
                : 'border-transparent pd-text-3'
            }`}
          >
            <Lock className="w-4 h-4 pd-brand-text" />
            <span>Painel Admin</span>
          </button>
        </div>

        {/* Body Form Content */}
        <div className="p-4 sm:p-6 space-y-5">
          
          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 pd-brand-text" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 pd-success-text" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CLIENTE FINAL (CPF) */}
          {activeTab === 'b2c' && (
            <div>
              {/* Toggle Login vs Register */}
              <div className="flex pd-page p-1 rounded border pd-border mb-5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'login' ? 'pd-surface-2 pd-text' : 'pd-text-3'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'register' ? 'pd-surface-2 pd-text' : 'pd-text-3'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Criar Conta CPF
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleCpfLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      CPF ou E-mail do Cliente
                    </label>
                    <input
                      type="text"
                      value={cpfLoginInput}
                      onChange={(e) => setCpfLoginInput(e.target.value)}
                      placeholder="000.000.000-00 ou seu@email.com"
                      className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={cpfPassword}
                      onChange={(e) => setCpfPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none focus:border-[#8B0000]"
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
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={cpfFullName}
                      onChange={(e) => setCpfFullName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silva"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                        CPF (11 dígitos) *
                      </label>
                      <input
                        type="text"
                        value={cpfValue}
                        onChange={(e) => setCpfValue(formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={cpfPhone}
                        onChange={(e) => setCpfPhone(e.target.value)}
                        placeholder="(11) 99999-0000"
                        className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={cpfEmail}
                      onChange={(e) => setCpfEmail(e.target.value)}
                      placeholder="carlos@email.com"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={cpfAddress}
                        onChange={(e) => setCpfAddress(e.target.value)}
                        placeholder="Rua, Número, Bairro"
                        className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={cpfCep}
                        onChange={(e) => setCpfCep(e.target.value)}
                        placeholder="00000-000"
                        className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Senha de Acesso *
                    </label>
                    <input
                      type="password"
                      value={cpfRegPassword}
                      onChange={(e) => setCpfRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
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
              <div className="flex pd-page p-1 rounded border pd-border mb-5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'login' ? 'pd-surface-2 pd-text' : 'pd-text-3'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar B2B
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'register' ? 'pd-surface-2 pd-text' : 'pd-text-3'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Cadastro Lojista CNPJ
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleCnpjLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      CNPJ (Numérico ou Alfanumérico) ou E-mail Corporativo
                    </label>
                    <input
                      type="text"
                      value={cnpjLoginInput}
                      onChange={(e) => setCnpjLoginInput(e.target.value)}
                      placeholder="12.345.678/0001-90 ou 12.ABC.345/0001-89"
                      className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Senha Corporativa B2B
                    </label>
                    <input
                      type="password"
                      value={cnpjPassword}
                      onChange={(e) => setCnpjPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none focus:border-[#8B0000]"
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
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Dakar Auto Center e Oficinas LTDA"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                        Nome Fantasia
                      </label>
                      <input
                        type="text"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        placeholder="Ex: Dakar Off-Road SP"
                        className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest pd-gold-text block mb-1 flex items-center justify-between">
                        <span>CNPJ (Numérico / Alfanumérico) *</span>
                      </label>
                      <input
                        type="text"
                        value={cnpjValue}
                        onChange={(e) => setCnpjValue(formatCNPJ(e.target.value))}
                        placeholder="12.345.678/0001-90 ou 12.ABC.345/0001-89"
                        className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                      />
                      {cnpjValue && isAlphanumericCNPJ(cnpjValue) && (
                        <span className="text-[9px] pd-gold-text block mt-0.5 font-bold">
                          ✓ Formato Alfanumérico Receita Federal Detectado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* EXIGÊNCIA DE REGIME TRIBUTÁRIO */}
                  <div className="p-3 pd-surface-2 rounded border border-amber-500/30">
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-gold-text block mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Regime Tributário (Exigência Obrigatória) *
                    </label>
                    <select
                      value={taxRegime}
                      onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
                      className="w-full px-3 py-2 rounded pd-page border pd-border text-xs pd-text focus:border-[#8B0000] outline-none"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                      <option value="MEI (Microempreendedor Individual)">MEI (Microempreendedor Individual)</option>
                    </select>
                    <span className="text-[9px] pd-text-2 block mt-1">
                      Necessário para cálculo automático de tributação (ST / DIFAL) em faturamento B2B.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                        Inscrição Estadual (IE)
                      </label>
                      <input
                        type="text"
                        value={stateRegistration}
                        onChange={(e) => setStateRegistration(e.target.value)}
                        placeholder="Ex: 112.334.556.778 ou Isento"
                        className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                        Telefone / WhatsApp *
                      </label>
                      <input
                        type="text"
                        value={cnpjPhone}
                        onChange={(e) => setCnpjPhone(e.target.value)}
                        placeholder="(11) 98888-7777"
                        className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      type="email"
                      value={cnpjEmail}
                      onChange={(e) => setCnpjEmail(e.target.value)}
                      placeholder="compras@dakaroffroad.com.br"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Endereço Completo do Auto Center / Oficina
                    </label>
                    <input
                      type="text"
                      value={cnpjAddress}
                      onChange={(e) => setCnpjAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - Estado"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Senha de Acesso B2B *
                    </label>
                    <input
                      type="password"
                      value={cnpjRegPassword}
                      onChange={(e) => setCnpjRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
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
              <div className="p-4 pd-surface-2 border pd-border rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 pd-brand-text font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acesso restrito</span>
                </div>
                <p className="pd-text-2 leading-relaxed">
                  Área de gestão do catálogo. O acesso é individual e registrado.
                </p>
              </div>

              {!isAuthConfigured && (
                <div className="p-3 pd-surface-2 border pd-border rounded-lg text-xs pd-text-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 pd-brand-text shrink-0 mt-0.5" />
                  <span>
                    Login administrativo indisponível: este build não recebeu as variáveis
                    <strong className="pd-mono"> VITE_FIREBASE_*</strong>.
                  </span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="pd-label" htmlFor="admin-email">
                    E-mail
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="pd-input"
                    disabled={!isAuthConfigured || adminSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="pd-label" htmlFor="admin-password">
                    Senha
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pd-input"
                    disabled={!isAuthConfigured || adminSubmitting}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={!isAuthConfigured || adminSubmitting}
                >
                  <KeyRound className="w-4 h-4" />
                  {adminSubmitting ? 'Verificando...' : 'Entrar'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
