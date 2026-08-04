import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MessageCircle,
  Layers,
  Sparkles,
  ShieldCheck,
  Tv,
  Film,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroSectionProps {
  onConsultWhatsApp: (msg?: string) => void;
  onExploreCatalog: () => void;
  siteSettings?: SiteSettings;
}

interface Slide3D {
  id: string;
  image: string;
  tag: string;
  title: string;
  highlight: string;
  subtitle: string;
  inquiryMsg: string;
}

const SLIDES_3D: Slide3D[] = [
  {
    id: 'truck-wheel',
    image: '/hero_3d_truck_wheel.jpg',
    tag: 'BEDUÍNO 3D EXCLUSIVE',
    title: 'PARIS DAKAR',
    highlight: 'FORGED 3D',
    subtitle: 'Rodas Forjadas Heavy-Duty & Pneus Off-Road de Alta Performance para Caminhonetes 4x4',
    inquiryMsg: 'Olá! Vi a Roda Forjada 3D para Caminhonete 4x4 no site Paris Dakar e gostaria de solicitar um orçamento.'
  },
  {
    id: 'beduino-emblem',
    image: '/hero_3d_beduino_emblem.jpg',
    tag: 'LIGA FORGED AERO T6',
    title: 'EMBLEMA 3D',
    highlight: 'BEDUÍNO LUXO',
    subtitle: 'O Símbolo Lendário do Rali Paris Dakar esculpido em Alumínio Aeroespacial com Acabamento 3D',
    inquiryMsg: 'Olá! Gostaria de saber mais sobre as rodas com o Emblema 3D Beduíno em liga forjada T6.'
  },
  {
    id: 'desert-rally',
    image: '/hero_3d_desert_rally.jpg',
    tag: 'BEADLOCK PERFORMANCE',
    title: 'RALLY DAKAR',
    highlight: 'OFF-ROAD 4x4',
    subtitle: 'Engenharia de Máxima Resistência em Terrenos Desérticos com Rodas Beadlock de Alta Carga',
    inquiryMsg: 'Olá! Vi o visual Rally Dakar Off-Road no site e gostaria de consultar combos para meu veículo.'
  },
  {
    id: 'wheel-main',
    image: '/hero_beduino_wheel_3d.jpg',
    tag: 'DESIGN PATENTEADO',
    title: 'RODAS ESPORTIVAS',
    highlight: 'MONOBLOCO 3D',
    subtitle: 'Acabamento Monobloco em Dark Chrome com Calota Central Beduíno Tridimensional',
    inquiryMsg: 'Olá! Tenho interesse nas Rodas Esportivas Monobloco 3D da Paris Dakar.'
  },
  {
    id: 'orbit-glow',
    image: '/hero_beduino_close_3d.jpg',
    tag: 'MOTION RENDER 4K',
    title: 'ÓRBITA BEDUÍNO',
    highlight: 'GLOW EFFECT',
    subtitle: 'Efeito Luminescente Neon & Detalhes Tridimensionais de Precisão Milimétrica',
    inquiryMsg: 'Olá! Gostaria de consultar os modelos de rodas com acabamento Beduíno Glow.'
  },
  {
    id: 'logo-render',
    image: '/logo_3d_dark.jpg',
    tag: 'SHOWROOM PREMIUM',
    title: 'PARIS DAKAR',
    highlight: 'RODAS & PNEUS',
    subtitle: 'Excelência, Garantia de Compatibilidade Técnica e Tradição na Linha Off-Road e Esportiva',
    inquiryMsg: 'Olá equipe Paris Dakar! Gostaria de falar com um especialista em rodas e pneus de luxo.'
  }
];

