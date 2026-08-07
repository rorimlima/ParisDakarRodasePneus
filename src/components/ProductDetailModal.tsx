import React, { useEffect, useState } from 'react';
import { X, MessageCircle, ShieldCheck, Truck, Car, ImageOff } from 'lucide-react';
import { Product, B2BUser } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  b2bUser: B2BUser;
  onConsultWhatsApp: (message: string) => void;
  onOpenB2BModal: () => void;
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  b2bUser,
  onConsultWhatsApp
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(product?.image ?? '');
  const [vehicleQuery, setVehicleQuery] = useState<string>('');
  const [vehicleCheckResult, setVehicleCheckResult] = useState<string | null>(null);

  // Trocar de produto sem desmontar o modal precisa reiniciar a galeria.
  useEffect(() => {
    setSelectedImage(product?.image ?? '');
    setVehicleQuery('');
    setVehicleCheckResult(null);
  }, [product?.id, product?.image]);

  // Fechar com ESC e travar o scroll do fundo enquanto o modal está aberto.
  useEffect(() => {
    if (!product) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [product, onClose]);

  if (!product) return null;

  const imagesList = [product.image, ...(product.secondaryImages || [])].filter(Boolean);
  const formattedPrice = brl.format(
    b2bUser.isLoggedIn && product.b2bPrice ? product.b2bPrice : product.price
  );

  const handleCheckCompatibility = () => {
    const query = vehicleQuery.trim();
    if (!query) return;

    const isMatched = product.compatibleVehicles.some((v) =>
      v.toLowerCase().includes(query.toLowerCase())
    );

    setVehicleCheckResult(
      isMatched
        ? `Compatibilidade confirmada: o item ${product.sku} se adapta ao seu ${query}.`
        : `Verificação especial necessária: seu ${query} pode exigir kit de elevação (lift) ou espaçadores. Fale com um consultor no WhatsApp para confirmar.`
    );
  };

  const handleWhatsAppConsult = () => {
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
      `Olá equipe Paris Dakar! 🏁\n\nGostaria de uma cotação técnica do produto:\n\n*${product.name}*\nSKU: ${product.sku}\nEspecificações: ${specsSummary}\nPreço: ${formattedPrice}\n\nMeu veículo: ${vehicleQuery || 'A confirmar com especialista'}`
    );
  };

  const specRows: Array<[string, string | undefined, boolean?]> = [
    ['Aro', product.specs.aro, true],
    ['Furação (PCD)', product.specs.furacao, true],
    ['Offset (ET)', product.specs.offset],
    ['Tala (largura)', product.specs.tala],
    ['Medida do pneu', product.specs.medidaPneu, true],
    ['Tipo de banda', product.specs.tipoPneu],
    ['Acabamento', product.specs.acabamento],
    ['Peso do item', product.specs.peso]
  ];

  return (
    <div
      className="pd-overlay items-start sm:items-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pd-modal max-w-4xl relative my-4 sm:my-8 flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="btn-icon absolute top-4 right-4 z-10"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-8">
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full rounded-xl pd-surface-2 overflow-hidden border pd-border">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 pd-text-3">
                  <ImageOff className="w-10 h-10" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider">Foto real em breve</span>
                </div>
              )}
            </div>

            {imagesList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {imagesList.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    aria-label={`Imagem ${idx + 1}`}
                    aria-pressed={selectedImage === img}
                    className="w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition"
                    style={{
                      borderColor: selectedImage === img ? 'var(--pd-brand)' : 'var(--pd-border)',
                      opacity: selectedImage === img ? 1 : 0.6
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <div className="pd-surface-2 border pd-border rounded-xl p-4 space-y-2.5 text-xs">
              <p className="flex items-center gap-2 pd-success-text font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Garantia de fábrica: {product.specs.garantia || '3 anos'}</span>
              </p>
              <p className="flex items-center gap-2 pd-text-2">
                <Truck className="w-4 h-4 pd-brand-text shrink-0" aria-hidden="true" />
                <span>Envio por transportadora especializada para todo o Brasil.</span>
              </p>
            </div>
          </div>

          {/* Informações */}
          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                <span className="font-bold pd-brand-text uppercase tracking-[0.14em] truncate">
                  {product.brand} · {product.category}
                </span>
                <span className="pd-mono pd-text-3 text-[0.68rem] break-all shrink-0">SKU {product.sku}</span>
              </div>

              <h2 className="pd-serif text-xl sm:text-2xl font-extrabold uppercase tracking-tight pd-text leading-tight">
                {product.name}
              </h2>

              <p className="text-sm pd-text-2 leading-relaxed">{product.description}</p>

              <div>
                <h3 className="pd-label">Especificações técnicas</h3>
                <table className="clean-table">
                  <tbody>
                    {specRows
                      .filter(([, value]) => Boolean(value))
                      .map(([label, value, strong]) => (
                        <tr key={label}>
                          <th scope="row">{label}</th>
                          <td className={strong ? 'font-bold pd-mono' : 'pd-mono'}>{value}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Checador de compatibilidade */}
              <div className="space-y-2">
                <label className="pd-label flex items-center gap-1.5" htmlFor="checa-veiculo">
                  <Car className="w-3.5 h-3.5 pd-brand-text" aria-hidden="true" />
                  Verificar compatibilidade no seu veículo
                </label>
                {/* O <input> tem largura intrínseca (~170px, atributo `size`
                    padrão) e `flex-1` não a supera sem `min-w-0` — era isso
                    que empurrava o botão "Checar" para fora da tela em 320px. */}
                <div className="flex gap-2">
                  <input
                    id="checa-veiculo"
                    type="text"
                    value={vehicleQuery}
                    onChange={(e) => setVehicleQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckCompatibility()}
                    placeholder="Ex: Hilux 2022, Ranger, S10..."
                    className="pd-input min-w-0 flex-1"
                  />
                  <button type="button" onClick={handleCheckCompatibility} className="btn btn-subtle shrink-0">
                    Checar
                  </button>
                </div>
                {vehicleCheckResult && (
                  <p className="text-xs pd-surface-2 border pd-border rounded-lg p-3 leading-relaxed pd-text-2">
                    {vehicleCheckResult}
                  </p>
                )}
              </div>
            </div>

            {/* Preço e ação */}
            <div className="pt-4 border-t pd-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="pd-label mb-0.5">Valor unitário / jogo</span>
                  <span className="text-2xl font-extrabold pd-text">{formattedPrice}</span>
                </div>
                <span className="pd-badge pd-badge-success shrink-0">Estoque disponível</span>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppConsult}
                className="btn btn-whats btn-block btn-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
