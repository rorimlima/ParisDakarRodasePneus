import React, { useState } from 'react';
import {
  Play,
  Pause,
  Tv,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Layers,
  Film,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroSectionProps {
  onConsultWhatsApp: (msg?: string) => void;
  onExploreCatalog: () => void;
  siteSettings?: SiteSettings;
}

// Convert YouTube URLs into standard embed URLs
function getYouTubeEmbedUrl(urlOrId?: string): string {
  if (!urlOrId) {
    return 'https://www.youtube.com/embed/5qap5aO4i9A?autoplay=0&rel=0';
  }

  let raw = urlOrId.trim();
  
  if (raw.includes('<iframe') && raw.includes('src=')) {
    const srcMatch = raw.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      raw = srcMatch[1];
    }
  }

  if (raw.length === 11 && !raw.includes('/') && !raw.includes('.')) {
    return `https://www.youtube.com/embed/${raw}?autoplay=0&rel=0`;
  }

  const patterns = [
    /youtube\.com\/watch\?v=([^#&?]+)/,
    /youtu\.be\/([^#&?]+)/,
    /youtube\.com\/embed\/([^#&?]+)/,
    /youtube\.com\/shorts\/([^#&?]+)/,
    /youtube\.com\/v\/([^#&?]+)/,
    /youtube\.com\/e\/([^#&?]+)/
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match && match[1]) {
      const id = match[1].trim();
      if (id.length === 11) {
        return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
      }
    }
  }

  return raw;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onConsultWhatsApp,
  onExploreCatalog,
  siteSettings
}) => {
  // Main view state: 'video3d' (Beduíno 3D Visualizer) or 'youtube' (YouTube Embed)
  const [activeTab, setActiveTab] = useState<'video3d' | 'youtube'>('video3d');
  
  // Beduíno 3D Video Visualizer scene selection
  const [beduinoScene, setBeduinoScene] = useState<'wheel' | 'close' | 'emblem'>('wheel');
  const [isBeduinoPlaying, setIsBeduinoPlaying] = useState<boolean>(true);

  const embedUrl = getYouTubeEmbedUrl(siteSettings?.youtubeVideoUrl);
  const heroSubtitle = siteSettings?.heroSubtitle || 'Rodas forjadas de alta performance e pneus esportivos de luxo com a elegância tridimensional do emblemático Beduíno Paris Dakar.';

  const handleWhatsAppInquiry = () => {
    if (activeTab === 'video3d') {
      const sceneName = beduinoScene === 'wheel' ? 'Roda Forjada Beduíno' : beduinoScene === 'close' ? 'Órbita Beduíno Glow' : 'Logo 3D Premium';
      onConsultWhatsApp(`Olá! Vi o efeito 3D do Beduíno (${sceneName}) com rodas e pneus de luxo na Paris Dakar e gostaria de consultar modelos para meu veículo!`);
    } else {
      onConsultWhatsApp("Olá! Assisti ao vídeo de apresentação da Paris Dakar e gostaria de falar com um especialista sobre rodas e pneus de luxo.");
    }
  };

  const getSceneImage = () => {
    switch (beduinoScene) {
      case 'close':
        return '/hero_beduino_close_3d.jpg';
      case 'emblem':
        return '/logo_3d_dark.jpg';
      case 'wheel':
      default:
        return '/hero_beduino_wheel_3d.jpg';
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 py-10 lg:py-16 transition-colors duration-250">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8B0000]/10 dark:bg-[#8B0000]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column: Brand Typography & Copy */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Top Info Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-800/50 text-[#8B0000] dark:text-red-400 text-xs font-bold uppercase tracking-wider shadow-sm transition">
              <Sparkles className="w-4 h-4 text-red-600 dark:text-red-500 animate-pulse" />
              <span>Beduíno 3D &amp; Rodas de Luxo</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none">
                <span className="text-slate-900 dark:text-white block mb-1">Paris Dakar</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="relative inline-block px-3.5 py-1 rounded-xl bg-red-50 dark:bg-gradient-to-r dark:from-red-600/30 dark:via-amber-500/15 dark:to-red-600/30 border border-red-200 dark:border-red-600/30 shadow-sm overflow-hidden transition">
                    <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-amber-600 dark:from-red-500 dark:to-amber-400 font-bold">
                      Rodas
                    </span>
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-red-800 to-amber-700 dark:from-zinc-200 dark:via-red-500 dark:to-amber-500 font-bold">
                    &amp; Pneus
                  </span>
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-normal leading-relaxed max-w-xl">
                {heroSubtitle}
              </p>
            </div>

            {/* Badges Info Panel */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white dark:bg-[#121215] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center shadow-sm transition">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest block mb-0.5">Emblema</span>
                <span className="text-sm font-black text-red-600 dark:text-red-400">Beduíno 3D</span>
              </div>
              <div className="bg-white dark:bg-[#121215] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center shadow-sm transition">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest block mb-0.5">Liga</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">Forged T6</span>
              </div>
              <div className="bg-white dark:bg-[#121215] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center shadow-sm transition">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest block mb-0.5">Atendimento</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">WhatsApp</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={handleWhatsAppInquiry}
                className="btn-paris text-white font-black px-6 py-3.5 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Solicitar Orçamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreCatalog}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-[#141417] dark:hover:bg-[#1f1f24] text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-white/10 font-bold px-6 py-3.5 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition"
              >
                <Layers className="w-4 h-4" />
                <span>Explorar Catálogo</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 pt-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Suporte técnico de compatibilidade para pickups e SUVs de alta performance.</span>
            </div>

          </div>

          {/* Right Column: Beduíno 3D Showcase & Video Container */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Header Switcher Tab Bar */}
            <div className="flex items-center justify-between p-1 rounded-xl bg-slate-200/80 dark:bg-[#111113] border border-slate-300/40 dark:border-white/5 shadow-sm max-w-xs">
              <button
                onClick={() => setActiveTab('video3d')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'video3d'
                    ? 'bg-red-700 text-white shadow-md'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Beduíno 3D</span>
              </button>

              <button
                onClick={() => setActiveTab('youtube')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'youtube'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Vídeo Oficial</span>
              </button>
            </div>

            {/* Display Active Panel */}
            {activeTab === 'video3d' ? (
              /* --- 1. MODERN BEDUÍNO 3D LUXURY WHEEL VIDEO VISUALIZER --- */
              <div className="relative rounded-2xl overflow-hidden bg-black border border-red-900/40 dark:border-red-600/50 shadow-2xl shadow-red-950/20 group transition">
                
                {/* Header Bar */}
                <div className="bg-[#121215] px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono font-medium text-zinc-300">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="text-red-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-red-500" />
                      SHOWCASE VÍDEO 3D // BEDUÍNO &amp; RODAS ESPORTIVAS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-red-300 bg-red-950/90 px-2 py-0.5 rounded border border-red-800/50 font-bold uppercase tracking-wider">
                      4K Motion Render
                    </span>
                  </div>
                </div>

                {/* Main 3D Video Viewport Container */}
                <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                  
                  {/* Dynamic Visual Media Asset */}
                  <img
                    src={getSceneImage()}
                    alt="Vídeo 3D Beduíno Paris Dakar Rodas de Luxo"
                    className={`w-full h-full object-cover transition-all duration-700 ${
                      isBeduinoPlaying ? 'scale-105 animate-pulse-subtle' : 'scale-100'
                    }`}
                  />

                  {/* Motion Light Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />
                  
                  {/* Glowing 3D Particle Light Effect */}
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-56 h-56 bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

                  {/* On-Screen Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                    
                    {/* Scene Switcher Pills */}
                    <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                      <button
                        onClick={() => setBeduinoScene('wheel')}
                        className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                          beduinoScene === 'wheel'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Roda Forjada
                      </button>
                      <button
                        onClick={() => setBeduinoScene('close')}
                        className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                          beduinoScene === 'close'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Órbita Glow
                      </button>
                      <button
                        onClick={() => setBeduinoScene('emblem')}
                        className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                          beduinoScene === 'emblem'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Logo 3D
                      </button>
                    </div>

                    {/* Playback Control */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsBeduinoPlaying(!isBeduinoPlaying)}
                        className="p-2.5 rounded-xl bg-black/80 backdrop-blur-md hover:bg-zinc-800 text-white border border-white/10 transition"
                        title={isBeduinoPlaying ? "Pausar Efeito 3D" : "Ativar Efeito 3D"}
                      >
                        {isBeduinoPlaying ? <Pause className="w-4 h-4 text-red-500" /> : <Play className="w-4 h-4 text-emerald-400" />}
                      </button>
                    </div>

                  </div>

                </div>

                {/* Footer Info */}
                <div className="p-3 bg-[#121215] border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-500" />
                    <span className="text-[11px]">Emblema Beduíno Paris Dakar 3D esculpido em liga leve forjada T6</span>
                  </div>
                  <button
                    onClick={handleWhatsAppInquiry}
                    className="text-[10px] text-red-400 font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
                  >
                    <span>Cotar Conjunto</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>
            ) : (
              /* --- 2. YOUTUBE OFFICIAL CHANNEL VIDEO --- */
              <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl transition">
                <div className="bg-slate-100 dark:bg-[#16161a] px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono font-medium text-slate-800 dark:text-zinc-300">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span>APRESENTAÇÃO VÍDEO // SHOWROOM</span>
                  </div>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono bg-slate-200 dark:bg-black/40 px-2 py-0.5 rounded border border-slate-300 dark:border-white/5">
                    16:9 HD Player
                  </span>
                </div>

                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={embedUrl}
                    title="Vídeo de Apresentação Paris Dakar Rodas & Pneus"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#121215] border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px]">Conheça os projetos de rodas forjadas e pneus heavy duty</span>
                  </div>
                  <span className="text-[10px] text-red-700 dark:text-red-400 font-bold uppercase tracking-wider">
                    Paris Dakar
                  </span>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
