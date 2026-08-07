import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { Product, B2BUser } from '../types';
import { ProductCard } from './ProductCard';

interface DestaqueCarouselProps {
  /** Já vem limitado a no máximo 4 itens — o painel admin controla quem entra aqui. */
  produtos: Product[];
  b2bUser: B2BUser;
  onOpenDetails: (product: Product) => void;
  onConsultWhatsApp: (message: string, product: Product) => void;
  onOpenB2BModal: () => void;
  isB2CLoggedIn: boolean;
  favorites: Product[];
  onAddToFavorites: (product: Product) => void;
  onRemoveFromFavorites: (productId: string) => void;
  onAddToCart: (product: Product) => void;
}

const INTERVALO_MS = 4500;

export const DestaqueCarousel: React.FC<DestaqueCarouselProps> = ({
  produtos,
  b2bUser,
  onOpenDetails,
  onConsultWhatsApp,
  onOpenB2BModal,
  isB2CLoggedIn,
  favorites,
  onAddToFavorites,
  onRemoveFromFavorites,
  onAddToCart
}) => {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [emReproducao, setEmReproducao] = useState(true);
  const [toqueInicial, setToqueInicial] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = produtos.length;

  // Garante um índice válido se a lista de destaques encolher (ex.: produto desativado).
  useEffect(() => {
    if (indiceAtual >= total) setIndiceAtual(0);
  }, [total, indiceAtual]);

  useEffect(() => {
    if (emReproducao && total > 1) {
      timerRef.current = setInterval(() => {
        setIndiceAtual((atual) => (atual + 1) % total);
      }, INTERVALO_MS);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [emReproducao, total]);

  if (total === 0) return null;

  const irParaProximo = () => setIndiceAtual((atual) => (atual + 1) % total);
  const irParaAnterior = () => setIndiceAtual((atual) => (atual - 1 + total) % total);

  const handleTouchStart = (e: React.TouchEvent) => setToqueInicial(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (toqueInicial === null) return;
    const diferenca = toqueInicial - e.changedTouches[0].clientX;
    if (diferenca > 50) irParaProximo();
    else if (diferenca < -50) irParaAnterior();
    setToqueInicial(null);
  };

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setEmReproducao(false)}
      onMouseLeave={() => setEmReproducao(true)}
    >
      <div className="flex items-center justify-between gap-3 pd-badge pd-badge-gold !inline-flex w-fit">
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{total} {total === 1 ? 'destaque selecionado' : 'destaques selecionados'} pela loja</span>
      </div>

      <div
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Produtos em destaque"
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${indiceAtual * 100}%)` }}
        >
          {produtos.map((produto) => (
            <div key={produto.id} className="w-full shrink-0 px-0.5">
              <div className="sm:max-w-sm sm:mx-auto">
                <ProductCard
                  product={produto}
                  b2bUser={b2bUser}
                  onOpenDetails={onOpenDetails}
                  onConsultWhatsApp={(msg) => onConsultWhatsApp(msg, produto)}
                  onOpenB2BModal={onOpenB2BModal}
                  isB2CLoggedIn={isB2CLoggedIn}
                  isFavorited={favorites.some((f) => f.id === produto.id)}
                  onAddToFavorites={() => onAddToFavorites(produto)}
                  onRemoveFromFavorites={() => onRemoveFromFavorites(produto.id)}
                  onAddToCart={() => onAddToCart(produto)}
                />
              </div>
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={irParaAnterior}
              aria-label="Destaque anterior"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={irParaProximo}
              aria-label="Próximo destaque"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setEmReproducao((atual) => !atual)}
            aria-label={emReproducao ? 'Pausar carrossel' : 'Retomar carrossel'}
            className="p-1.5 rounded-full pd-surface-2 border pd-border pd-text-2 hover:pd-brand-text transition"
          >
            {emReproducao ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {produtos.map((produto, idx) => (
            <button
              key={produto.id}
              type="button"
              onClick={() => setIndiceAtual(idx)}
              aria-label={`Ir para o destaque ${idx + 1}`}
              aria-current={idx === indiceAtual}
              className={`h-2 rounded-full transition-all ${
                idx === indiceAtual ? 'w-6 bg-[var(--pd-brand)]' : 'w-2 pd-surface-2 border pd-border'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
