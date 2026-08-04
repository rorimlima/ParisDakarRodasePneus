import React from 'react';
import { MessageCircle, ShieldCheck, Lock, ChevronRight, Eye, Star } from 'lucide-react';
import { Product, B2BUser } from '../types';

interface ProductCardProps {
  product: Product;
  b2bUser: B2BUser;
  onOpenDetails: (product: Product) => void;
  onConsultWhatsApp: (message: string) => void;
  onOpenB2BModal: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  b2bUser,
  onOpenDetails,
  onConsultWhatsApp,
  onOpenB2BModal
}) => {
  // Format price
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(b2bUser.isLoggedIn && product.b2bPrice ? product.b2bPrice : product.price);

  const formattedOriginalPrice = product.originalPrice
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)
    : null;

  // Format WhatsApp message routing
  const handleWhatsAppRoute = (e: React.MouseEvent) => {
    e.stopPropagation();

    const specsSummary = [
      product.specs.aro ? `Aro ${product.specs.aro}` : null,
      product.specs.furacao ? `Furação: ${product.specs.furacao}` : null,
      product.specs.offset ? `Offset: ${product.specs.offset}` : null,
      product.specs.tala ? `Tala: ${product.specs.tala}` : null,
      product.specs.medidaPneu ? `Medida: ${product.specs.medidaPneu}` : null,
      product.specs.acabamento ? `Cor: ${product.specs.acabamento}` : null
    ]
      .filter(Boolean)
      .join(' | ');

    const msg = `Olá equipe Paris Dakar Rodas e Pneus! 🏁\n\nGostaria de consultar a disponibilidade e fechar o pedido do item:\n\n📌 *${product.name}*\n🏷️ *SKU:* ${product.sku}\n🔧 *Especificações:* ${specsSummary}\n💰 *Valor:* ${formattedPrice}\n\nPor favor, confirmem a compatibilidade com o meu veículo!`;

    onConsultWhatsApp(msg);
  };

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group cursor-pointer flex flex-col bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 hover:border-[#8B0000] rounded-xl overflow-hidden shadow-md dark:shadow-lg transition-all duration-300 relative"
    >
      {/* Product Image & Badge Overlay */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badge Overlay */}
        {product.badge && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#8B0000] text-white border border-[#8B0000]/50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm text-[9px] sm:text-[10px] font-black tracking-widest uppercase shadow-md max-w-[calc(100%-1rem)] truncate">
            {product.badge}
          </div>
        )}

        {/* Quick View Floating Button (hover em telas com mouse; sempre visível/omitido no toque) */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-center">
          <span className="px-4 py-2 rounded bg-black/90 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20 shadow-xl">
            <Eye className="w-4 h-4 text-[#8B0000]" />
            Ver Especificações
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-2.5 xs:p-3 sm:p-5 flex-1 flex flex-col justify-between gap-2.5 sm:gap-4">

        <div className="space-y-1.5 sm:space-y-2">
          {/* Subcategory & Rating */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] gap-2">
            <span className="font-bold uppercase tracking-widest text-[#8B0000] truncate">
              {product.brand}
            </span>

            <div className="flex items-center gap-1 text-amber-500 font-bold shrink-0">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500" />
              <span>{product.rating}</span>
              <span className="hidden xs:inline text-zinc-500 dark:text-gray-500 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="text-[11px] xs:text-xs sm:text-sm font-black uppercase italic tracking-tight text-[#111111] dark:text-white line-clamp-2 leading-snug group-hover:text-[#8B0000] transition-colors">
            {product.name}
          </h3>

          {/* Clean Specification Table — oculta em cards muito estreitos (2 colunas no celular) */}
          <div className="hidden xs:block pt-2">
            <table className="clean-table bg-slate-100 dark:bg-[#1a1a1a] rounded overflow-hidden">
              <tbody>
                {product.specs.aro && (
                  <tr>
                    <th>Aro</th>
                    <td className="font-bold font-mono text-[#111111] dark:text-white">{product.specs.aro}</td>
                    {product.specs.furacao && (
                      <>
                        <th className="hidden sm:table-cell">Furação</th>
                        <td className="hidden sm:table-cell font-bold font-mono text-[#111111] dark:text-white">{product.specs.furacao}</td>
                      </>
                    )}
                  </tr>
                )}
                {(product.specs.offset || product.specs.tala) && (
                  <tr className="hidden sm:table-row">
                    {product.specs.tala && (
                      <>
                        <th>Tala</th>
                        <td className="font-mono">{product.specs.tala}</td>
                      </>
                    )}
                    {product.specs.offset && (
                      <>
                        <th>Offset</th>
                        <td className="font-mono">{product.specs.offset}</td>
                      </>
                    )}
                  </tr>
                )}
                {product.specs.medidaPneu && (
                  <tr>
                    <th>Medida</th>
                    <td colSpan={3} className="font-bold font-mono text-[#8B0000]">
                      {product.specs.medidaPneu}
                    </td>
                  </tr>
                )}
                {product.specs.acabamento && (
                  <tr className="hidden sm:table-row">
                    <th>Acabamento</th>
                    <td colSpan={3} className="truncate max-w-[140px] text-zinc-600 dark:text-gray-300">
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

        {/* Price & WhatsApp Action Routing */}
        <div className="pt-2.5 sm:pt-3 border-t border-black/5 dark:border-white/5 space-y-2 sm:space-y-3">

          {/* Clean Pure Price Display */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <div className="min-w-0">
              {formattedOriginalPrice && (
                <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-gray-500 line-through mr-1.5 sm:mr-2">
                  {formattedOriginalPrice}
                </span>
              )}
              <span className="text-sm xs:text-base sm:text-lg font-black italic text-[#111111] dark:text-white">
                {formattedPrice}
              </span>
              <span className="text-[8px] xs:text-[9px] text-zinc-500 dark:text-gray-500 block font-bold uppercase tracking-wider">
                Em até 10x sem juros ou PIX
              </span>
            </div>

            <span className="hidden xs:inline text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
              Pronta Entrega
            </span>
          </div>

          {/* WhatsApp Routing Direct Button */}
          <button
            onClick={handleWhatsAppRoute}
            className="w-full bg-[#25D366] text-black hover:bg-[#1da851] py-2.5 sm:py-3 rounded font-black uppercase text-[10px] xs:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black text-black shrink-0" />
            <span className="truncate">Falar com Especialista</span>
          </button>

        </div>

      </div>
    </div>
  );
};
