import React from 'react';
import { ParisDakarLogo } from './ParisDakarLogo';
import { Instagram, MessageCircle, MapPin, Phone, ShieldCheck, ArrowUpRight, Award, Lock } from 'lucide-react';

interface FooterProps {
  onConsultWhatsApp: (msg?: string) => void;
  onOpenB2BModal: () => void;
  onOpenArchitectureViewer: () => void;
  onOpenAdminPanel?: () => void;
}

const CATEGORY_LINKS = [
  'Rodas forjadas heavy-duty 4x4',
  'Pneus Mud-Terrain (MT)',
  'Pneus All-Terrain (AT)',
  'Kits lift de suspensão',
  'Espaçadores billet aeronáutico'
];

export const Footer: React.FC<FooterProps> = ({
  onConsultWhatsApp,
  onOpenB2BModal,
  onOpenArchitectureViewer,
  onOpenAdminPanel
}) => {
  return (
    <footer className="pd-bg-alt border-t pd-border shrink-0">
      {/* Faixa de conversão */}
      <div className="border-b pd-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <ParisDakarLogo variant="full" height={40} />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.instagram.com/parisdakarrodas/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <Instagram className="w-4 h-4" />
              <span>@parisdakarrodas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() =>
                onConsultWhatsApp(
                  'Olá! Gostaria de tirar dúvidas técnicas sobre rodas e pneus para caminhonetes.'
                )
              }
              className="btn btn-whats"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Falar com especialista 4x4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Colunas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] pd-brand-text">
              Paris Dakar Rodas e Pneus
            </h3>
            <p className="text-xs pd-text-2 leading-relaxed">
              Referência nacional em conjuntos de rodas forjadas heavy-duty, pneus off-road e kits de
              elevação de suspensão para caminhonetes 4x4 e expedições.
            </p>
            <p className="flex items-center gap-2 text-xs pd-gold-text font-semibold pt-1">
              <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Garantia e suporte de furação exata</span>
            </p>
          </div>

          <nav className="space-y-3" aria-label="Categorias">
            <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.14em] pd-text-3">
              Categorias 4x4
            </h3>
            <ul className="space-y-2 text-xs">
              {CATEGORY_LINKS.map((label) => (
                <li key={label}>
                  <a href="#catalog-section" className="pd-link">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3">
            <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.14em] pd-text-3">
              Atendimento especializado
            </h3>
            <p className="text-xs pd-text-2 leading-relaxed">
              Consultoria técnica direta para especificação de furação, offset, tala e pneus.
            </p>
            <div className="flex flex-col items-start gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  onConsultWhatsApp(
                    'Olá! Gostaria de falar com um especialista Paris Dakar sobre furação e offset.'
                  )
                }
                className="pd-link text-xs font-bold underline"
              >
                Falar com consultor técnico
              </button>

              <button type="button" onClick={onOpenB2BModal} className="pd-link text-xs font-bold underline">
                Área do lojista (CNPJ)
              </button>

              <button
                type="button"
                onClick={onOpenArchitectureViewer}
                className="pd-link text-xs underline"
              >
                Documentação de arquitetura
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.14em] pd-text-3">
              Central de atendimento
            </h3>
            <ul className="space-y-2.5 text-xs pd-text-2">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 pd-brand-text shrink-0 mt-0.5" aria-hidden="true" />
                <a href="#localizacao" className="pd-link">
                  Showroom e centro de distribuição
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 pd-success-text shrink-0 mt-0.5" aria-hidden="true" />
                <span>WhatsApp vendas: (11) 99999-8888</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 pd-gold-text shrink-0 mt-0.5" aria-hidden="true" />
                <span>Especialistas em caminhonetes</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="pd-rule my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[0.62rem] pd-text-3">
          <p className="uppercase font-bold tracking-wider">
            © {new Date().getFullYear()} Paris Dakar Rodas e Pneus. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-red"
                style={{ backgroundColor: 'var(--pd-success)' }}
                aria-hidden="true"
              />
              <span className="font-bold uppercase tracking-wider">Estoque disponível</span>
            </div>
            {onOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="opacity-30 hover:opacity-70 transition-opacity text-[0.6rem] pd-text-3 flex items-center gap-1"
                title="Acesso administrativo"
                aria-label="Acesso administrativo"
              >
                <Lock className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
