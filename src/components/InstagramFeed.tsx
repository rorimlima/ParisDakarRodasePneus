import React from 'react';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';

interface InstagramPost {
  id: string;
  vehicle: string;
  setup: string;
  image: string;
  likes: number;
  comments: number;
}

const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'post-1',
    vehicle: 'Toyota Hilux GR-Sport 2026',
    setup: 'Rodas Forged Heavy-Duty 17x9 + Pneus 35" Mud Terrain',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80',
    likes: 1240,
    comments: 86
  },
  {
    id: 'post-2',
    vehicle: 'Ford Ranger Raptor V6',
    setup: 'Rodas Dakar Tactical 20x9.5 + Kit Lift 2.5" Nitro',
    image: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=800&q=80',
    likes: 980,
    comments: 64
  },
  {
    id: 'post-3',
    vehicle: 'Chevrolet S10 High Country 4x4',
    setup: 'Rodas Satin Bronze 18" + Pneus All-Terrain 285/70R17',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    likes: 1850,
    comments: 112
  },
  {
    id: 'post-4',
    vehicle: 'RAM 2500 Laramie Night Edition',
    setup: 'Combo 20x10 ET-24 + Pneus 37" e Espaçadores Billet 38mm',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    likes: 2100,
    comments: 145
  }
];

export const InstagramFeed: React.FC = () => {
  return (
    <section className="py-8 sm:py-10 lg:py-12 bg-slate-100 dark:bg-zinc-950 border-t border-b border-slate-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/20 text-pink-500 border border-pink-800/30 text-[11px] sm:text-xs font-bold uppercase mb-2">
              <Instagram className="w-3.5 h-3.5 shrink-0" />
              <span>@parisdakarrodas no Instagram</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
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
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs uppercase shadow-md hover:opacity-90 transition shrink-0 w-full md:w-auto"
          >
            <Instagram className="w-4 h-4 shrink-0" />
            <span>Seguir no Instagram</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>

        {/* Grid of Instagram Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
          {INSTAGRAM_POSTS.map((post) => (
            <a
              key={post.id}
              href="https://www.instagram.com/parisdakarrodas/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <img
                  src={post.image}
                  alt={post.vehicle}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-white" />
                      {post.comments}
                    </span>
                  </div>
                  <span className="text-xs text-amber-300 font-semibold uppercase mt-1">
                    Ver no Instagram →
                  </span>
                </div>
              </div>

              <div className="p-2.5 xs:p-3 sm:p-4 space-y-1">
                <h4 className="text-[11px] xs:text-xs font-bold text-slate-900 dark:text-white truncate">
                  {post.vehicle}
                </h4>
                <p className="text-[10px] xs:text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                  {post.setup}
                </p>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};
