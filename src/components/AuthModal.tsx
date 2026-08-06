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
import { UserSession, TaxRegime } from '../types';
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ, isAlphanumericCNPJ } from '../utils/validation';
import {
  describeAuthError,
  loginAsAdmin,
  loginWithEmail,
  logout,
  registerB2BAccount,
  registerB2CClient,
  requestPasswordReset,
} from '../services/authService';
import { FIREBASE_NOT_CONFIGURED_MESSAGE, isFirebaseConfigured } from '../config/firebaseClient';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Clear messages when switching tabs
  const handleTabSwitch = (tab: 'b2c' | 'b2b' | 'admin') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Executa uma ação de autenticação tratando carregamento, erro e fechamento do modal.
  const runAuthAction = async (
    action: () => Promise<UserSession>,
    message: string,
    delay = 700
  ) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!isFirebaseConfigured) {
      setErrorMsg(FIREBASE_NOT_CONFIGURED_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await action();
      setSuccessMsg(message);
      window.setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, delay);
    } catch (error) {
      setErrorMsg(describeAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. CPF (B2C) Login — Firebase Auth (e-mail + senha)
  const handleCpfLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cpfLoginInput || !cpfPassword) {
      setErrorMsg('Preencha seu e-mail e a senha.');
      return;
    }

    await runAuthAction(
      () => loginWithEmail(cpfLoginInput, cpfPassword),
      'Login realizado com sucesso. Bem-vindo de volta!'
    );
  };

  // 2. CPF (B2C) Register — cria a conta no Firebase Auth e o perfil em clients/{uid}
  const handleCpfRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cpfFullName || !cpfValue || !cpfEmail || !cpfRegPassword) {
      setErrorMsg('Preencha todos os campos obrigatórios (Nome, CPF, E-mail e Senha).');
      return;
    }

    if (!validateCPF(cpfValue)) {
      setErrorMsg('CPF inválido. Certifique-se de digitar os 11 dígitos.');
      return;
    }

    if (cpfRegPassword.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    await runAuthAction(
      () =>
        registerB2CClient({
          fullName: cpfFullName,
          cpf: formatCPF(cpfValue),
          email: cpfEmail,
          password: cpfRegPassword,
          phone: cpfPhone,
          address: cpfAddress,
          cep: cpfCep,
        }),
      'Cadastro de Cliente Final realizado com sucesso!',
      900
    );
  };

  // 3. CNPJ (B2B) Login — Firebase Auth (e-mail corporativo + senha)
  const handleCnpjLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cnpjLoginInput || !cnpjPassword) {
      setErrorMsg('Informe o e-mail corporativo e a senha.');
      return;
    }

    await runAuthAction(
      () => loginWithEmail(cnpjLoginInput, cnpjPassword),
      'Acesso Lojista liberado.'
    );
  };

  // 4. CNPJ (B2B) Register — conta nasce pendente de aprovação, sem desconto
  const handleCnpjRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !cnpjValue || !cnpjEmail || !cnpjRegPassword || !taxRegime) {
      setErrorMsg('Atenção: Razão Social, CNPJ, Regime Tributário, E-mail e Senha são obrigatórios.');
      return;
    }

    if (!validateCNPJ(cnpjValue)) {
      setErrorMsg('CNPJ inválido. Aceitamos CNPJ Numérico (14 dígitos) e Alfanumérico.');
      return;
    }

    if (cnpjRegPassword.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    await runAuthAction(
      () =>
        registerB2BAccount({
          companyName,
          tradeName: tradeName || companyName,
          cnpj: formatCNPJ(cnpjValue),
          taxRegime,
          stateRegistration: stateRegistration || 'Isento',
          phone: cnpjPhone,
          email: cnpjEmail,
          password: cnpjRegPassword,
          address: cnpjAddress,
        }),
      'Cadastro enviado! A tabela de atacado é liberada assim que um administrador aprovar a conta.',
      1200
    );
  };

  // 5. Admin Login — exige o Custom Claim `role: admin` no token do Firebase
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminEmail || !adminPassword) {
      setErrorMsg('Informe o e-mail e a senha de administrador.');
      return;
    }

    await runAuthAction(
      () => loginAsAdmin(adminEmail, adminPassword),
      'Autenticação de administrador confirmada.'
    );
  };

  // Recuperação de senha por e-mail (Firebase Auth)
  const handlePasswordReset = async (email: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!isFirebaseConfigured) {
      setErrorMsg(FIREBASE_NOT_CONFIGURED_MESSAGE);
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Digite o e-mail da conta para receber o link de redefinição.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSuccessMsg(`Enviamos um link de redefinição de senha para ${email.trim()}.`);
    } catch (error) {
      setErrorMsg(describeAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setErrorMsg('');
    try {
      await logout();
      onLoginSuccess({ type: null });
      setSuccessMsg('Sessão encerrada com sucesso.');
      window.setTimeout(() => onClose(), 600);
    } catch (error) {
      setErrorMsg(describeAuthError(error));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#111111] rounded-2xl border border-white/10 shadow-2xl my-8 overflow-hidden text-white">
        
        {/* Header Title */}
        <div className="p-6 bg-black border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#8B0000] rounded flex items-center justify-center font-black italic text-xs text-white">
              PD
            </div>
            <div>
              <h2 className="text-base font-black uppercase italic tracking-wider text-white">
                Central de Acesso Paris Dakar
              </h2>
              <p className="text-[11px] text-gray-400">
                Selecione seu perfil de cliente ou acesse o painel administrativo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#1a1a1a] text-gray-400 hover:text-white transition border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Active Banner if logged in */}
        {currentSession.type && (
          <div className="bg-emerald-950/60 border-b border-emerald-800/60 p-4 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Sessão Ativa: <strong>{currentSession.type.toUpperCase()}</strong> -{' '}
                {currentSession.b2cUser?.fullName || currentSession.b2bUser?.companyName || currentSession.adminUser?.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-950 text-red-300 hover:bg-red-900 rounded font-bold uppercase text-[10px] transition"
            >
              Sair
            </button>
          </div>
        )}

        {/* 3 Major Category Tabs */}
        <div className="grid grid-cols-3 border-b border-white/10 bg-[#0A0A0A]">
          {/* Tab 1: CPF */}
          <button
            onClick={() => handleTabSwitch('b2c')}
            className={`py-3 px-2 text-center text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'b2c'
                ? 'border-[#8B0000] text-white bg-[#111111]'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <User className="w-4 h-4 text-sky-400" />
            <span>Cliente CPF</span>
          </button>

          {/* Tab 2: CNPJ */}
          <button
            onClick={() => handleTabSwitch('b2b')}
            className={`py-3 px-2 text-center text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'b2b'
                ? 'border-[#8B0000] text-white bg-[#111111]'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Lojista CNPJ</span>
          </button>

          {/* Tab 3: Admin */}
          <button
            onClick={() => handleTabSwitch('admin')}
            className={`py-3 px-2 text-center text-xs font-bold uppercase tracking-wider transition border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'border-[#8B0000] text-white bg-[#111111]'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Lock className="w-4 h-4 text-[#8B0000]" />
            <span>Painel Admin</span>
          </button>
        </div>

        {/* Body Form Content */}
        <div className="p-6 space-y-5">

          {!isFirebaseConfigured && (
            <div className="p-3 bg-amber-950/70 border border-amber-700 text-amber-200 rounded text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{FIREBASE_NOT_CONFIGURED_MESSAGE}</span>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CLIENTE FINAL (CPF) */}
          {activeTab === 'b2c' && (
            <div>
              {/* Toggle Login vs Register */}
              <div className="flex bg-[#0A0A0A] p-1 rounded border border-white/10 mb-5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'login' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'register' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Criar Conta CPF
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleCpfLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      E-mail do Cliente
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={cpfLoginInput}
                      onChange={(e) => setCpfLoginInput(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={cpfPassword}
                      onChange={(e) => setCpfPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#8B0000] hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg"
                  >
                    {isSubmitting ? 'Entrando...' : 'Acessar Minha Conta (CPF)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePasswordReset(cpfLoginInput)}
                    disabled={isSubmitting}
                    className="w-full text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-300 transition"
                  >
                    Esqueci minha senha
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCpfRegister} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={cpfFullName}
                      onChange={(e) => setCpfFullName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silva"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        CPF (11 dígitos) *
                      </label>
                      <input
                        type="text"
                        value={cpfValue}
                        onChange={(e) => setCpfValue(formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={cpfPhone}
                        onChange={(e) => setCpfPhone(e.target.value)}
                        placeholder="(11) 99999-0000"
                        className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={cpfEmail}
                      onChange={(e) => setCpfEmail(e.target.value)}
                      placeholder="carlos@email.com"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={cpfAddress}
                        onChange={(e) => setCpfAddress(e.target.value)}
                        placeholder="Rua, Número, Bairro"
                        className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={cpfCep}
                        onChange={(e) => setCpfCep(e.target.value)}
                        placeholder="00000-000"
                        className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Senha de Acesso *
                    </label>
                    <input
                      type="password"
                      value={cpfRegPassword}
                      onChange={(e) => setCpfRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#8B0000] hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg mt-2"
                  >
                    {isSubmitting ? 'Criando conta...' : 'Concluir Cadastro CPF'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: CLIENTE LOJISTA (B2B - CNPJ) */}
          {activeTab === 'b2b' && (
            <div>
              {/* Toggle Login vs Register */}
              <div className="flex bg-[#0A0A0A] p-1 rounded border border-white/10 mb-5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'login' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar B2B
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                    mode === 'register' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Cadastro Lojista CNPJ
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleCnpjLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      E-mail Corporativo
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={cnpjLoginInput}
                      onChange={(e) => setCnpjLoginInput(e.target.value)}
                      placeholder="compras@suaempresa.com.br"
                      className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Senha Corporativa B2B
                    </label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={cnpjPassword}
                      onChange={(e) => setCnpjPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#8B0000] hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg"
                  >
                    {isSubmitting ? 'Entrando...' : 'Acessar Tabela do Lojista (CNPJ)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePasswordReset(cnpjLoginInput)}
                    disabled={isSubmitting}
                    className="w-full text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-300 transition"
                  >
                    Esqueci minha senha
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCnpjRegister} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Dakar Auto Center e Oficinas LTDA"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Nome Fantasia
                      </label>
                      <input
                        type="text"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        placeholder="Ex: Dakar Off-Road SP"
                        className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1 flex items-center justify-between">
                        <span>CNPJ (Numérico / Alfanumérico) *</span>
                      </label>
                      <input
                        type="text"
                        value={cnpjValue}
                        onChange={(e) => setCnpjValue(formatCNPJ(e.target.value))}
                        placeholder="12.345.678/0001-90 ou 12.ABC.345/0001-89"
                        className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                      />
                      {cnpjValue && isAlphanumericCNPJ(cnpjValue) && (
                        <span className="text-[9px] text-amber-400 block mt-0.5 font-bold">
                          ✓ Formato Alfanumérico Receita Federal Detectado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* EXIGÊNCIA DE REGIME TRIBUTÁRIO */}
                  <div className="p-3 bg-[#181818] rounded border border-amber-500/30">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Regime Tributário (Exigência Obrigatória) *
                    </label>
                    <select
                      value={taxRegime}
                      onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
                      className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-white/10 text-xs text-white focus:border-[#8B0000] outline-none"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                      <option value="MEI (Microempreendedor Individual)">MEI (Microempreendedor Individual)</option>
                    </select>
                    <span className="text-[9px] text-gray-400 block mt-1">
                      Necessário para cálculo automático de tributação (ST / DIFAL) em faturamento B2B.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Inscrição Estadual (IE)
                      </label>
                      <input
                        type="text"
                        value={stateRegistration}
                        onChange={(e) => setStateRegistration(e.target.value)}
                        placeholder="Ex: 112.334.556.778 ou Isento"
                        className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Telefone / WhatsApp *
                      </label>
                      <input
                        type="text"
                        value={cnpjPhone}
                        onChange={(e) => setCnpjPhone(e.target.value)}
                        placeholder="(11) 98888-7777"
                        className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      type="email"
                      value={cnpjEmail}
                      onChange={(e) => setCnpjEmail(e.target.value)}
                      placeholder="compras@dakaroffroad.com.br"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Endereço Completo do Auto Center / Oficina
                    </label>
                    <input
                      type="text"
                      value={cnpjAddress}
                      onChange={(e) => setCnpjAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - Estado"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Senha de Acesso B2B *
                    </label>
                    <input
                      type="password"
                      value={cnpjRegPassword}
                      onChange={(e) => setCnpjRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#8B0000] hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg mt-2"
                  >
                    {isSubmitting ? 'Enviando cadastro...' : 'Enviar Cadastro Lojista B2B'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: LOGIN ADMINISTRATIVO (ADMIN) */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-950/40 border border-red-800/60 rounded text-xs space-y-1">
                <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#8B0000]" />
                  <span>Acesso Restrito - Master Supremo</span>
                </div>
                <p className="text-gray-300">
                  Painel de gestão administrativa e controle do catálogo Paris Dakar Rodas e Pneus.
                </p>
                <p className="pt-1 text-[11px] text-gray-400">
                  Entre com a conta Firebase que possui a permissão de administrador. A permissão é
                  concedida pelo backend e não pode ser obtida pelo navegador.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                    E-mail do Administrador
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@parisdakar.com.br"
                    className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                    Senha de Segurança
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#8B0000] hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {isSubmitting ? 'Verificando...' : 'Entrar no Painel Administrativo'}
                </button>

                <button
                  type="button"
                  onClick={() => handlePasswordReset(adminEmail)}
                  disabled={isSubmitting}
                  className="w-full text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-300 transition"
                >
                  Esqueci minha senha
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
