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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-black/95 text-white border-b border-[#8B0000]/50 transition-colors duration-200">
      
      {/* Top Announcement Bar - Only Instagram */}
      <div className="bg-gradient-to-r from-black via-[#8B0000]/40 to-black text-white text-xs py-1.5 px-4 font-medium border-b border-[#8B0000]/30">
        <div className="max-w-7xl mx-auto w-full flex justify-center items-center">
          <a
            href="https://www.instagram.com/parisdakarrodas/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-300 transition flex items-center gap-1.5 font-bold tracking-wide text-xs"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-500" />
            <span>Siga nosso Instagram @parisdakarrodas</span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2">
          <ParisDakarLogo colorMode="default" height={44} />
        </a>

        {/* Desktop Quick Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Caminhonetes (Hilux, Ranger, Ram, S10), Aro, Pneu (35x12.5)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-[#111111] text-white border border-white/10 focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition placeholder-zinc-500"
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          
          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl bg-[#111111] text-zinc-300 hover:bg-[#1a1a1a] border border-white/10 transition"
            title={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-300" />}
          </button>

          {/* ADMIN ACTIVE BUTTON / PAINEL ADMIN TRIGGER */}
          {currentSession.type === 'admin' ? (
            <button
              onClick={onOpenAdminDashboard}
              className="bg-[#8B0000] hover:bg-red-800 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-red-500/50 shadow-lg animate-pulse"
            >
              <Lock className="w-4 h-4" />
              <span>Painel Master Supremo</span>
            </button>
          ) : currentSession.type === 'b2b' ? (
            <button
              onClick={() => onOpenAuthModal('b2b')}
              className="bg-[#111111] text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>{currentSession.b2bUser?.tradeName || currentSession.b2bUser?.companyName || 'Conta Pessoa Jurídica'}</span>
            </button>
          ) : currentSession.type === 'b2c' ? (
            <button
              onClick={() => onOpenAuthModal('b2c')}
              className="bg-[#111111] text-sky-400 border border-sky-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>{currentSession.b2cUser?.fullName || 'Minha Conta'}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal('b2c')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111111] text-zinc-200 border border-white/10 hover:border-[#8B0000] transition"
            >
              <LogIn className="w-4 h-4 text-[#8B0000]" />
              <span>Entrar / Cadastrar</span>
            </button>
          )}

          {/* WhatsApp Direct Specialist Route Button */}
          <button
            onClick={() => onConsultWhatsApp("Olá equipe Paris Dakar! Gostaria de consultar rodas e pneus para minha caminhonete 4x4.")}
            className="btn-paris flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md uppercase tracking-wider"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Atendimento WhatsApp</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-zinc-950 border-b border-zinc-800 px-4 py-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar caminhonete, aro, pneu..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {currentSession.type === 'admin' ? (
              <button
                onClick={() => {
                  onOpenAdminDashboard();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-[#8B0000] text-white rounded font-bold text-xs uppercase flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Painel Admin ({currentSession.adminUser?.role})</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onOpenAuthModal('b2c');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-zinc-900 text-white rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-white/10"
                >
                  <User className="w-4 h-4 text-sky-400" />
                  <span>Área Cliente CPF</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAuthModal('b2b');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-zinc-900 text-amber-400 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-amber-500/30"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Área Lojista CNPJ</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAuthModal('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-red-950/80 text-red-300 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-red-800"
                >
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>Acesso Restrito Admin</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                onConsultWhatsApp("Olá! Atendimento Paris Dakar Caminhonetes 4x4.");
                setMobileMenuOpen(false);
              }}
              className="btn-paris w-full py-2.5 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 mt-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Falar no WhatsApp</span>
            </button>
          </div>
        </div>
      )}

    </header>
  );
};
