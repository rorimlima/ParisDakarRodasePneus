import React from 'react';
import { Instagram, ExternalLink, Heart, MessageCircle, PlayCircle } from 'lucide-react';
import { SiteSettings } from '../types';

interface InstagramFeedProps {
  siteSettings: SiteSettings;
}

// Visual high-fidelity mock metadata for default reels to avoid iframe blocking
const REELS_METADATA = [
  {
    id: 'DF_L0z2Pv9d',
    url: 'https://www.instagram.com/reel/DF_L0z2Pv9d/',
    cover: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    title: 'Ford Ranger Raptor',
    desc: 'Preparação bruta com Rodas Forjadas Dakar Aro 17" e Pneus Dakar Mud-Terrain 35" instalados.',
    likes: '1.2k',
    comments: '48'
  },
  {
    id: 'DEd4WyxP7bX',
    url: 'https://www.instagram.com/reel/DEd4WyxP7bX/',
    cover: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=600&q=80',
    title: 'Toyota Hilux SW4',
    desc: 'Kit Lift de Suspensão 2.5" e Rodas Heavy-Duty Black Edition em teste off-road extremo.',
    likes: '890',
    comments: '32'
  },
  {
    id: 'DEtP3y0vNfW',
    url: 'https://www.instagram.com/reel/DEtP3y0vNfW/',
    cover: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
    title: 'Dodge RAM 2500',
    desc: 'O monstro equipado com Rodas Tactical Forged 20x10 e Pneus Mud 37". Presença imponente!',
    likes: '2.4k',
    comments: '115'
  },
  {
    id: 'DDy-H9mPF2k',
    url: 'https://www.instagram.com/reel/DDy-H9mPF2k/',
    cover: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    title: 'Triton L200 Savana',
    desc: 'Espaçadores Billet Alumínio 38mm e Pneus All-Terrain prontos para trilhas pesadas.',
    likes: '950',
    comments: '24'
  }
];

const DEFAULT_REELS = [
  'https://www.instagram.com/reel/DF_L0z2Pv9d/',
  'https://www.instagram.com/reel/DEd4WyxP7bX/',
  'https://www.instagram.com/reel/DEtP3y0vNfW/',
  'https://www.instagram.com/reel/DDy-H9mPF2k/'
];

export const InstagramFeed: React.FC<InstagramFeedProps> = ({ siteSettings }) => {
  const getInstagramId = (urlOrId: string): string => {
    if (!urlOrId) return '';
    const match = urlOrId.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : urlOrId.trim();
  };

  const reelsToDisplay = siteSettings.instagramReels && siteSettings.instagramReels.length === 4
    ? siteSettings.instagramReels
    : DEFAULT_REELS;

  const getReelMetadata = (url: string, index: number) => {
    const id = getInstagramId(url);
    const matched = REELS_METADATA.find(m => m.id === id);
    if (matched) return matched;
    
    // Fallback for custom added reels in admin panel
    const fallbacks = [
      {
        id,
        url: url.startsWith('http') ? url : `https://www.instagram.com/reel/${id}/`,
        cover: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
        title: 'Projeto 4x4 Custom',
        desc: 'Confira as especificações deste projeto em nossa página oficial.',
        likes: '350',
        comments: '12'
      },
      {
        id,
        url: url.startsWith('http') ? url : `https://www.instagram.com/reel/${id}/`,
        cover: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=600&q=80',
        title: 'Preparação Dakar Spec',
        desc: 'Confira o teste completo deste conjunto de rodas e pneus.',
        likes: '420',
        comments: '18'
      },
      {
        id,
        url: url.startsWith('http') ? url : `https://www.instagram.com/reel/${id}/`,
        cover: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
        title: 'Monster Truck Build',
        desc: 'Upgrade de suspensão e pneus de alto desempenho.',
        likes: '510',
        comments: '22'
      },
      {
        id,
        url: url.startsWith('http') ? url : `https://www.instagram.com/reel/${id}/`,
        cover: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        title: 'Expedição Offroad',
        desc: 'Montagem especial para expedições de longa distância e overland.',
        likes: '280',
        comments: '9'
      }
    ];
    return fallbacks[index % fallbacks.length];
  };

  return (
    <section className="py-12 bg-slate-50 dark:bg-zinc-950 border-t border-b border-slate-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-500 border border-pink-200 dark:border-pink-850/40 text-xs font-bold uppercase mb-2">
              <Instagram className="w-3.5 h-3.5" />
              <span>@parisdakarrodas no Instagram</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight font-heading">
              Projetos &amp; Caminhonetes Preparadas
            </h2>
            <p className="text-xs sm:text-sm text-slate-555 dark:text-zinc-400 mt-1">
              Confira montagens e expedições reais em caminhonetes 4x4 enviadas pelos nossos clientes em todo o Brasil.
            </p>
          </div>

          <a
            href="https://www.instagram.com/parisdakarrodas/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs uppercase shadow-md hover:opacity-90 transition shrink-0"
          >
            <Instagram className="w-4 h-4" />
            <span>Seguir no Instagram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Grid of Instagram Highlights (Preview Cards to bypass blocking) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reelsToDisplay.map((url, index) => {
            const meta = getReelMetadata(url, index);
            if (!meta.id) return null;
            return (
              <a
                key={index}
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-md hover:shadow-xl hover:border-red-650 dark:hover:border-red-900/60 transition-all duration-300 flex flex-col h-[400px]"
              >
                {/* Background Image Container */}
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={meta.cover}
                    alt={meta.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Subtle Instagram Watermark */}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                    <span>@parisdakarrodas</span>
                  </div>

                  {/* Top Right Duration Tag */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest text-zinc-300 border border-white/5">
                    Reel
                  </div>

                  {/* Play Icon Hover Overlay */}
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                  </div>

                  {/* Card bottom text area */}
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/85 to-transparent text-white space-y-1.5 flex flex-col justify-end pt-12">
                    <h3 className="text-sm font-extrabold italic tracking-tight text-white uppercase flex items-center gap-1">
                      <span>{meta.title}</span>
                    </h3>
                    <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                      {meta.desc}
                    </p>
                    
                    {/* Likes & Comments Counters */}
                    <div className="flex items-center gap-4 pt-1.5 text-[10px] text-zinc-400 border-t border-zinc-900/60 mt-1">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                        <strong>{meta.likes}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                        <strong>{meta.comments}</strong>
                      </span>
                      <span className="ml-auto text-[9px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-0.5">
                        Assistir <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
};
