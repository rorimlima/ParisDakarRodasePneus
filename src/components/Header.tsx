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
  LogIn,
  LogOut,
  UserPlus,
  MapPin
} from 'lucide-react';
import { ParisDakarLogo } from './ParisDakarLogo';
import { UserSession } from '../types';
import { storageService } from '../services/storageService';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  currentSession: UserSession;
  onOpenAuthModal: (tab?: 'b2c' | 'b2b' | 'admin', mode?: 'login' | 'register') => void;
  onOpenAdminDashboard: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onConsultWhatsApp: (msg?: string) => void;
  announcementText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleTheme,
  currentSession,
  onOpenAuthModal,
  onOpenAdminDashboard,
  onSearchChange,
  searchQuery,
  onConsultWhatsApp,
  announcementText
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const themeLabel = isDark ? 'Ativar modo claro' : 'Ativar modo escuro';

  const accountButton = () => {
    if (currentSession.type === 'b2b') {
      return (
        <button type="button" onClick={() => onOpenAuthModal('b2b', 'login')} className="btn btn-outline">
          <Building2 className="w-4 h-4 pd-gold-text" />
          <span className="max-w-[13rem] truncate">
            {currentSession.b2bUser?.tradeName || currentSession.b2bUser?.companyName || 'Conta PJ'}
          </span>
        </button>
      );
    }

    if (currentSession.type === 'b2c') {
      return (
        <button type="button" onClick={() => onOpenAuthModal('b2c', 'login')} className="btn btn-outline">
          <User className="w-4 h-4 pd-brand-text" />
          <span className="max-w-[13rem] truncate">
            {currentSession.b2cUser?.fullName || 'Minha conta'}
          </span>
        </button>
      );
    }

    if (currentSession.type === 'admin') {
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenAdminDashboard()}
            className="btn btn-outline"
          >
            <Lock className="w-4 h-4 pd-brand-text" />
            <span className="max-w-[13rem] truncate">
              Painel Admin ({currentSession.adminUser?.role})
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              storageService.clearUserSession();
              window.location.reload();
            }}
            className="btn btn-outline border-red-800/60 hover:bg-red-950/40 text-red-500 hover:text-red-400"
            title="Sair da Conta Admin"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onOpenAuthModal('b2c', 'login')} className="btn btn-outline" id="btn-entrar">
          <LogIn className="w-4 h-4 pd-brand-text" />
          <span>Entre</span>
        </button>
        <button type="button" onClick={() => onOpenAuthModal('b2c', 'register')} className="btn btn-primary" id="btn-cadastrese">
          <UserPlus className="w-4 h-4" />
          <span>Cadastre-se</span>
        </button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full pd-glass border-b pd-border">
      {/* Faixa de anúncio */}
      <div className="border-b pd-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-center gap-4">
          <p className="text-[0.68rem] font-semibold tracking-wide pd-text-3 truncate hidden sm:block">
            {announcementText || 'Rodas forjadas • Pneus off-road • Consultoria técnica 4x4'}
          </p>
          <a
            href="https://www.instagram.com/parisdakarrodas/"
            target="_blank"
            rel="noopener noreferrer"
            className="pd-link text-[0.68rem] font-bold tracking-wide flex items-center gap-1.5 shrink-0"
          >
            <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
            <span>@parisdakarrodas</span>
          </a>
        </div>
      </div>

      {/* Barra principal — o logo abre o site no topo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2 sm:gap-5">
        <a
          href="#topo"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Paris Dakar Rodas e Pneus — início"
          className="flex min-w-0 shrink items-center shrink-0"
        >
          <ParisDakarLogo variant="full" height={42} />
        </a>

        {/* Busca rápida */}
        <div className="hidden md:flex flex-1 max-w-lg relative">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pd-text-3 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Hilux, Ranger, RAM, aro 17, 35x12.50..."
            aria-label="Buscar no catálogo"
            className="pd-input !pl-10"
          />
        </div>

        {/* Ações desktop */}
        <div className="hidden lg:flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn-icon"
            title={themeLabel}
            aria-label={themeLabel}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a href="#localizacao" className="btn-icon" title="Localização" aria-label="Localização">
            <MapPin className="w-4 h-4" />
          </a>

          {accountButton()}

          <button
            type="button"
            onClick={() =>
              onConsultWhatsApp(
                'Olá equipe Paris Dakar! Gostaria de consultar rodas e pneus para minha caminhonete 4x4.'
              )
            }
            className="btn btn-primary"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Ações mobile */}
        <div className="flex lg:hidden shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn-icon"
            title={themeLabel}
            aria-label={themeLabel}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Gaveta mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden pd-surface border-t pd-border px-4 py-4 space-y-3 pd-anim-rise">
          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pd-text-3 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar caminhonete, aro, pneu..."
              aria-label="Buscar no catálogo"
              className="pd-input !pl-10"
            />
          </div>

          <div className="flex flex-col gap-2">
            {currentSession.type === 'admin' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAdminDashboard();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-primary btn-block"
                >
                  <Lock className="w-4 h-4" />
                  <span>Painel admin ({currentSession.adminUser?.role})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    storageService.clearUserSession();
                    window.location.reload();
                  }}
                  className="btn btn-outline btn-block border-red-800/60 text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da conta</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuthModal('b2c');
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-outline btn-block"
                >
                  <User className="w-4 h-4 pd-brand-text" />
                  <span>Área cliente CPF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenAuthModal('b2b');
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-outline btn-block"
                >
                  <Building2 className="w-4 h-4 pd-gold-text" />
                  <span>Área lojista CNPJ</span>
                </button>
              </>
            )}

            <a
              href="#localizacao"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-subtle btn-block"
            >
              <MapPin className="w-4 h-4" />
              <span>Como chegar</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onConsultWhatsApp('Olá! Atendimento Paris Dakar caminhonetes 4x4.');
                setMobileMenuOpen(false);
              }}
              className="btn btn-primary btn-block"
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
