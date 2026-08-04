import React, { useState } from 'react';
import { X, FolderTree, Code2, Server, ShieldCheck, Copy, Check, FileCode, Cpu } from 'lucide-react';

interface ArchitectureViewerProps {
  onClose: () => void;
}

export const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({ onClose }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'tailwind' | 'backend'>('tree');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const directoryTreeText = `frontend/
├── app/                          # Next.js App Router (Vercel Ready)
│   ├── layout.tsx                # Root layout com Dark/Light Theme Provider
│   ├── page.tsx                  # Home com Hero 3D, Filtros e Vitrine
│   ├── (catalog)/
│   │   ├── rodas/page.tsx        # Catálogo isolado de Rodas
│   │   ├── pneus/page.tsx        # Catálogo de Pneus Off-Road (MT/AT/LT)
│   │   └── produto/[sku]/page.tsx# Página SEO Otimizada com Tabela Limpa
│   ├── api/
│   │   ├── whatsapp-route/route.ts # Serverless Route de logs de cotação
│   │   └── b2b-auth/route.ts      # Endpoint B2B Lojistas
│   └── globals.css               # Import Tailwind CSS e Variaveis Paris Dakar
├── components/                   # Componentes Modulares e Fortemente Tipados
│   ├── layout/
│   │   ├── Header.tsx            # Header com Logo, Instagram e WhatsApp
│   │   └── Footer.tsx            # Footer com Social Proof
│   ├── 3d/
│   │   └── Hero3DVisualizer.tsx  # Three.js 360º Wheel & Tire Canvas
│   ├── ui/
│   │   ├── ProductCard.tsx       # Card com Tabela Limpa & WhatsApp Route
│   │   ├── SearchDashboard.tsx   # Painel Veículo x Medida
│   │   └── ParisDakarLogo.tsx    # SVG com Touareg Dakar Symbol
│   └── modals/
│       ├── ProductDetailModal.tsx
│       └── B2BModal.tsx
├── lib/                          # Serviços & Conectores de Backend
│   ├── supabase/                 # Conector Supabase (Futuro Backend)
│   │   ├── client.ts             # Browser Supabase Client
│   │   └── server.ts             # Server Actions Supabase Client
│   └── whatsapp.ts               # Helper de formatação de mensagens WhatsApp
├── types/                        # Tipagem Estrita TypeScript
│   └── index.ts                  # Interfaces Product, Specs, B2BUser
├── tailwind.config.js            # Configuração das Cores Paris Dakar
├── vercel.json                   # Configuração de Deploy Vercel Serverless
└── package.json`;

  const tailwindConfigCode = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paris: {
          red: '#8B0000',          // Vermelho Bordo Paris Dakar
          'red-dark': '#600000',     // Bordo Escuro
          'red-bright': '#B21B1B',   // Vermelho Carmim de Destaque
          charcoal: '#121316',     // Grafite Fechado Off-Road
          dark: '#0B0C0E',         // Preto Fosco Metálico
          card: '#14161B',         // Fundo de Cards no Dark Mode
          gold: '#E5A93C',         // Destaque Âmbar Expedição
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'paris-glow': '0 0 25px rgba(139, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};`;

  const backendDocText = `// ESTRATÉGIA DE CONEXÃO COM SUPABASE / FIREBASE
// Previsão de tabelas e esquemas para backend futuro:

// 1. Tabela: products (Supabase / PostgreSQL)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  b2b_price DECIMAL(10,2),
  is_wholesale_only BOOLEAN DEFAULT FALSE,
  image_url TEXT NOT NULL,
  specs JSONB NOT NULL, -- { aro, furacao, offset, tala, medidaPneu }
  compatible_vehicles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// 2. Tabela: b2b_profiles (Lojistas)
CREATE TABLE b2b_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  cnpj VARCHAR(20) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- approved, pending, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

  return (
    <div className="modal-overlay bg-black/85 backdrop-blur-md animate-fade-in items-center">
      <div className="modal-panel-fixed relative max-w-4xl bg-white dark:bg-[#111111] text-[#111111] dark:text-white rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-4 xs:p-5 sm:p-8">

        {/* Header Bar */}
        <div className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded bg-[#8B0000]/20 border border-[#8B0000]/40 text-[#8B0000] shrink-0">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black uppercase italic tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
                <span>Arquitetura de Software Next.js / Vercel</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-gray-400">
                Paris Dakar E-Commerce Front-End // Estrutura de Diretórios e Configuração Tailwind CSS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-[#1a1a1a] text-zinc-600 dark:text-gray-300 hover:bg-[#8B0000] hover:text-white transition border border-black/10 dark:border-white/10 shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs — rolam na horizontal em telas estreitas */}
        <div className="flex gap-2 pt-4 shrink-0 overflow-x-auto no-scrollbar snap-strip">
          <button
            onClick={() => setActiveTab('tree')}
            className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition border whitespace-nowrap ${
              activeTab === 'tree'
                ? 'bg-[#8B0000] text-white border-[#8B0000]'
                : 'bg-slate-100 dark:bg-[#1a1a1a] text-zinc-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4 shrink-0" />
            <span>Estrutura /frontend (App Router)</span>
          </button>

          <button
            onClick={() => setActiveTab('tailwind')}
            className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition border whitespace-nowrap ${
              activeTab === 'tailwind'
                ? 'bg-[#8B0000] text-white border-[#8B0000]'
                : 'bg-slate-100 dark:bg-[#1a1a1a] text-zinc-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span>tailwind.config.js</span>
          </button>

          <button
            onClick={() => setActiveTab('backend')}
            className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition border whitespace-nowrap ${
              activeTab === 'backend'
                ? 'bg-[#8B0000] text-white border-[#8B0000]'
                : 'bg-slate-100 dark:bg-[#1a1a1a] text-zinc-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            <Server className="w-4 h-4 shrink-0" />
            <span>Supabase / Firebase Schema</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="mt-4 flex-1 overflow-y-auto bg-zinc-900/90 rounded-2xl border border-zinc-800/90 p-3 sm:p-4 font-mono text-[11px] sm:text-xs text-zinc-200 relative">

          {/* Copy Button */}
          <button
            onClick={() => {
              const code = activeTab === 'tree' ? directoryTreeText : activeTab === 'tailwind' ? tailwindConfigCode : backendDocText;
              copyToClipboard(code, activeTab);
            }}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] sm:text-[11px] font-sans font-bold flex items-center gap-1.5 border border-zinc-700 transition"
          >
            {copiedCode === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden xs:inline">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">Copiar Código</span>
              </>
            )}
          </button>

          {activeTab === 'tree' && (
            <pre className="whitespace-pre overflow-x-auto leading-relaxed text-emerald-400 font-bold pr-16 sm:pr-0">
              {directoryTreeText}
            </pre>
          )}

          {activeTab === 'tailwind' && (
            <pre className="whitespace-pre overflow-x-auto leading-relaxed text-amber-300 pr-16 sm:pr-0">
              {tailwindConfigCode}
            </pre>
          )}

          {activeTab === 'backend' && (
            <pre className="whitespace-pre overflow-x-auto leading-relaxed text-sky-300 pr-16 sm:pr-0">
              {backendDocText}
            </pre>
          )}

        </div>

        {/* Deployment Note */}
        <div className="pt-4 border-t border-black/10 dark:border-zinc-800 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-px" />
            <span>Pronto para Deploy imediato na Vercel com suporte a Serverless Functions.</span>
          </div>

          <button
            onClick={onClose}
            className="btn-paris px-5 py-2 rounded-xl text-xs font-bold font-sans w-full sm:w-auto shrink-0"
          >
            Entendido / Voltar à Plataforma
          </button>
        </div>

      </div>
    </div>
  );
};
