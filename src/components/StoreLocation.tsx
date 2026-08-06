import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Clock, Phone, MessageCircle, ExternalLink } from 'lucide-react';

interface StoreLocationProps {
  address: string;
  phone?: string;
  onConsultWhatsApp: (msg?: string) => void;
}

const OPENING_HOURS = [
  { days: 'Segunda a sexta', hours: '08h00 — 18h00' },
  { days: 'Sábado', hours: '08h00 — 13h00' },
  { days: 'Domingo e feriados', hours: 'Atendimento via WhatsApp' }
];

/**
 * Mapa da unidade.
 *
 * O iframe do Google Maps só é injetado quando a seção entra na viewport
 * (IntersectionObserver). Isso evita que o mapa concorra com o carregamento
 * inicial da página e garante que ele monte já com o container medido — o
 * embed do Google renderiza em branco quando é criado dentro de um elemento
 * ainda sem altura definida.
 */
export const StoreLocation: React.FC<StoreLocationProps> = ({ address, phone, onConsultWhatsApp }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const query = encodeURIComponent(address);
  const embedUrl = `https://www.google.com/maps?q=${query}&hl=pt-BR&z=16&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const wazeUrl = `https://waze.com/ul?q=${query}&navigate=yes`;

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShowMap(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShowMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Um endereço novo (alterado no painel admin) precisa recarregar o embed.
  useEffect(() => {
    setMapReady(false);
  }, [address]);

  return (
    <section
      id="localizacao"
      ref={sectionRef}
      className="pd-bg-alt border-t pd-border scroll-mt-24"
      aria-labelledby="localizacao-titulo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="pd-badge pd-badge-brand mb-3">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              Showroom e centro de distribuição
            </span>
            <h2
              id="localizacao-titulo"
              className="pd-serif text-2xl sm:text-3xl font-extrabold uppercase tracking-tight pd-text"
            >
              Venha conhecer a Paris Dakar
            </h2>
            <p className="pd-text-2 text-sm mt-2 max-w-xl leading-relaxed">
              Instalação e balanceamento no local, com conferência de furação, offset e altura antes
              da montagem.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <Navigation className="w-4 h-4" />
              <span>Traçar rota</span>
            </a>
            <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <ExternalLink className="w-4 h-4" />
              <span>Abrir no Waze</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Mapa */}
          <div className="lg:col-span-8">
            <div className="pd-card overflow-hidden p-0">
              <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[440px] pd-surface-2">
                {showMap && (
                  <iframe
                    key={embedUrl}
                    title={`Mapa da unidade Paris Dakar Rodas e Pneus — ${address}`}
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    onLoad={() => setMapReady(true)}
                  />
                )}

                {/* Placeholder enquanto o embed não pintou */}
                {!mapReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none pd-surface-2">
                    <MapPin className="w-8 h-8 pd-brand-text animate-pulse-red" aria-hidden="true" />
                    <p className="text-xs font-bold uppercase tracking-widest pd-text-3">
                      Carregando mapa da unidade
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dados da unidade */}
          <div className="lg:col-span-4 space-y-4">
            <div className="pd-card p-5 space-y-4">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 pd-brand-text shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="pd-label mb-1">Endereço</p>
                  <p className="text-sm pd-text leading-relaxed">{address}</p>
                </div>
              </div>

              {phone && (
                <div className="flex gap-3 pt-4 border-t pd-hairline">
                  <Phone className="w-4 h-4 pd-brand-text shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="pd-label mb-1">Telefone</p>
                    <a
                      href={`tel:${phone.replace(/\D/g, '')}`}
                      className="text-sm pd-text hover:underline"
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t pd-hairline">
                <Clock className="w-4 h-4 pd-brand-text shrink-0 mt-0.5" aria-hidden="true" />
                <div className="w-full">
                  <p className="pd-label mb-2">Horário de atendimento</p>
                  <ul className="space-y-1.5">
                    {OPENING_HOURS.map((slot) => (
                      <li key={slot.days} className="flex justify-between gap-3 text-xs">
                        <span className="pd-text-2">{slot.days}</span>
                        <span className="pd-text font-semibold whitespace-nowrap">{slot.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onConsultWhatsApp(
                  'Olá! Gostaria de agendar uma visita ao showroom da Paris Dakar para montagem de rodas e pneus.'
                )
              }
              className="btn btn-whats btn-block btn-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Agendar visita</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
