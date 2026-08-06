import React from 'react';
import { ParisDakarLogo } from './ParisDakarLogo';
import { Instagram, MessageCircle, MapPin, Phone, ShieldCheck, ArrowUpRight, Award } from 'lucide-react';

interface FooterProps {
  onConsultWhatsApp: (msg?: string) => void;
  onOpenB2BModal: () => void;
  onOpenArchitectureViewer: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onConsultWhatsApp,
  onOpenB2BModal,
  onOpenArchitectureViewer
}) => {
  return (
    <footer className="bg-black text-white border-t border-white/10 transition-colors shrink-0">
      
      {/* Top Banner Social & WhatsApp Route */}
      <div className="border-b border-white/5 py-8 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <ParisDakarLogo colorMode="white" height={42} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/parisdakarrodas/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded bg-[#111111] border border-white/10 hover:border-[#8B0000] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition text-gray-300 hover:text-white"
            >
              <Instagram className="w-4 h-4 text-[#8B0000]" />
              <span>Siga no Instagram @parisdakarrodas</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
            </a>

            <button
              onClick={() => onConsultWhatsApp("Olá! Gostaria de tirar dúvidas técnicas sobre rodas e pneus para caminhonetes no WhatsApp.")}
              className="bg-[#25D366] text-black hover:bg-[#1da851] px-5 py-2.5 rounded text-xs font-black flex items-center gap-2 uppercase tracking-widest shadow-lg transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-black text-black" />
              <span>Falar com Especialista 4x4</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#8B0000]">
              Paris Dakar Rodas e Pneus
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Referência nacional no fornecimento de conjuntos de rodas forjadas heavy-duty, pneus off-road e kits de elevação de suspensão para caminhonetes 4x4 e expedições.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Garantia e Suporte de Furação Exata</span>
            </div>
          </div>

          {/* Column 2: Categorias Principais */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Categorias Caminhonetes 4x4
            </h4>
            <ul className="space-y-2 text-xs text-gray-500">
              <li><a href="#catalog-section" className="hover:text-[#8B0000] transition">Rodas Forjadas Heavy-Duty 4x4</a></li>
              <li><a href="#catalog-section" className="hover:text-[#8B0000] transition">Pneus Mud-Terrain (MT)</a></li>
              <li><a href="#catalog-section" className="hover:text-[#8B0000] transition">Pneus All-Terrain (AT)</a></li>
              <li><a href="#catalog-section" className="hover:text-[#8B0000] transition">Kits Lift de Suspensão</a></li>
              <li><a href="#catalog-section" className="hover:text-[#8B0000] transition">Espaçadores Billet Aeronáutico</a></li>
            </ul>
          </div>

          {/* Column 3: Atendimento & Suporte */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Atendimento Especializado
            </h4>
            <p className="text-xs text-gray-400">
              Consultoria técnica direta com especialistas para especificação de furação, offset, tala e pneus para caminhonetes.
            </p>
            <button
              onClick={() => onConsultWhatsApp("Olá! Gostaria de tirar dúvidas com um especialista Paris Dakar sobre furação e offset.")}
              className="text-xs font-bold text-[#8B0000] underline hover:text-white transition flex items-center gap-1 uppercase tracking-wider"
            >
              <span>Falar com Consultor Técnico</span>
            </button>
            <div className="pt-2">
              <button
                onClick={onOpenArchitectureViewer}
                className="text-xs text-gray-500 hover:text-white underline"
              >
                Documentação de Arquitetura (Vercel)
              </button>
            </div>
          </div>

          {/* Column 4: Contato & Unidade */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Central de Atendimento
            </h4>
            <div className="space-y-2 text-xs text-gray-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8B0000] shrink-0" />
                <span>Showroom Principal & Centro de Distribuição Off-Road</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>WhatsApp Vendas: (11) 99999-DAKAR</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Atendimento Especializado em Caminhonetes</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 gap-4">
          <p className="uppercase font-bold text-center sm:text-left">© {new Date().getFullYear()} Paris Dakar Rodas e Pneus. Todos os direitos reservados.</p>

          {/* `flex` sem wrap + `space-x-6` somavam ~380px de conteúdo numa
              viewport de 360px: era a principal fonte de scroll lateral no
              rodapé. Agora envolve em várias linhas e o divisor vertical
              (que só faz sentido em linha única) some no mobile. */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6">
            <div className="flex items-center">
              <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-tighter">Estoque Disponível</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-gray-800"></div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <span className="text-[10px] font-black uppercase italic text-white/30">Performance</span>
              <span className="text-[10px] font-black uppercase italic text-white/30">Resistance</span>
              <span className="text-[10px] font-black uppercase italic text-white/30">Caminhonetes 4x4</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
