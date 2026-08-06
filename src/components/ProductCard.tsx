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
      className="group cursor-pointer flex flex-col bg-[#111111] border border-white/10 hover:border-[#8B0000] rounded-xl overflow-hidden shadow-lg transition-all duration-300 relative"
    >
      {/* Product Image & Badge Overlay */}
      <div className="relative aspect-[4/3] w-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badge Overlay */}
        {product.badge && (
          <div className="absolute top-3 left-3 bg-[#8B0000] text-white border border-[#8B0000]/50 px-2.5 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase shadow-md">
            {product.badge}
          </div>
        )}

        {/* Quick View Floating Button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="px-4 py-2 rounded bg-black/90 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20 shadow-xl">
            <Eye className="w-4 h-4 text-[#8B0000]" />
            Ver Especificações
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div className="space-y-2">
          {/* Subcategory & Rating */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold uppercase tracking-widest text-[#8B0000]">
              {product.brand}
            </span>

            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{product.rating}</span>
              <span className="text-gray-500 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-black uppercase italic tracking-tight text-white line-clamp-2 leading-snug group-hover:text-[#8B0000] transition-colors">
            {product.name}
          </h3>

          {/* Clean Specification Table */}
          <div className="pt-2">
            <table className="clean-table bg-[#1a1a1a] rounded overflow-hidden">
              <tbody>
                {product.specs.aro && (
                  <tr>
                    <th>Aro</th>
                    <td className="font-bold font-mono text-white">{product.specs.aro}</td>
                    {product.specs.furacao && (
                      <>
                        <th>Furação</th>
                        <td className="font-bold font-mono text-white">{product.specs.furacao}</td>
                      </>
                    )}
                  </tr>
                )}
                {(product.specs.offset || product.specs.tala) && (
                  <tr>
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
                  <tr>
                    <th>Acabamento</th>
                    {/* `truncate max-w-[140px]` num <td> não funciona: table-layout
                        ignora max-width e o `whitespace-nowrap` do truncate ainda
                        forçava a tabela a crescer. Deixar quebrar é o correto. */}
                    <td colSpan={3} className="text-gray-300">
                      {product.specs.acabamento}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price & WhatsApp Action Routing */}
        <div className="pt-3 border-t border-white/5 space-y-3">
          
          {/* Clean Pure Price Display */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <div className="min-w-0">
              {formattedOriginalPrice && (
                <span className="text-xs text-gray-500 line-through mr-2">
                  {formattedOriginalPrice}
                </span>
              )}
              <span className="text-base sm:text-lg font-black italic text-white">
                {formattedPrice}
              </span>
              <span className="text-[9px] text-gray-500 block font-bold uppercase tracking-wider">
                Em até 10x sem juros ou PIX
              </span>
            </div>

            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              Pronta Entrega
            </span>
          </div>

          {/* WhatsApp Routing Direct Button */}
          <button
            onClick={handleWhatsAppRoute}
            className="w-full bg-[#25D366] text-black hover:bg-[#1da851] py-3 rounded font-black uppercase text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <MessageCircle className="w-4 h-4 fill-black text-black" />
            <span>Falar com Especialista</span>
          </button>

        </div>

      </div>
    </div>
  );
};
