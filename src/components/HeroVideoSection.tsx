import React from 'react';
import { MessageCircle, ArrowRight, ShieldCheck, CheckCircle2, Tv } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroVideoSectionProps {
  onConsultWhatsApp: (msg?: string) => void;
  onExploreCatalog: () => void;
  siteSettings?: SiteSettings;
}

/**
 * Converte URLs variadas do YouTube (watch, share, embed, etc.) em uma URL pronta para <iframe>.
 */
function getYouTubeEmbedUrl(urlOrId?: string): string {
  if (!urlOrId) {
    return 'https://www.youtube.com/embed/5qap5aO4i9A?autoplay=0&rel=0';
  }

  const raw = urlOrId.trim();

  // Se já for iframe embed direto
  if (raw.includes('youtube.com/embed/')) {
    const cleanUrl = raw.split('?')[0];
    return `${cleanUrl}?autoplay=0&rel=0`;
  }

  // Se for link comum youtube.com/watch?v=ID
  const matchWatch = raw.match(/(?:v=|\/embed\/|\/1080\/|\/720\/|youtu\.be\/|\/v\/|\/e\/|watch\?v=|\?v=)([^#&?]*)/);
  if (matchWatch && matchWatch[1] && matchWatch[1].length === 11) {
    return `https://www.youtube.com/embed/${matchWatch[1]}?autoplay=0&rel=0`;
  }

  // Se for apenas o ID direto
  if (raw.length === 11 && !raw.includes('/')) {
    return `https://www.youtube.com/embed/${raw}?autoplay=0&rel=0`;
  }

  return raw;
}

export const HeroVideoSection: React.FC<HeroVideoSectionProps> = ({
  onConsultWhatsApp,
  onExploreCatalog,
  siteSettings
}) => {
  const embedUrl = getYouTubeEmbedUrl(siteSettings?.youtubeVideoUrl);
  const heroSubtitle = siteSettings?.heroSubtitle || 'Consulte e configure conjuntos de rodas forjadas, pneus Mud-Terrain / All-Terrain e kits de elevação de suspensão para caminhonetes 4x4.';

  return (
    <div className="relative overflow-hidden bg-slate-100 dark:bg-[#0A0A0A] text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 py-10 lg:py-16 transition-colors duration-200">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8B0000]/10 dark:bg-[#8B0000]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Tv className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span>Vídeo de Apresentação Oficial</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none font-serif">
                <span className="text-slate-900 dark:text-white block">Paris Dakar</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-700 to-amber-600 dark:from-red-500 dark:via-red-600 dark:to-amber-500">
                  Rodas &amp; Pneus 4x4
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-700 dark:text-zinc-300 font-normal leading-relaxed max-w-xl">
                {heroSubtitle}
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white dark:bg-[#121215] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center shadow-sm">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest block">Garantia</span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">5 Anos</span>
              </div>
              <div className="bg-white dark:bg-[#121215] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center shadow-sm">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest block">Resistência</span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Forged T6</span>
              </div>
              <div className="bg-white dark:bg-[#121215] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center shadow-sm">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest block">Atendimento</span>
                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">WhatsApp</span>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => onConsultWhatsApp("Olá! Vi o vídeo de apresentação da Paris Dakar e gostaria de consultar cotações para meu 4x4.")}
                className="bg-gradient-to-r from-[#8B0000] to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black px-6 py-3.5 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>CONSULTAR NO WHATSAPP</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreCatalog}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-[#141417] dark:hover:bg-[#1f1f24] text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-white/10 font-bold px-6 py-3.5 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
              >
                <span>Explorar Catálogo</span>
              </button>
            </div>

            {/* Compatibility Note */}
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 pt-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Suporte técnico de furação, offset e compatibilidade para pickups e SUVs 4x4.</span>
            </div>

          </div>

          {/* Right Column: Embedded YouTube Video Container */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#111114] border border-red-900/20 dark:border-[#8B0000]/40 shadow-2xl shadow-slate-300/50 dark:shadow-red-950/30 group">
              
              {/* Header Bar of Video Box */}
              <div className="bg-slate-100 dark:bg-[#16161a] px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-red-500" />
                    VÍDEO DE APRESENTAÇÃO // PARIS DAKAR 4X4
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono bg-slate-200 dark:bg-black/40 px-2 py-0.5 rounded border border-slate-300 dark:border-white/5">
                  YouTube HD
                </span>
              </div>

              {/* 16:9 Aspect Ratio Video Iframe Wrapper */}
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={embedUrl}
                  title="Vídeo de Apresentação Paris Dakar Rodas & Pneus 4x4"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Footer info below video */}
              <div className="p-3 bg-[#121215] border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px]">Conheça os testes e projetos de rodas forjadas e pneus 4x4</span>
                </div>
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                  Paris Dakar Off-Road
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
