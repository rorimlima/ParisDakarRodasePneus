import React, { useState } from 'react';
import { Instagram, ExternalLink, Loader2 } from 'lucide-react';
import { SiteSettings } from '../types';

interface InstagramFeedProps {
  siteSettings: SiteSettings;
}

const DEFAULT_REELS = [
  'https://www.instagram.com/reel/DF_L0z2Pv9d/',
  'https://www.instagram.com/reel/DEd4WyxP7bX/',
  'https://www.instagram.com/reel/DEtP3y0vNfW/',
  'https://www.instagram.com/reel/DDy-H9mPF2k/'
];

export const InstagramFeed: React.FC<InstagramFeedProps> = ({ siteSettings }) => {
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});

  const getInstagramId = (urlOrId: string): string => {
    if (!urlOrId) return '';
    const match = urlOrId.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : urlOrId.trim();
  };

  const reelsToDisplay = siteSettings.instagramReels && siteSettings.instagramReels.length === 4
    ? siteSettings.instagramReels
    : DEFAULT_REELS;

  return (
    <section className="py-12 bg-slate-100 dark:bg-zinc-950 border-t border-b border-slate-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/20 text-pink-500 border border-pink-800/30 text-xs font-bold uppercase mb-2">
              <Instagram className="w-3.5 h-3.5" />
              <span>@parisdakarrodas no Instagram</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              Projetos & Caminhonetes Preparadas
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
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

        {/* Grid of Instagram Highlights (Real Videos / Reels Embeds) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reelsToDisplay.map((url, index) => {
            const reelId = getInstagramId(url);
            if (!reelId) return null;
            return (
              <div
                key={index}
                className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-[480px]"
              >
                {!loadedMap[index] && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-900 z-10 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      Carregando vídeo...
                    </span>
                  </div>
                )}
                <iframe
                  src={`https://www.instagram.com/reel/${reelId}/embed`}
                  className="w-full h-full border-0 rounded-2xl overflow-hidden bg-zinc-950"
                  scrolling="no"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  onLoad={() => setLoadedMap(prev => ({ ...prev, [index]: true }))}
                />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
