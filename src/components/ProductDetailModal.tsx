import React, { useState } from 'react';
import { X, MessageCircle, ShieldCheck, Truck, Check, Star, Car, Building2, Lock } from 'lucide-react';
import { Product, B2BUser } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  b2bUser: B2BUser;
  onConsultWhatsApp: (message: string) => void;
  onOpenB2BModal: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  b2bUser,
  onConsultWhatsApp,
  onOpenB2BModal
}) => {
  if (!product) return null;

  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [vehicleQuery, setVehicleQuery] = useState<string>('');
  const [vehicleCheckResult, setVehicleCheckResult] = useState<string | null>(null);

  const imagesList = [product.image, ...(product.secondaryImages || [])];

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(b2bUser.isLoggedIn && product.b2bPrice ? product.b2bPrice : product.price);

  const handleCheckCompatibility = () => {
    if (!vehicleQuery.trim()) return;
    const isMatched = product.compatibleVehicles.some((v) =>
      v.toLowerCase().includes(vehicleQuery.toLowerCase())
    );
    if (isMatched) {
      setVehicleCheckResult(`✅ Compatibilidade confirmada! O item ${product.sku} se adapta perfeitamente ao seu ${vehicleQuery}.`);
    } else {
      setVehicleCheckResult(`⚠️ Verificação especial necessária: Seu ${vehicleQuery} pode requerer kit de elevação de suspensão (Lift) ou espaçadores adicionais. Fale com nosso consultor no WhatsApp para confirmar!`);
    }
  };

  const handleWhatsAppConsult = () => {
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

    const msg = `Olá equipe Paris Dakar! 🏁\n\nGostaria de fechar o pedido ou solicitar uma cotação técnica sobre o produto:\n\n*${product.name}*\nSKU: ${product.sku}\nEspecificações: ${specsSummary}\nPreço: ${formattedPrice}\n\nMeu veículo: ${vehicleQuery || 'A confirmar com especialista'}`;

    onConsultWhatsApp(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111111] rounded-2xl border border-white/10 shadow-2xl my-8 overflow-hidden text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-[#1a1a1a] text-gray-300 hover:bg-[#8B0000] hover:text-white transition border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          
          {/* Gallery Section */}
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full rounded-xl bg-[#1a1a1a] overflow-hidden border border-white/10">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {imagesList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === img
                        ? 'border-[#8B0000]'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Guarantees Box */}
            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Garantia de Fábrica Paris Dakar: {product.specs.garantia || '3 Anos'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Truck className="w-4 h-4 text-[#8B0000]" />
                <span>Envio rápido via transportadora especializada para todo o Brasil.</span>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-5 flex flex-col justify-between">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#8B0000] uppercase tracking-widest">
                  {product.brand} // {product.category}
                </span>
                <span className="font-mono text-gray-400 text-[11px]">SKU: {product.sku}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white leading-tight">
                {product.name}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                {product.description}
              </p>

              {/* Specification Clean Table */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
                  Especificações Técnicas
                </h4>
                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-950">
                  <table className="clean-table">
                    <tbody>
                      {product.specs.aro && (
                        <tr>
                          <th>Aro</th>
                          <td className="font-bold">{product.specs.aro}</td>
                        </tr>
                      )}
                      {product.specs.furacao && (
                        <tr>
                          <th>Furação (PCD)</th>
                          <td className="font-bold">{product.specs.furacao}</td>
                        </tr>
                      )}
                      {product.specs.offset && (
                        <tr>
                          <th>Offset (ET)</th>
                          <td>{product.specs.offset}</td>
                        </tr>
                      )}
                      {product.specs.tala && (
                        <tr>
                          <th>Tala (Largura)</th>
                          <td>{product.specs.tala}</td>
                        </tr>
                      )}
                      {product.specs.medidaPneu && (
                        <tr>
                          <th>Medida do Pneu</th>
                          <td className="font-bold text-red-600">{product.specs.medidaPneu}</td>
                        </tr>
                      )}
                      {product.specs.tipoPneu && (
                        <tr>
                          <th>Tipo de Banda</th>
                          <td>{product.specs.tipoPneu}</td>
                        </tr>
                      )}
                      {product.specs.acabamento && (
                        <tr>
                          <th>Acabamento</th>
                          <td>{product.specs.acabamento}</td>
                        </tr>
                      )}
                      {product.specs.peso && (
                        <tr>
                          <th>Peso do Item</th>
                          <td>{product.specs.peso}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vehicle Compatibility Checker */}
              <div className="pt-2 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-red-600" />
                  Verificar Compatibilidade no Seu Veículo:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vehicleQuery}
                    onChange={(e) => setVehicleQuery(e.target.value)}
                    placeholder="Ex: Hilux 2022, Ranger, Wrangler..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={handleCheckCompatibility}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
                  >
                    Checar
                  </button>
                </div>
                {vehicleCheckResult && (
                  <p className="text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 leading-normal">
                    {vehicleCheckResult}
                  </p>
                )}
              </div>

            </div>

            {/* Price & Action Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Valor Unitário / Jogo:</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formattedPrice}
                  </span>
                </div>

                <span className="text-xs text-emerald-500 font-bold bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-800/40">
                  Estoque Disponível
                </span>
              </div>

              <button
                onClick={handleWhatsAppConsult}
                className="btn-paris w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Fechar Pedido / Consultar no WhatsApp</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
