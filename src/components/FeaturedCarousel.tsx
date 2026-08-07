import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, MessageCircle, Star, Eye } from 'lucide-react';
import { Product, B2BUser } from '../types';

interface FeaturedCarouselProps {
  products: Product[];
  b2bUser: B2BUser;
  onOpenDetails: (product: Product) => void;
  onConsultWhatsApp: (message: string, product: Product) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  products,
  b2bUser,
  onOpenDetails,
  onConsultWhatsApp
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  const scrollByCard = (direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('[data-featured-card]');
    const step = card ? card.offsetWidth + 20 : 320;
    track.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  };

  return (
    <section id="destaques-section" className="py-10 sm:py-12 bg-[#0A0A0A] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Section Heading */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/30 text-amber-400 border border-amber-800/40 text-[10px] font-bold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Selecionados pela Equipe Paris Dakar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-white">
              Destaques
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Os itens mais desejados por quem prepara caminhonetes 4x4, escolhidos direto no painel administrativo.
            </p>
          </div>

          {/* Arrow Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollByCard('left')}
              aria-label="Ver destaques anteriores"
              className="w-10 h-10 rounded-full bg-[#111111] border border-white/10 hover:border-[#8B0000] text-white flex items-center justify-center transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollByCard('right')}
              aria-label="Ver próximos destaques"
              className="w-10 h-10 rounded-full bg-[#111111] border border-white/10 hover:border-[#8B0000] text-white flex items-center justify-center transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Carousel Track */}
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => {
            const price = b2bUser.isLoggedIn && product.b2bPrice ? product.b2bPrice : product.price;
            const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

            return (
              <div
                key={product.id}
                data-featured-card
                onClick={() => onOpenDetails(product)}
                className="group cursor-pointer snap-start shrink-0 w-[260px] sm:w-[300px] bg-[#111111] border border-white/10 hover:border-[#8B0000] rounded-xl overflow-hidden shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-[4/3] w-full bg-[#1a1a1a] overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-3 left-3 bg-[#8B0000] text-white px-2.5 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Destaque</span>
                  </div>

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="px-3.5 py-2 rounded bg-black/90 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                      <Eye className="w-3.5 h-3.5 text-[#8B0000]" />
                      Ver Detalhes
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold uppercase tracking-widest text-[#8B0000]">{product.brand}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-black uppercase italic tracking-tight text-white line-clamp-2 leading-snug min-h-[2.2rem] group-hover:text-[#8B0000] transition-colors">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-base font-black italic text-white">{formattedPrice}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onConsultWhatsApp(
                          `Olá equipe Paris Dakar! 🏁\n\nVi o item em Destaque no site e quero consultar disponibilidade:\n\n📌 *${product.name}*\n💰 *Valor:* ${formattedPrice}`,
                          product
                        );
                      }}
                      className="w-9 h-9 rounded-full bg-[#25D366] text-black hover:bg-[#1da851] flex items-center justify-center shadow-md transition-all shrink-0"
                      title="Falar com Especialista no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 fill-black text-black" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
