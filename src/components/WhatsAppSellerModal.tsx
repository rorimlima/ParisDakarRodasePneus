import React from 'react';
import { X, MessageCircle, UserCheck, ShieldCheck } from 'lucide-react';
import { Seller } from '../types';

interface WhatsAppSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellers: Seller[];
  onSelectSeller: (seller: Seller) => void;
  onFallbackCentral?: () => void;
  productName?: string;
}

export const WhatsAppSellerModal: React.FC<WhatsAppSellerModalProps> = ({
  isOpen,
  onClose,
  sellers,
  onSelectSeller,
  onFallbackCentral,
  productName
}) => {
  if (!isOpen) return null;

  const activeSellers = sellers.filter((s) => s.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* `max-h-[90vh]` + corpo com overflow-y-auto já mantêm o modal dentro
          da tela; `max-h-[85dvh]` no mobile evita que a barra de endereço
          dinâmica do Safari/Chrome corte o rodapé do modal. */}
      <div
        className="relative w-full max-w-lg max-h-[85dvh] sm:max-h-[90vh] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1a1a] via-[#161616] to-[#8B0000]/30 p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                Atendimento Especializado 4x4
              </h3>
              <p className="text-xs text-gray-400">
                Escolha um de nossos consultores no WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 shrink-0 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Context Banner if present */}
        {productName && (
          <div className="bg-[#8B0000]/10 border-b border-[#8B0000]/30 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="shrink-0 text-gray-300 font-medium">Item em Cotação:</span>
            {/* `max-w-[280px]` fixo era maior que a área útil de um celular de
                360px; `min-w-0` + `truncate` cortam na largura real disponível. */}
            <span className="min-w-0 truncate font-bold text-red-400" title={productName}>
              {productName}
            </span>
          </div>
        )}

        {/* Sellers Body List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {activeSellers.length === 0 ? (
            <div className="text-center py-8 text-gray-400 space-y-3">
              <UserCheck className="w-12 h-12 mx-auto text-gray-600" />
              <p className="text-sm font-semibold">Nenhum vendedor disponível no momento.</p>
              {onFallbackCentral && (
                <button
                  onClick={onFallbackCentral}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition"
                >
                  Falar no Canal Principal
                </button>
              )}
            </div>
          ) : (
            activeSellers.map((seller) => (
              <div
                key={seller.id}
                onClick={() => onSelectSeller(seller)}
                className="group relative bg-[#181818] hover:bg-[#222222] border border-white/5 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-md flex items-center justify-between gap-4"
              >
                {/* Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    {seller.avatarUrl ? (
                      <img
                        src={seller.avatarUrl}
                        alt={seller.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40 group-hover:border-emerald-400 transition"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#8B0000] text-white font-black text-lg flex items-center justify-center border-2 border-emerald-500/40">
                        {seller.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    {/* Status Dot */}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#181818] animate-pulse" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition truncate">
                        {seller.name}
                      </h4>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Online
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {seller.specialty || 'Consultor Técnico Paris Dakar'}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      {seller.phone}
                    </p>
                  </div>
                </div>

                {/* Direct Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSeller(seller);
                  }}
                  className="shrink-0 bg-emerald-600 group-hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-lg uppercase tracking-wider transition flex items-center gap-2 shadow-lg group-hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Conversar</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Atendimento Oficial Paris Dakar 4x4
          </span>

          {onFallbackCentral && activeSellers.length > 0 && (
            <button
              onClick={onFallbackCentral}
              className="text-gray-400 hover:text-white underline text-[11px] transition"
            >
              Usar Número Central
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
