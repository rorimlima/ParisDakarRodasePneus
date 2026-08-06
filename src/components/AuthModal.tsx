import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { obterAuth } from '../firebase/config';
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
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onLoginSuccess,
  initialTab = 'b2c',
  initialMode = 'login'
}) => {
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b' | 'admin'>(initialTab);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (initialMode) setMode(initialMode);
    }
  }, [isOpen, initialTab, initialMode]);

  // Admin security — lockout after 5 failed attempts
  const [adminAttempts, setAdminAttempts] = useState(0);
  const [adminLockedUntil, setAdminLockedUntil] = useState<number | null>(null);
  const [adminShake, setAdminShake] = useState(false);

  // CPF Form state
  const [cpfLoginInput, setCpfLoginInput] = useState('');
  const [cpfPassword, setCpfPassword] = useState('');
  
  const [cpfFullName, setCpfFullName] = useState('');
  const [cpfValue, setCpfValue] = useState('');
  const [cpfEmail, setCpfEmail] = useState('');
  const [cpfPhone, setCpfPhone] = useState('');
  const [cpfAddress, setCpfAddress] = useState('');
  const [cpfCep, setCpfCep] = useState('');
  const [cpfBirthDate, setCpfBirthDate] = useState('');
  const [cpfCity, setCpfCity] = useState('');
  const [cpfState, setCpfState] = useState('');
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

  // Google Auth Handler
  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      const auth = obterAuth();
      if (!auth) {
        const demoUser: CpfClient = {
          id: `b2c-google-${Date.now()}`,
          fullName: 'Usuário Google',
          cpf: '000.000.000-00',
          email: 'usuario.google@gmail.com',
          phone: '(11) 99999-9999',
          address: 'Cadastrado via Google Auth',
          cep: '00000-000',
          createdAt: new Date().toISOString().split('T')[0]
        };
        const session: UserSession = { type: 'b2c', b2cUser: demoUser };
        storageService.saveUserSession(session);
        onLoginSuccess(session);
        onClose();
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const cpfUsers = storageService.getCpfUsers();
      let existing = cpfUsers.find((u) => u.email.toLowerCase() === (user.email || '').toLowerCase());

      if (!existing) {
        existing = storageService.registerCpfUser({
          fullName: user.displayName || 'Usuário Google',
          cpf: '000.000.000-00',
          email: user.email || '',
          phone: user.phoneNumber || '(11) 99999-9999',
          address: 'Cadastrado via Google Auth',
          cep: '00000-000'
        });
      }

      const session: UserSession = { type: 'b2c', b2cUser: existing };
      storageService.saveUserSession(session);
      setSuccessMsg(`Bem-vindo, ${existing.fullName}!`);
      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error('[Google Auth Error]', err);
      setErrorMsg(err.message || 'Erro ao realizar login com o Google.');
    }
  };

  // 2. CPF (B2C) Register
  const handleCpfRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!cpfFullName || !cpfValue || !cpfEmail || !cpfRegPassword || !cpfAddress) {
      setErrorMsg('Preencha os campos obrigatórios: Nome Completo, CPF, Endereço Completo, Celular, E-mail e Senha.');
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
      cep: cpfCep,
      birthDate: cpfBirthDate
    } as any);

    const session: UserSession = { type: 'b2c', b2cUser: newUser };
    storageService.saveUserSession(session);
    setSuccessMsg('Conta criada com sucesso! Seja bem-vindo à Paris Dakar.');
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

  // 5. Admin Login (Master Supremo) — com bloqueio após 5 tentativas
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check lockout
    if (adminLockedUntil && Date.now() < adminLockedUntil) {
      const secsLeft = Math.ceil((adminLockedUntil - Date.now()) / 1000);
      setErrorMsg(`🔒 Acesso bloqueado. Aguarde ${secsLeft} segundos antes de tentar novamente.`);
      return;
    }

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
      setAdminAttempts(0);
      setAdminLockedUntil(null);
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
      const newAttempts = adminAttempts + 1;
      setAdminAttempts(newAttempts);
      // Trigger shake animation
      setAdminShake(true);
      setTimeout(() => setAdminShake(false), 600);
      if (newAttempts >= 5) {
        const lockUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
        setAdminLockedUntil(lockUntil);
        setErrorMsg(`🔒 Muitas tentativas incorretas. Acesso bloqueado por 5 minutos.`);
      } else {
        setErrorMsg(`Credenciais inválidas. Tentativa ${newAttempts}/5. Após 5 tentativas, o acesso será bloqueado por 5 minutos.`);
      }
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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pd-overlay-bg pd-anim-rise overflow-y-auto">
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
                <div className="space-y-4">
                  {/* Botão Entrar com Google */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 px-4 rounded-xl pd-surface-2 border pd-border pd-text hover:bg-white/10 font-bold text-xs flex items-center justify-center gap-3 transition shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Entrar com o Google</span>
                  </button>

                  <div className="relative my-4 flex items-center justify-center">
                    <div className="border-t pd-border w-full" />
                    <span className="pd-surface px-2 text-[10px] pd-text-3 font-bold uppercase absolute">
                      ou entre com CPF / E-mail
                    </span>
                  </div>

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
                </div>
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
                        Celular / WhatsApp *
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

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Endereço Completo *
                    </label>
                    <input
                      type="text"
                      value={cpfAddress}
                      onChange={(e) => setCpfAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Senha de Acesso *
                    </label>
                    <input
                      type="password"
                      value={cpfRegPassword}
                      onChange={(e) => setCpfRegPassword(e.target.value)}
                      placeholder="Criar senha de acesso..."
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:border-[#8B0000]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#8B0000] hover:bg-red-800 text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg mt-2"
                  >
                    Criar Minha Conta na Paris Dakar
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
              <div className="p-4 bg-red-950/40 border border-red-800/60 rounded text-xs space-y-1">
                <div className="flex items-center gap-2 pd-brand-text font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 pd-brand-text" />
                  <span>Acesso Restrito — Master Supremo</span>
                </div>
                <p className="pd-text-2">
                  Painel de gestão administrativa e controle do catálogo Paris Dakar Rodas e Pneus.
                </p>
                {adminAttempts > 0 && !adminLockedUntil && (
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold pt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Tentativas: {adminAttempts}/5 — Cuidado!</span>
                  </div>
                )}
                {adminLockedUntil && Date.now() < adminLockedUntil && (
                  <div className="flex items-center gap-1.5 text-red-400 font-bold pt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>🔒 Acesso bloqueado temporariamente por múltiplas tentativas.</span>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleAdminLogin}
                className={`space-y-4 transition-all ${adminShake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                style={adminShake ? { animation: 'shake 0.5s ease-in-out' } : {}}
              >
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                    E-mail do Administrador
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@parisdakar.com.br"
                    disabled={!!(adminLockedUntil && Date.now() < adminLockedUntil)}
                    className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none focus:border-[#8B0000] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                    Senha de Segurança
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={!!(adminLockedUntil && Date.now() < adminLockedUntil)}
                    className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none focus:border-[#8B0000] disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!!(adminLockedUntil && Date.now() < adminLockedUntil)}
                  className="w-full bg-[#8B0000] hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Entrar como Master Supremo
                </button>
              </form>

              {/* Direct Senior Master Access Trigger */}
              <div className="pt-3 border-t pd-border text-center">
                <button
                  type="button"
                  onClick={handleSeniorBypass}
                  className="px-4 py-2 pd-surface-2 pd-row-hover pd-gold-text border border-amber-500/30 rounded text-[10px] font-bold uppercase tracking-widest transition"
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
