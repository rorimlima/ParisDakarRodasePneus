import React from 'react';
import { MessageCircle, Eye } from 'lucide-react';
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
      className="group cursor-pointer flex flex-col bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 hover:border-[#8B0000] rounded-xl overflow-hidden shadow-sm dark:shadow-lg transition-all duration-300 relative"
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
          <div className="absolute top-2.5 left-2.5 bg-red-900/90 text-white border border-red-700/60 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase shadow-sm">
            {product.badge}
          </div>
        )}

        {/* Quick View Floating Button */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="px-3.5 py-1.5 rounded-lg bg-zinc-900/90 text-white text-xs font-medium tracking-wide flex items-center gap-1.5 border border-white/20 shadow-lg">
            <Eye className="w-3.5 h-3.5 text-red-500" />
            Ver Especificações
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        
        <div className="space-y-1.5">
          {/* Categoria & código do produto (Produto_Codigo do ERP) */}
          <div className="flex items-center justify-between text-[10px] gap-2">
            <span className="font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 truncate">
              {product.categoriaNome || product.brand}
            </span>

            <span
              className="shrink-0 font-mono font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded"
              title="Código do produto"
            >
              #{product.sku}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors font-heading">
            {product.name}
          </h3>

          {/* Clean Specification Table */}
          <div className="pt-1">
            <table className="clean-table bg-slate-100 dark:bg-zinc-900/70 rounded overflow-hidden">
              <tbody>
                {product.specs.aro && (
                  <tr>
                    <th>Aro</th>
                    <td className="font-medium font-mono text-slate-900 dark:text-white">{product.specs.aro}</td>
                    {product.specs.furacao && (
                      <>
                        <th>Furação</th>
                        <td className="font-medium font-mono text-white">{product.specs.furacao}</td>
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
                    <td colSpan={3} className="font-medium font-mono text-red-400">
                      {product.specs.medidaPneu}
                    </td>
                  </tr>
                )}
                {product.specs.acabamento && (
                  <tr>
                    <th>Acabamento</th>
                    <td colSpan={3} className="truncate max-w-[140px] text-zinc-300">
                      {product.specs.acabamento}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price & WhatsApp Action Routing */}
        <div className="pt-2.5 border-t border-white/5 space-y-2.5">
          
          {/* Clean Pure Price Display */}
          <div className="flex items-baseline justify-between">
            <div>
              {formattedOriginalPrice && (
                <span className="text-xs text-zinc-500 line-through mr-2">
                  {formattedOriginalPrice}
                </span>
              )}
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                {formattedPrice}
              </span>
              <span className="text-[10px] text-zinc-400 block font-normal tracking-normal mt-0.5">
                Até 10x sem juros ou PIX
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-medium tracking-normal text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 block">
                Pronta Entrega
              </span>
              {product.unidadeLabel && (
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  {product.stockQuantity} {product.unidadeLabel}
                </span>
              )}
            </div>
          </div>

          {/* WhatsApp Routing Direct Button */}
          <button
            onClick={handleWhatsAppRoute}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Falar com Especialista</span>
          </button>

        </div>

      </div>
    </div>
  );
};
