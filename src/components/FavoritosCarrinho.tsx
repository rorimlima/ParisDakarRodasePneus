import React, { useState } from 'react';
import { X, Heart, ShoppingCart, Trash2, Plus, Minus, PackageOpen, Send } from 'lucide-react';
import { Product, CartItem, CpfClient, Seller } from '../types';

interface FavoritosCarrinhoProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Product[];
  cart: CartItem[];
  currentB2CUser: CpfClient | null | undefined;
  sellers: Seller[];
  onRemoveFavorite: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onClearCart: () => void;
  onSendToWhatsApp: (message: string) => void;
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const FavoritosCarrinho: React.FC<FavoritosCarrinhoProps> = ({
  isOpen,
  onClose,
  favorites,
  cart,
  currentB2CUser,
  onRemoveFavorite,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQty,
  onClearCart,
  onSendToWhatsApp
}) => {
  const [activeTab, setActiveTab] = useState<'favoritos' | 'carrinho'>('favoritos');

  if (!isOpen) return null;

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const buildWhatsAppMessage = () => {
    const clientInfo = currentB2CUser
      ? `👤 *Cliente:* ${currentB2CUser.fullName}\n📋 *CPF:* ${currentB2CUser.cpf}\n📞 *Telefone:* ${currentB2CUser.phone || 'Não informado'}\n📍 *Endereço:* ${currentB2CUser.address || 'Não informado'}\n\n`
      : '👤 *Cliente:* Visitante (sem cadastro)\n\n';

    const itemsList = cart
      .map(
        (item, i) =>
          `${i + 1}. *${item.product.name}*\n   🏷️ SKU: ${item.product.sku}\n   🔢 Qtd: ${item.quantity}x\n   💰 Subtotal: ${brl.format(item.product.price * item.quantity)}`
      )
      .join('\n\n');

    return `🏁 *PEDIDO VIA SITE — PARIS DAKAR RODAS E PNEUS*\n\n${clientInfo}📦 *ITENS DO CARRINHO:*\n\n${itemsList}\n\n💵 *TOTAL: ${brl.format(cartTotal)}*\n\n_Aguardo confirmação de disponibilidade e prazo de entrega!_`;
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    const message = buildWhatsAppMessage();
    onSendToWhatsApp(message);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md pd-surface border-l pd-border flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
        role="dialog"
        aria-label="Favoritos e Carrinho"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b pd-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#8B0000] rounded flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide pd-text">Minha Lista</h2>
              <p className="text-[10px] pd-text-3">
                {favorites.length} favorito(s) · {cartCount} item(ns) no carrinho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b pd-border shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('favoritos')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border-b-2 ${
              activeTab === 'favoritos' ? 'border-[#8B0000] pd-brand-text pd-surface-2' : 'border-transparent pd-text-3'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Favoritos ({favorites.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('carrinho')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border-b-2 ${
              activeTab === 'carrinho' ? 'border-[#8B0000] pd-brand-text pd-surface-2' : 'border-transparent pd-text-3'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Carrinho ({cartCount})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* TAB: FAVORITOS */}
          {activeTab === 'favoritos' && (
            <div className="p-4 space-y-3">
              {favorites.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Heart className="w-12 h-12 pd-text-3 mx-auto" />
                  <p className="text-sm font-bold pd-text">Nenhum favorito ainda</p>
                  <p className="text-xs pd-text-3">
                    Clique no ❤️ nos produtos para salvá-los aqui.
                  </p>
                </div>
              ) : (
                favorites.map((product) => (
                  <div key={product.id} className="pd-card p-3 flex gap-3 items-start">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold pd-text pd-clamp-2 leading-tight">{product.name}</p>
                      <p className="text-sm font-extrabold pd-brand-text">
                        {brl.format(product.price)}
                      </p>
                      {product.specs?.aro && (
                        <p className="text-[10px] pd-text-3">Aro {product.specs.aro}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => { onAddToCart(product); setActiveTab('carrinho'); }}
                        className="btn btn-primary btn-sm px-2 py-1"
                        title="Adicionar ao carrinho"
                      >
                        <ShoppingCart className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveFavorite(product.id)}
                        className="btn btn-subtle btn-sm px-2 py-1 pd-brand-text"
                        title="Remover dos favoritos"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: CARRINHO */}
          {activeTab === 'carrinho' && (
            <div className="p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <PackageOpen className="w-12 h-12 pd-text-3 mx-auto" />
                  <p className="text-sm font-bold pd-text">Carrinho vazio</p>
                  <p className="text-xs pd-text-3">
                    Adicione produtos dos seus favoritos ou diretamente do catálogo.
                  </p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.product.id} className="pd-card p-3 flex gap-3 items-start">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-xs font-bold pd-text pd-clamp-2 leading-tight">{item.product.name}</p>
                        <p className="text-[10px] pd-text-3">SKU: {item.product.sku}</p>
                        <p className="text-sm font-extrabold pd-text">
                          {brl.format(item.product.price * item.quantity)}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.product.id, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded pd-surface-2 border pd-border flex items-center justify-center hover:border-[#8B0000] transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold pd-text w-6 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded pd-surface-2 border pd-border flex items-center justify-center hover:border-[#8B0000] transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="ml-auto text-[10px] pd-brand-text hover:underline font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pd-card p-4 space-y-1">
                    <div className="flex justify-between items-center text-xs pd-text-2">
                      <span>Subtotal ({cartCount} itens)</span>
                      <span className="font-bold pd-text">{brl.format(cartTotal)}</span>
                    </div>
                    <p className="text-[10px] pd-text-3">* Valores sujeitos a confirmação pelo vendedor</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t pd-border p-4 space-y-3">
          {activeTab === 'carrinho' && cart.length > 0 && (
            <>
              {!currentB2CUser && (
                <p className="text-[10px] pd-brand-text text-center font-bold bg-red-950/40 py-2 px-3 rounded border border-red-900/40">
                  ⚠️ Faça login para incluir seus dados no pedido ao vendedor.
                </p>
              )}
              <button
                type="button"
                onClick={handleSendOrder}
                className="btn btn-whats btn-block"
              >
                <Send className="w-4 h-4" />
                <span>Enviar pedido para o Vendedor (WhatsApp)</span>
              </button>
              <button
                type="button"
                onClick={onClearCart}
                className="btn btn-subtle btn-block text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar carrinho</span>
              </button>
            </>
          )}
          {activeTab === 'favoritos' && favorites.length > 0 && (
            <button
              type="button"
              onClick={() => {
                favorites.forEach((p) => onAddToCart(p));
                setActiveTab('carrinho');
              }}
              className="btn btn-primary btn-block text-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Adicionar todos ao carrinho</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
