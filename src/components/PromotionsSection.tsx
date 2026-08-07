import React from 'react';
import { Tag, CalendarClock, MessageCircle } from 'lucide-react';
import { Promotion, Product } from '../types';

interface PromotionsSectionProps {
  promotions: Promotion[];
  products: Product[];
  onConsultWhatsApp: (message: string) => void;
}

const formatDate = (value?: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

export const PromotionsSection: React.FC<PromotionsSectionProps> = ({ promotions, products, onConsultWhatsApp }) => {
  const activePromotions = promotions.filter((promo) => promo.active);

  if (!activePromotions.length) return null;

  return (
    <section id="promocoes-section" className="py-10 sm:py-12 bg-[#0D0D0D] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/30 text-red-400 border border-red-800/40 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Condições por Tempo Limitado</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-white">
            Promoções
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Campanhas sazonais e temáticas cadastradas pela nossa equipe, como Dia dos Pais, Black Friday e lançamentos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activePromotions.map((promo) => {
            const linkedProducts = products.filter((p) => promo.productIds.includes(p.id));
            const endLabel = formatDate(promo.endDate);
            const whatsAppMessage = `Olá equipe Paris Dakar! 🏁\n\nQuero aproveitar a promoção *${promo.promoType}*: "${promo.title}"${
              promo.discountLabel ? `\n🏷️ *Condição:* ${promo.discountLabel}` : ''
            }\n\nPodem me passar mais detalhes?`;

            return (
              <div
                key={promo.id}
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#8B0000] bg-[#111111] shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={promo.image}
                    alt={promo.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <span className="absolute top-3 left-3 bg-[#8B0000] text-white px-2.5 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase shadow-md">
                    {promo.promoType}
                  </span>

                  {promo.discountLabel && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-black px-2.5 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase shadow-md">
                      {promo.discountLabel}
                    </span>
                  )}

                  <h3 className="absolute bottom-3 left-4 right-4 text-sm sm:text-base font-black uppercase italic text-white leading-snug">
                    {promo.title}
                  </h3>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {promo.description && (
                      <p className="text-xs text-gray-400 leading-relaxed">{promo.description}</p>
                    )}

                    {endLabel && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>Válido até {endLabel}</span>
                      </div>
                    )}

                    {linkedProducts.length > 0 && (
                      <div className="flex -space-x-3 pt-1">
                        {linkedProducts.slice(0, 4).map((p) => (
                          <img
                            key={p.id}
                            src={p.image}
                            alt={p.name}
                            title={p.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-[#111111] shadow-md"
                          />
                        ))}
                        {linkedProducts.length > 4 && (
                          <span className="w-9 h-9 rounded-full bg-[#1a1a1a] border-2 border-[#111111] flex items-center justify-center text-[10px] font-bold text-gray-300">
                            +{linkedProducts.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onConsultWhatsApp(whatsAppMessage)}
                    className="w-full bg-[#25D366] text-black hover:bg-[#1da851] py-3 rounded font-black uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <MessageCircle className="w-4 h-4 fill-black text-black" />
                    <span>Aproveitar no WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
