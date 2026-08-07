import React from 'react';
import { Instagram, Heart, MessageCircle, ExternalLink, ImageOff } from 'lucide-react';

interface InstagramPost {
  id: string;
  vehicle: string;
  setup: string;
  image: string;
  likes: number;
  comments: number;
}

const PROFILE_URL = 'https://www.instagram.com/parisdakarrodas/';

// Sem fotos de banco de imagens: até essas montagens serem sincronizadas com
// posts reais do Instagram (via API/admin), cada card mostra um placeholder
// neutro em vez de uma foto de estoque fingindo ser um cliente real.
const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'post-1',
    vehicle: 'Toyota Hilux GR-Sport 2026',
    setup: 'Rodas Forged Heavy-Duty 17x9 + pneus 35" Mud Terrain',
    image: '',
    likes: 1240,
    comments: 86
  },
  {
    id: 'post-2',
    vehicle: 'Ford Ranger Raptor V6',
    setup: 'Rodas Dakar Tactical 20x9.5 + kit lift 2.5" Nitro',
    image: '',
    likes: 980,
    comments: 64
  },
  {
    id: 'post-3',
    vehicle: 'Chevrolet S10 High Country 4x4',
    setup: 'Rodas Satin Bronze 18" + pneus All-Terrain 285/70R17',
    image: '',
    likes: 1850,
    comments: 112
  },
  {
    id: 'post-4',
    vehicle: 'RAM 2500 Laramie Night Edition',
    setup: 'Combo 20x10 ET-24 + pneus 37" e espaçadores billet 38mm',
    image: '',
    likes: 2100,
    comments: 145
  }
];

export const InstagramFeed: React.FC = () => {
  return (
    <section className="pd-page border-t pd-border py-14" aria-labelledby="instagram-titulo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="pd-badge pd-badge-brand mb-3">
              <Instagram className="w-3 h-3" aria-hidden="true" />
              @parisdakarrodas
            </span>
            <h2
              id="instagram-titulo"
              className="pd-serif text-2xl sm:text-3xl font-extrabold uppercase tracking-tight pd-text"
            >
              Projetos e caminhonetes preparadas
            </h2>
            <p className="text-sm pd-text-2 mt-2 max-w-xl leading-relaxed">
              Montagens e expedições reais em caminhonetes 4x4 enviadas por clientes de todo o Brasil.
            </p>
          </div>

          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline shrink-0"
          >
            <Instagram className="w-4 h-4 shrink-0" />
            <span>Seguir no Instagram</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INSTAGRAM_POSTS.map((post) => (
            <a
              key={post.id}
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pd-card pd-card-hover group overflow-hidden block"
            >
              <div className="aspect-[4/3] w-full overflow-hidden relative pd-surface-2">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.vehicle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    width={560}
                    height={420}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 pd-text-3">
                    <ImageOff className="w-7 h-7" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Foto em breve</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 text-white text-sm font-bold">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-current" aria-hidden="true" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    {post.comments}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-1">
                <h3 className="text-xs font-bold pd-text truncate">{post.vehicle}</h3>
                <p className="text-[0.68rem] pd-text-3 pd-clamp-2 leading-snug">{post.setup}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