// Helper to convert YouTube URL into standard embed link
function getYouTubeEmbedUrl(urlOrId?: string): string {
  if (!urlOrId) {
    return 'https://www.youtube.com/embed/5qap5aO4i9A?autoplay=0&rel=0';
  }
  let raw = urlOrId.trim();
  if (raw.includes('<iframe') && raw.includes('src=')) {
    const srcMatch = raw.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) raw = srcMatch[1];
  }
  if (raw.length === 11 && !raw.includes('/') && !raw.includes('.')) {
    return `https://www.youtube.com/embed/${raw}?autoplay=0&rel=0`;
  }
  const patterns = [
    /youtube\.com\/watch\?v=([^#&?]+)/,
    /youtu\.be\/([^#&?]+)/,
    /youtube\.com\/embed\/([^#&?]+)/,
    /youtube\.com\/shorts\/([^#&?]+)/
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match && match[1] && match[1].trim().length === 11) {
      return `https://www.youtube.com/embed/${match[1].trim()}?autoplay=0&rel=0`;
    }
  }
  return raw;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onConsultWhatsApp,
  onExploreCatalog,
  siteSettings
}) => {
  // Mode switch: 'carousel3d' vs 'video'
  const [viewTab, setViewTab] = useState<'carousel3d' | 'video'>('carousel3d');
  
  // Carousel State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const embedUrl = getYouTubeEmbedUrl(siteSettings?.youtubeVideoUrl);

  const currentSlide = SLIDES_3D[currentIndex];

  // Auto-play timer (4.5 seconds)
  useEffect(() => {
    if (isPlaying && viewTab === 'carousel3d') {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDES_3D.length);
      }, 4500);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPlaying, viewTab]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES_3D.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES_3D.length) % SLIDES_3D.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStart(null);
  };

  return (
    <div className="relative w-full bg-slate-950 text-white overflow-hidden border-b border-slate-800 dark:border-white/10">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* TOP FLOATING MODE SWITCHER & COUNTER */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        
        {/* Tab Selector Bar */}
        <div className="pointer-events-auto flex items-center p-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 shadow-xl">
          <button
            onClick={() => setViewTab('carousel3d')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              viewTab === 'carousel3d'
                ? 'bg-red-700 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Showcase 3D</span>
          </button>

          <button
            onClick={() => setViewTab('video')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              viewTab === 'video'
                ? 'bg-red-700 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Vídeo Oficial</span>
          </button>
        </div>

        {/* Counter Badge & Play/Pause */}
        {viewTab === 'carousel3d' && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2.5 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 shadow-xl text-xs font-mono">
            <span className="text-red-400 font-bold">
              {String(currentIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400">{String(SLIDES_3D.length).padStart(2, '0')}</span>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="ml-1 p-1 hover:bg-white/10 rounded transition text-zinc-300 hover:text-white"
              title={isPlaying ? "Pausar Carrossel" : "Iniciar Auto-Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        )}
      </div>

      {/* VIEWPORT AREA */}
      {viewTab === 'carousel3d' ? (
        /* --- 1. FULL WIDTH 3D ELEGANT CAROUSEL --- */
        <div
          className="relative w-full h-[520px] sm:h-[580px] lg:h-[650px] xl:h-[700px] overflow-hidden group select-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Progress Bar for Auto-Play */}
          {isPlaying && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-40 overflow-hidden">
              <div
                key={currentIndex}
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-500 transition-all duration-[4500ms] ease-linear w-full origin-left animate-progress"
                style={{
                  animation: 'progressBar 4.5s linear infinite'
                }}
              />
            </div>
          )}

          {/* 3D Images Slides Stack */}
          {SLIDES_3D.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Image with subtle Ken Burns scale animation */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className={`w-full h-full object-cover object-center transition-transform duration-[6000ms] ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                />

                {/* Gradient Overlays for High Contrast & Cinematic Feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/50" />
              </div>
            );
          })}

          {/* PREVIOUS / NEXT ARROWS */}
          <button
            onClick={handlePrev}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 hover:bg-red-700/90 text-white backdrop-blur-md border border-white/20 transition transform hover:scale-110 shadow-2xl opacity-80 sm:opacity-0 group-hover:opacity-100"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 hover:bg-red-700/90 text-white backdrop-blur-md border border-white/20 transition transform hover:scale-110 shadow-2xl opacity-80 sm:opacity-0 group-hover:opacity-100"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* FLOATING ELEGANT GLASSMOPHISM BRANDING & ACTION PANEL */}
          <div className="absolute bottom-16 sm:bottom-12 left-4 sm:left-8 right-4 sm:right-auto max-w-2xl z-30">
            <div className="bg-black/80 backdrop-blur-xl border border-white/15 p-5 sm:p-7 rounded-2xl shadow-2xl space-y-3.5 transition-all transform animate-fade-in">
              
              {/* Tag Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-600/40 text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{currentSlide.tag}</span>
              </div>

              {/* Title & Highlight */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-none text-white">
                {currentSlide.title}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-400">
                  {currentSlide.highlight}
                </span>
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xl">
                {currentSlide.subtitle}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => onConsultWhatsApp(currentSlide.inquiryMsg)}
                  className="btn-paris text-white font-bold px-5 py-3 rounded-xl uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg transition transform active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Orçamento WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onExploreCatalog}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-5 py-3 rounded-xl uppercase tracking-wider text-xs flex items-center gap-2 transition"
                >
                  <Layers className="w-4 h-4" />
                  <span>Ver Catálogo</span>
                </button>
              </div>

            </div>
          </div>

          {/* BOTTOM SLIDE PILLS & THUMBNAIL SELECTOR BAR */}
          <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-2 px-4 pointer-events-auto">
            {SLIDES_3D.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    isActive
                      ? 'w-8 sm:w-10 h-2.5 bg-red-600 shadow-lg shadow-red-600/50'
                      : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80'
                  }`}
                  title={slide.title}
                />
              );
            })}
          </div>

        </div>
      ) : (
        /* --- 2. FULL WIDTH YOUTUBE VIDEO PLAYER --- */
        <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[650px] bg-black flex items-center justify-center">
          <div className="w-full h-full max-w-6xl mx-auto p-4 sm:p-8 flex flex-col justify-center">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
              <iframe
                src={embedUrl}
                title="Vídeo Oficial Paris Dakar Rodas & Pneus"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Assista ao vídeo institucional de projetos e showroom Paris Dakar</span>
              </div>
              <button
                onClick={() => onConsultWhatsApp("Olá! Assisti ao vídeo institucional e gostaria de falar com um atendente.")}
                className="text-red-400 font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                <span>Falar com Atendente</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
