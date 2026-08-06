import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeSellers = sellers.filter((s) => s.isActive);

  return (
    <div
      className="pd-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Escolher consultor"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pd-modal max-w-lg flex flex-col">
        {/* Cabeçalho */}
        <div className="p-5 border-b pd-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 pd-success-text"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--pd-success) 14%, transparent)',
                border: '1px solid color-mix(in srgb, var(--pd-success) 32%, transparent)'
              }}
              aria-hidden="true"
            >
              <MessageCircle className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold uppercase tracking-tight pd-text truncate">
                Atendimento especializado
              </h2>
              <p className="text-xs pd-text-3">Escolha um consultor para falar no WhatsApp</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="btn-icon shrink-0" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {productName && (
          <div className="px-5 py-2.5 border-b pd-hairline pd-surface-2 flex items-center justify-between gap-3 text-xs">
            <span className="pd-text-3 font-medium shrink-0">Item em cotação:</span>
            <span className="font-bold pd-brand-text truncate" title={productName}>
              {productName}
            </span>
          </div>
        )}

        {/* Lista de vendedores */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {activeSellers.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <UserCheck className="w-11 h-11 mx-auto pd-text-3" aria-hidden="true" />
              <p className="text-sm font-semibold pd-text-2">
                Nenhum consultor disponível no momento.
              </p>
              {onFallbackCentral && (
                <button type="button" onClick={onFallbackCentral} className="btn btn-whats">
                  Falar no canal principal
                </button>
              )}
            </div>
          ) : (
            activeSellers.map((seller) => (
              <button
                key={seller.id}
                type="button"
                onClick={() => onSelectSeller(seller)}
                className="pd-card pd-card-hover w-full p-4 flex items-center justify-between gap-4 text-left"
              >
                <span className="flex items-center gap-3.5 min-w-0">
                  <span className="relative shrink-0">
                    {seller.avatarUrl ? (
                      <img
                        src={seller.avatarUrl}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border-2 pd-border"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span
                        className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-white"
                        style={{ backgroundColor: 'var(--pd-brand)' }}
                        aria-hidden="true"
                      >
                        {seller.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 animate-pulse-red"
                      style={{
                        backgroundColor: 'var(--pd-success)',
                        borderColor: 'var(--pd-surface)'
                      }}
                      aria-hidden="true"
                    />
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold pd-text truncate">{seller.name}</span>
                      <span className="pd-badge pd-badge-success shrink-0">Online</span>
                    </span>
                    <span className="block text-xs pd-text-2 truncate mt-0.5">
                      {seller.specialty || 'Consultor técnico Paris Dakar'}
                    </span>
                    <span className="block text-[0.68rem] pd-text-3 pd-mono mt-0.5">{seller.phone}</span>
                  </span>
                </span>

                <span className="btn btn-whats btn-sm shrink-0">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Conversar</span>
                </span>
              </button>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t pd-border pd-surface-2 flex items-center justify-between gap-3 text-xs">
          <span className="pd-text-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 pd-success-text" aria-hidden="true" />
            Atendimento oficial Paris Dakar
          </span>

          {onFallbackCentral && activeSellers.length > 0 && (
            <button type="button" onClick={onFallbackCentral} className="pd-link underline text-[0.68rem]">
              Usar número central
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
