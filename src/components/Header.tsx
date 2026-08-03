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
  siteLogo?: string;
  onSelectCategory?: (category: any) => void;
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
  announcementText,
  siteLogo,
  onSelectCategory
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMenuClick = (category: 'todos' | 'rodas' | 'pneus' | 'kits-lift' | 'combos' | 'showroom' | 'contato') => {
    setMobileMenuOpen(false);
    if (category === 'showroom') {
      handleScrollTo('showroom-section');
    } else if (category === 'contato') {
      handleScrollTo('footer-section');
    } else {
      if (onSelectCategory) {
        onSelectCategory(category);
      }
      setTimeout(() => {
        handleScrollTo('catalog-section');
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-black/95 text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 transition-colors duration-200 shadow-sm dark:shadow-none">
      
      {/* Top Announcement Bar - Only Instagram */}
      <div className="bg-slate-100 dark:bg-[#0D0D10] text-slate-700 dark:text-zinc-300 text-[11px] py-1.5 px-4 font-medium border-b border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto w-full flex justify-center items-center">
          <a
            href="https://www.instagram.com/parisdakarrodas/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1.5 tracking-wide text-[11px]"
          >
            <Instagram className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
            <span>Siga nosso Instagram <strong className="text-slate-900 dark:text-white font-semibold">@parisdakarrodas</strong></span>
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('todos'); }} className="flex items-center gap-2">
          <ParisDakarLogo colorMode={darkMode ? "default" : "light"} height={40} customLogoUrl={siteLogo} />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
          <button onClick={() => handleMenuClick('todos')} className="hover:text-red-600 dark:hover:text-red-450 transition py-1">Home</button>
          <button onClick={() => handleMenuClick('rodas')} className="hover:text-red-600 dark:hover:text-red-450 transition py-1">Rodas</button>
          <button onClick={() => handleMenuClick('pneus')} className="hover:text-red-600 dark:hover:text-red-450 transition py-1">Pneus</button>
          <button onClick={() => handleMenuClick('kits-lift')} className="hover:text-red-600 dark:hover:text-red-450 transition py-1">Suspensão</button>
          <button onClick={() => handleMenuClick('combos')} className="hover:text-red-600 dark:hover:text-red-450 transition py-1">Combos</button>
          <button onClick={() => handleMenuClick('showroom')} className="hover:text-red-600 dark:hover:text-red-450 transition py-1">Showroom</button>
          <button onClick={() => handleMenuClick('contato')} className="hover:text-red-600 dark:hover:text-red-450 transition py-1">Contato</button>
        </nav>

        {/* Desktop Quick Search Bar */}
        <div className="hidden md:flex flex-1 max-w-[150px] lg:max-w-[200px] xl:max-w-xs relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-405 dark:text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-100 dark:bg-[#141417] text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 focus:outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/60 transition placeholder-slate-400 dark:placeholder-zinc-500 font-normal"
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          
          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-[#141417] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#1C1C21] border border-slate-300 dark:border-white/10 transition"
            title={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* ADMIN ACTIVE BUTTON / PAINEL ADMIN TRIGGER */}
          {currentSession.type === 'admin' ? (
            <button
              onClick={onOpenAdminDashboard}
              className="bg-red-950/80 hover:bg-red-900 text-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border border-red-800/60 shadow-sm transition"
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Painel Administrativo</span>
            </button>
          ) : currentSession.type === 'b2b' ? (
            <button
              onClick={() => onOpenAuthModal('b2b')}
              className="bg-slate-100 dark:bg-[#141417] text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{currentSession.b2bUser?.tradeName || currentSession.b2bUser?.companyName || 'Conta PJ'}</span>
            </button>
          ) : currentSession.type === 'b2c' ? (
            <button
              onClick={() => onOpenAuthModal('b2c')}
              className="bg-slate-100 dark:bg-[#141417] text-[#8B0000] dark:text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              <User className="w-3.5 h-3.5 text-red-650 dark:text-sky-400" />
              <span>{currentSession.b2cUser?.fullName || 'Minha Conta'}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal('b2c')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#141417] text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-white/10 hover:border-red-600/50 transition"
            >
              <LogIn className="w-3.5 h-3.5 text-red-650 dark:text-red-500" />
              <span>Entrar</span>
            </button>
          )}

          {/* WhatsApp Direct Specialist Route Button */}
          <button
            onClick={() => onConsultWhatsApp("Olá equipe Paris Dakar! Gostaria de consultar rodas e pneus para minha caminhonete 4x4.")}
            className="btn-paris flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Consultar</span>
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
        <div className="lg:hidden bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 px-4 py-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-105 focus:outline-none"
            />
          </div>

          {/* Navigation Links inside Mobile Menu */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-850 pb-3">
            <button onClick={() => handleMenuClick('todos')} className="text-left py-1 hover:text-red-500">Home</button>
            <button onClick={() => handleMenuClick('rodas')} className="text-left py-1 hover:text-red-500">Rodas</button>
            <button onClick={() => handleMenuClick('pneus')} className="text-left py-1 hover:text-red-500">Pneus</button>
            <button onClick={() => handleMenuClick('kits-lift')} className="text-left py-1 hover:text-red-500">Suspensão</button>
            <button onClick={() => handleMenuClick('combos')} className="text-left py-1 hover:text-red-500">Combos</button>
            <button onClick={() => handleMenuClick('showroom')} className="text-left py-1 hover:text-red-500">Showroom</button>
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
                  className="w-full py-2.5 bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-white rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10"
                >
                  <User className="w-4 h-4 text-red-650 dark:text-sky-400" />
                  <span>Área Cliente CPF</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAuthModal('b2b');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-slate-100 dark:bg-zinc-900 text-amber-600 dark:text-amber-400 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-amber-500/30"
                >
                  <Building2 className="w-4 h-4 text-amber-550 dark:text-amber-400" />
                  <span>Área Lojista CNPJ</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAuthModal('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-red-950/20 text-[#8B0000] dark:text-red-300 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 border border-red-500/30 dark:border-red-800"
                >
                  <Lock className="w-4 h-4 text-red-500" />
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
