import React from 'react';
import { MessageCircle, ArrowRight, ShieldCheck, Gauge, Ruler, Truck, MapPin } from 'lucide-react';
import { ParisDakarLogo } from './ParisDakarLogo';

interface HeroProps {
  title: string;
  subtitle: string;
  onConsultWhatsApp: (details?: string) => void;
  onExploreCatalog: () => void;
  onOpenLocation: () => void;
}

const PILLARS = [
  { icon: Gauge, label: 'Rodas Forjadas', detail: 'Liga T6 heavy-duty' },
  { icon: Truck, label: 'Pneus MT / AT', detail: 'Off-road e expedição' },
  { icon: Ruler, label: 'Furação Exata', detail: 'Offset e tala conferidos' },
  { icon: ShieldCheck, label: 'Garantia 5 Anos', detail: 'Suporte técnico direto' }
];

/**
 * Abertura do site. Substitui o antigo visualizador 3D (Three.js) por uma
 * composição estática e elegante: o emblema da marca em relevo 3D via CSS,
 * sem nenhum megabyte de WebGL.
 */
export const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  onConsultWhatsApp,
  onExploreCatalog,
  onOpenLocation
}) => {
  return (
    <section className="pd-mesh pd-grid-lines relative overflow-hidden border-b pd-border">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Coluna de texto e conversão */}
          <div className="lg:col-span-7 space-y-7">
            <span className="pd-badge pd-badge-brand">
              <span
                className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-red"
                aria-hidden="true"
              />
              Especialistas em caminhonetes 4x4
            </span>

            <h1 className="pd-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[0.98] pd-text">
              {title}
            </h1>

            <p className="pd-text-2 text-sm sm:text-base leading-relaxed max-w-2xl">{subtitle}</p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() =>
                  onConsultWhatsApp(
                    'Olá equipe Paris Dakar! Gostaria de uma consultoria de rodas e pneus para a minha caminhonete 4x4.'
                  )
                }
                className="btn btn-primary btn-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar com especialista</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button type="button" onClick={onExploreCatalog} className="btn btn-outline btn-lg">
                <span>Explorar catálogo</span>
              </button>

              <button type="button" onClick={onOpenLocation} className="btn btn-ghost btn-lg">
                <MapPin className="w-4 h-4" />
                <span>Como chegar</span>
              </button>
            </div>

            {/* Pilares da marca */}
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              {PILLARS.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="pd-card p-3.5">
                  <Icon className="w-4 h-4 pd-brand-text mb-2" aria-hidden="true" />
                  <dt className="text-xs font-bold pd-text leading-tight">{label}</dt>
                  <dd className="text-[0.68rem] pd-text-3 mt-0.5 leading-snug">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Coluna do emblema — a marca como peça central da composição */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative flex items-center justify-center">
              <div
                className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full blur-3xl opacity-70"
                style={{ background: 'radial-gradient(circle, var(--pd-mesh-a), transparent 68%)' }}
                aria-hidden="true"
              />
              <div className="logo-watermark relative">
                <ParisDakarLogo variant="stacked" height={132} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
