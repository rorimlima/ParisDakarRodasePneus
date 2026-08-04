import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Instagram,
  MessageCircle,
  Building2,
  Menu,
  X,
  User,
  Lock,
  LogIn
} from 'lucide-react';
import { ParisDakarLogo } from './ParisDakarLogo';
import { UserSession } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentSession: UserSession;
  onOpenAuthModal: (tab?: 'b2c' | 'b2b' | 'admin') => void;
  onOpenAdminDashboard: () => void;
  onOpenArchitectureViewer: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onConsultWhatsApp: (msg?: string) => void;
  announcementText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  currentSession,
  onOpenAuthModal,
  onOpenAdminDashboard,
  onOpenArchitectureViewer,
  onSearchChange,
  searchQuery,
  onConsultWhatsApp,
  announcementText
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-black/95 text-[#111111] dark:text-white border-b border-[#8B0000]/50 transition-colors duration-200"
      style={{ paddingTop: 'var(--safe-top)' }}
    >

      {/* Top Announcement Bar - Only Instagram */}
      <div className="bg-gradient-to-r from-white via-[#8B0000]/10 to-white dark:from-black dark:via-[#8B0000]/40 dark:to-black text-[#111111] dark:text-white text-[11px] xs:text-xs py-1.5 px-3 sm:px-4 font-medium border-b border-[#8B0000]/30">
        <div className="max-w-7xl mx-auto w-full flex justify-center items-center">
          <a
            href="https://www.instagram.com/parisdakarrodas/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-600 dark:hover:text-amber-300 transition flex items-center gap-1.5 font-bold tracking-wide min-w-0"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
            {/* Texto encurtado em telas muito estreitas para não quebrar a barra */}
            <span className="truncate sm:hidden">@parisdakarrodas</span>
            <span className="hidden sm:inline truncate">Siga nosso Instagram @parisdakarrodas</span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">

        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2 shrink-0 min-w-0">
          {/* Logo menor no celular, cresce conforme a tela */}
          <span className="sm:hidden">
            <ParisDakarLogo colorMode="default" height={34} />
          </span>
          <span className="hidden sm:block lg:hidden">
            <ParisDakarLogo colorMode="default" height={40} />
          </span>
          <span className="hidden lg:block">
            <ParisDakarLogo colorMode="default" height={44} />
          </span>
        </a>

        {/* Desktop / Tablet Quick Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Caminhonetes (Hilux, Ranger, Ram, S10), Aro, Pneu (35x12.5)..."
            className="w-full pl-10 pr-4 py-2 text-xs lg:text-sm rounded-xl bg-slate-100 dark:bg-[#111111] text-[#111111] dark:text-white border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition placeholder-zinc-500"
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#111111] text-zinc-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#1a1a1a] border border-black/10 dark:border-white/10 transition"
            title={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            aria-label={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* ADMIN ACTIVE BUTTON / PAINEL ADMIN TRIGGER */}
          {currentSession.type === 'admin' ? (
            <button
              onClick={onOpenAdminDashboard}
              className="bg-[#8B0000] hover:bg-red-800 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-red-500/50 shadow-lg animate-pulse max-w-[16rem]"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span className="truncate">Painel Master Supremo</span>
            </button>
          ) : currentSession.type === 'b2b' ? (
            <button
              onClick={() => onOpenAuthModal('b2b')}
              className="bg-slate-100 dark:bg-[#111111] text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 max-w-[14rem]"
            >
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">{currentSession.b2bUser?.tradeName || currentSession.b2bUser?.companyName || 'Conta Pessoa Jurídica'}</span>
            </button>
          ) : currentSession.type === 'b2c' ? (
            <button
              onClick={() => onOpenAuthModal('b2c')}
              className="bg-slate-100 dark:bg-[#111111] text-sky-700 dark:text-sky-400 border border-sky-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 max-w-[14rem]"
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">{currentSession.b2cUser?.fullName || 'Minha Conta'}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal('b2c')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#111111] text-zinc-700 dark:text-zinc-200 border border-black/10 dark:border-white/10 hover:border-[#8B0000] transition whitespace-nowrap"
            >
              <LogIn className="w-4 h-4 text-[#8B0000] shrink-0" />
              <span>Entrar / Cadastrar</span>
            </button>
          )}

          {/* WhatsApp Direct Specialist Route Button */}
          <button
            onClick={() => onConsultWhatsApp("Olá equipe Paris Dakar! Gostaria de consultar rodas e pneus para minha caminhonete 4x4.")}
            className="btn-paris flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl text-xs font-bold shadow-md uppercase tracking-wider whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline">Atendimento WhatsApp</span>
            <span className="xl:hidden">WhatsApp</span>
          </button>
        </div>

        {/* Mobile / Tablet Actions */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Atalho direto de WhatsApp já no topo em tablets */}
          <button
            onClick={() => onConsultWhatsApp("Olá equipe Paris Dakar! Gostaria de consultar rodas e pneus para minha caminhonete 4x4.")}
            className="btn-paris hidden sm:flex items-center justify-center gap-2 h-11 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider"
            aria-label="Falar no WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline">WhatsApp</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#111111] text-zinc-600 dark:text-zinc-300 border border-black/10 dark:border-white/10 transition"
            aria-label={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#111111] text-zinc-700 dark:text-zinc-200 border border-black/10 dark:border-white/10 transition"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden bg-white dark:bg-zinc-950 border-b border-black/10 dark:border-zinc-800 px-3 sm:px-6 py-4 space-y-3 overflow-y-auto overscroll-contain"
          style={{ maxHeight: 'calc(100dvh - 8rem)', paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
        >
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar caminhonete, aro, pneu..."
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg bg-slate-100 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 text-[#111111] dark:text-zinc-100 focus:outline-none focus:border-[#8B0000]"
            />
          </div>

          {/* Em tablets os atalhos ficam lado a lado; no celular empilhados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {currentSession.type === 'admin' ? (
              <button
                onClick={() => {
                  onOpenAdminDashboard();
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-11 py-2.5 px-3 bg-[#8B0000] text-white rounded font-bold text-xs uppercase flex items-center justify-center gap-2 sm:col-span-2"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span className="truncate">Painel Admin ({currentSession.adminUser?.role})</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onOpenAuthModal('b2c');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-11 py-2.5 px-3 bg-slate-100 dark:bg-zinc-900 text-[#111111] dark:text-white rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-black/10 dark:border-white/10"
                >
                  <User className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                  <span>Área Cliente CPF</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAuthModal('b2b');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-11 py-2.5 px-3 bg-slate-100 dark:bg-zinc-900 text-amber-700 dark:text-amber-400 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-amber-500/30"
                >
                  <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Área Lojista CNPJ</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAuthModal('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-11 py-2 px-3 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-red-300 dark:border-red-800 sm:col-span-2"
                >
                  <Lock className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Acesso Restrito Admin</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                onConsultWhatsApp("Olá! Atendimento Paris Dakar Caminhonetes 4x4.");
                setMobileMenuOpen(false);
              }}
              className="btn-paris w-full min-h-11 py-2.5 px-3 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 mt-1 sm:col-span-2"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Falar no WhatsApp</span>
            </button>
          </div>
        </div>
      )}

    </header>
  );
};
