import React from 'react';
import { MessageCircle, Eye, Star, Heart, ShoppingCart, ImageOff } from 'lucide-react';
import { Product, B2BUser } from '../types';

interface ProductCardProps {
  product: Product;
  b2bUser: B2BUser;
  onOpenDetails: (product: Product) => void;
  onConsultWhatsApp: (message: string) => void;
  onOpenB2BModal: () => void;
  // Favoritos e carrinho (apenas B2C logado)
  isB2CLoggedIn?: boolean;
  isFavorited?: boolean;
  onAddToFavorites?: () => void;
  onRemoveFromFavorites?: () => void;
  onAddToCart?: () => void;
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  b2bUser,
  onOpenDetails,
  onConsultWhatsApp,
  isB2CLoggedIn = false,
  isFavorited = false,
  onAddToFavorites,
  onRemoveFromFavorites,
  onAddToCart
}) => {
  const effectivePrice = b2bUser.isLoggedIn && product.b2bPrice ? product.b2bPrice : product.price;
  const formattedPrice = brl.format(effectivePrice);
  const formattedOriginalPrice = product.originalPrice ? brl.format(product.originalPrice) : null;

  const handleWhatsAppRoute = (e: React.MouseEvent) => {
    e.stopPropagation();

    const specsSummary = [
      product.specs.aro && `Aro ${product.specs.aro}`,
      product.specs.furacao && `Furação: ${product.specs.furacao}`,
      product.specs.offset && `Offset: ${product.specs.offset}`,
      product.specs.tala && `Tala: ${product.specs.tala}`,
      product.specs.medidaPneu && `Medida: ${product.specs.medidaPneu}`,
      product.specs.acabamento && `Cor: ${product.specs.acabamento}`
    ]
      .filter(Boolean)
      .join(' | ');

    onConsultWhatsApp(
      `Olá equipe Paris Dakar Rodas e Pneus! 🏁\n\nGostaria de consultar a disponibilidade do item:\n\n📌 *${product.name}*\n🏷️ *SKU:* ${product.sku}\n🔧 *Especificações:* ${specsSummary}\n💰 *Valor:* ${formattedPrice}\n\nPor favor, confirmem a compatibilidade com o meu veículo!`
    );
  };

  return (
    <article
      onClick={() => onOpenDetails(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(product);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Ver especificações de ${product.name}`}
      className="pd-card pd-card-hover group cursor-pointer flex flex-col overflow-hidden"
    >
      {/* Imagem */}
      <div className="relative aspect-[4/3] w-full pd-surface-2 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            width={640}
            height={480}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 pd-text-3">
            <ImageOff className="w-8 h-8" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Foto em breve</span>
          </div>
        )}

        {product.badge && (
          <span className="absolute top-3 left-3 pd-badge !bg-[var(--pd-brand)] !text-white !border-transparent shadow-md">
            {product.badge}
          </span>
        )}

        {product.isPromocao && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white shadow-md">
            🔥 {product.promoTipo || 'Promoção'}
          </span>
        )}

        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="btn btn-sm btn-outline">
            <Eye className="w-3.5 h-3.5" />
            Ver especificações
          </span>
        </div>

        {/* Botões de favorito e carrinho — apenas B2C logado */}
        {isB2CLoggedIn && (
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); isFavorited ? onRemoveFromFavorites?.() : onAddToFavorites?.(); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 border ${
                isFavorited
                  ? 'bg-[#8B0000] border-red-900 text-white'
                  : 'bg-white/90 border-white/50 text-gray-600 hover:text-[#8B0000]'
              }`}
              aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
              className="w-8 h-8 rounded-full bg-white/90 border border-white/50 flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:bg-[#8B0000] hover:text-white hover:border-red-900 text-gray-600"
              aria-label="Adicionar ao carrinho"
              title="Adicionar ao carrinho"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[0.62rem]">
            <span className="font-bold uppercase tracking-[0.14em] pd-brand-text truncate">
              {product.brand}
            </span>

            <span className="flex items-center gap-1 pd-gold-text font-bold shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              {product.rating}
              <span className="pd-text-3 font-normal">({product.reviewsCount})</span>
            </span>
          </div>

          <h3 className="text-sm font-bold uppercase tracking-tight pd-text pd-clamp-2 leading-snug">
            {product.name}
          </h3>

          <div className="pt-2">
            <table className="clean-table">
              <tbody>
                {product.specs.aro && (
                  <tr>
                    <th scope="row">Aro</th>
                    <td className="font-bold pd-mono">{product.specs.aro}</td>
                    {product.specs.furacao && (
                      <>
                        <th scope="row">Furação</th>
                        <td className="font-bold pd-mono">{product.specs.furacao}</td>
                      </>
                    )}
                  </tr>
                )}
                {(product.specs.offset || product.specs.tala) && (
                  <tr className="hidden sm:table-row">
                    {product.specs.tala && (
                      <>
                        <th scope="row">Tala</th>
                        <td className="pd-mono">{product.specs.tala}</td>
                      </>
                    )}
                    {product.specs.offset && (
                      <>
                        <th scope="row">Offset</th>
                        <td className="pd-mono">{product.specs.offset}</td>
                      </>
                    )}
                  </tr>
                )}
                {product.specs.medidaPneu && (
                  <tr>
                    <th scope="row">Medida</th>
                    <td colSpan={3} className="font-bold pd-mono pd-brand-text">
                      {product.specs.medidaPneu}
                    </td>
                  </tr>
                )}
                {product.specs.acabamento && (
                  <tr>
                    <th scope="row">Acabamento</th>
                    <td colSpan={3} className="pd-text-2">
                      {product.specs.acabamento}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumo compacto de specs — só nos cards estreitos (2 colunas no celular) */}
          {(product.specs.aro || product.specs.medidaPneu) && (
            <div className="flex xs:hidden flex-wrap gap-1 pt-1">
              {product.specs.aro && (
                <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-[#1a1a1a] text-[#111111] dark:text-white px-1.5 py-0.5 rounded">
                  Aro {product.specs.aro}
                </span>
              )}
              {product.specs.medidaPneu && (
                <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-[#1a1a1a] text-[#B21B1B] px-1.5 py-0.5 rounded truncate max-w-full">
                  {product.specs.medidaPneu}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Preço e ação */}
        <div className="pt-3.5 border-t pd-hairline space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              {formattedOriginalPrice && (
                <span className="text-xs pd-text-3 line-through mr-2">{formattedOriginalPrice}</span>
              )}
              <span className="text-lg font-extrabold pd-text">{formattedPrice}</span>
              <span className="block text-[0.6rem] font-bold uppercase tracking-wider pd-text-3 mt-0.5">
                Em até 10x sem juros ou PIX
              </span>
            </div>

            <span className="pd-badge pd-badge-success shrink-0">Pronta entrega</span>
          </div>

          <button type="button" onClick={handleWhatsAppRoute} className="btn btn-whats btn-block">
            <MessageCircle className="w-4 h-4" />
            <span>Falar com especialista</span>
          </button>
        </div>
      </div>
    </article>
  );
};
