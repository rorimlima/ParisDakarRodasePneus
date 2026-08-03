import React, { useState } from 'react';
import {
  Package,
  Settings,
  Users,
  Building2,
  User,
  ShieldCheck,
  Plus,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  MessageCircle,
  ArrowLeft,
  Layers,
  Lock,
  Upload,
  PackageCheck,
  ClipboardList,
  Wallet,
  Cloud,
  CloudOff,
  PhoneCall,
  Tv,
  Image,
  Camera,
  Instagram
} from 'lucide-react';
import {
  SiteSettings,
  CpfClient,
  B2BUser,
  AdminUser,
  InquiryLog,
  PapelUsuario
} from '../types';
import { storageService } from '../services/storageService';
import { useCatalogoAdmin } from '../hooks/useCatalogo';
import { GestaoCatalogo } from './admin/GestaoCatalogo';
import { GestaoCategorias } from './admin/GestaoCategorias';
import { ImportacaoPlanilha } from './admin/ImportacaoPlanilha';
import { GestaoVendedores } from './admin/GestaoVendedores';
import { formatarBRL } from '../utils/pricing';

interface AdminDashboardProps {
  adminUser: AdminUser;
  onExitAdmin: () => void;
  onSiteSettingsUpdated: (settings: SiteSettings) => void;
}

type AbaAdmin =
  | 'catalogo'
  | 'importacao'
  | 'categorias'
  | 'settings'
  | 'vendedores'
  | 'clients'
  | 'admins'
  | 'inquiries';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onExitAdmin,
  onSiteSettingsUpdated
}) => {
  const [activeTab, setActiveTab] = useState<AbaAdmin>('catalogo');

  // Papel efetivo — decide o acesso a ValorReposicao e margem.
  const papel: PapelUsuario = adminUser.role;

  const {
    produtos,
    categorias,
    custos,
    podeVerCusto,
    indicadores,
    carregando: carregandoCatalogo,
    recarregarCustos,
    usandoFirebase
  } = useCatalogoAdmin(papel);

  // Local state initialized from storageService
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(storageService.getSiteSettings());
  const [cpfClients, setCpfClients] = useState<CpfClient[]>(storageService.getCpfUsers());
  const [cnpjClients, setCnpjClients] = useState<B2BUser[]>(storageService.getCnpjUsers());
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(storageService.getAdminUsers());
  const [inquiries, setInquiries] = useState<InquiryLog[]>(storageService.getInquiries());

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Add Admin Form State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminUser['role']>('admin');
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  // Notification Banner
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // --- SITE SETTINGS HANDLERS ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSiteSettings(settingsForm);
    setSiteSettings(settingsForm);
    onSiteSettingsUpdated(settingsForm);
    setSettingsSavedMsg('Configurações alteradas e salvas no banco do site!');
    setTimeout(() => setSettingsSavedMsg(''), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem da logo é muito grande. Escolha um arquivo de até 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSettingsForm({ ...settingsForm, siteLogo: event.target!.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  // --- ADMIN USERS HANDLERS ---
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail) return;

    const added = storageService.addAdminUser({
      name: newAdminName,
      email: newAdminEmail,
      role: newAdminRole,
      grantedBySenior: true
    });

    setAdminUsers([...adminUsers, added]);
    setNewAdminName('');
    setNewAdminEmail('');
    setAdminSuccessMsg(`Administrador ${added.name} cadastrado e autorizado!`);
    setTimeout(() => setAdminSuccessMsg(''), 3000);
  };

  // --- INQUIRIES LOG HANDLERS ---
  const handleInquiryStatusChange = (id: string, newStatus: 'Novo' | 'Em Atendimento' | 'Concluído') => {
    const updated = storageService.updateInquiryStatus(id, newStatus);
    setInquiries(updated);
    showToast('Status da cotação atualizado!');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#8B0000] text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-black border-b border-[#8B0000]/50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#8B0000] text-white rounded flex items-center justify-center font-black italic text-sm shadow-md border border-[#8B0000]/60">
            PD
          </div>
          <div>
            <h1 className="text-base font-black uppercase italic tracking-wider text-white flex items-center gap-2">
              <span>Painel de Administração do Site</span>
              <span className="bg-[#8B0000] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                {adminUser.role === 'senior' ? 'SÊNIOR MASTER' : 'ADMINISTRADOR'}
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Usuário Logado: <span className="text-amber-400 font-bold">{adminUser.name}</span> ({adminUser.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExitAdmin}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#1a1a1a] border border-white/10 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded transition"
          >
            <ArrowLeft className="w-4 h-4 text-[#8B0000]" />
            <span>Voltar para o Site</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Indicadores do catálogo */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-[#111111] p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Produtos no catálogo</span>
            <div className="text-xl font-black italic text-white flex items-center justify-between">
              <span>{carregandoCatalogo ? '—' : indicadores.total}</span>
              <Package className="w-5 h-5 text-[#8B0000]" />
            </div>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Publicados no site</span>
            <div className="text-xl font-black italic text-emerald-400 flex items-center justify-between">
              <span>{indicadores.publicados}</span>
              <PackageCheck className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Estoque zerado</span>
            <div className="text-xl font-black italic text-red-400 flex items-center justify-between">
              <span>{indicadores.semEstoque}</span>
              <Layers className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-[9px] text-gray-500 block">fora do site automaticamente</span>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Ficha incompleta</span>
            <div className="text-xl font-black italic text-amber-400 flex items-center justify-between">
              <span>{indicadores.fichaIncompleta}</span>
              <ClipboardList className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
              {podeVerCusto ? 'Estoque a preço de venda' : 'Cotações / Leads'}
            </span>
            <div className="text-lg font-black italic text-sky-400 flex items-center justify-between">
              <span className="truncate">
                {podeVerCusto ? formatarBRL(indicadores.valorEmEstoque) : inquiries.length}
              </span>
              {podeVerCusto ? (
                <Wallet className="w-5 h-5 text-sky-400 shrink-0" />
              ) : (
                <MessageCircle className="w-5 h-5 text-sky-400 shrink-0" />
              )}
            </div>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
              {podeVerCusto ? 'Estoque a custo (reposição)' : 'Clientes cadastrados'}
            </span>
            <div className="text-lg font-black italic text-[#8B0000] flex items-center justify-between">
              <span className="truncate">
                {podeVerCusto && indicadores.custoEmEstoque !== null
                  ? formatarBRL(indicadores.custoEmEstoque)
                  : cpfClients.length + cnpjClients.length}
              </span>
              {podeVerCusto ? (
                <Lock className="w-5 h-5 text-[#8B0000] shrink-0" />
              ) : (
                <Users className="w-5 h-5 text-[#8B0000] shrink-0" />
              )}
            </div>
            {podeVerCusto && (
              <span className="text-[9px] text-amber-500/80 block">visível só para gerência</span>
            )}
          </div>
        </div>

        {/* Origem dos dados */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
            usandoFirebase
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
              : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
          }`}
        >
          {usandoFirebase ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
          <span>
            {usandoFirebase
              ? 'Conectado ao Firestore — catálogo em tempo real'
              : 'Modo local (sem Firebase configurado) — dados só neste navegador'}
          </span>
        </div>

        {/* Barra de abas */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {([
            { id: 'catalogo', rotulo: `1. Catálogo & Estoque (${indicadores.total})`, Icone: Package },
            { id: 'importacao', rotulo: '2. Importar Planilha do ERP', Icone: Upload },
            { id: 'categorias', rotulo: `3. Categorias & Ficha Técnica (${categorias.length})`, Icone: Layers },
            { id: 'settings', rotulo: '4. Configurações do Site', Icone: Settings },
            { id: 'vendedores', rotulo: '5. Vendedores & WhatsApp', Icone: PhoneCall },
            { id: 'clients', rotulo: '6. Clientes (CPF / CNPJ)', Icone: Users },
            { id: 'inquiries', rotulo: `7. Cotações & Leads (${inquiries.length})`, Icone: MessageCircle },
            { id: 'admins', rotulo: '8. Administradores', Icone: Lock }
          ] as Array<{ id: AbaAdmin; rotulo: string; Icone: typeof Package }>).map(({ id, rotulo, Icone }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
                activeTab === id
                  ? 'bg-[#8B0000] text-white shadow-md'
                  : 'bg-[#111111] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <Icone className="w-4 h-4" />
              <span>{rotulo}</span>
            </button>
          ))}
        </div>

        {/* ABA 1: CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <GestaoCatalogo
            produtos={produtos}
            categorias={categorias}
            custos={custos}
            papel={papel}
            podeVerCusto={podeVerCusto}
            onAviso={showToast}
          />
        )}

        {/* ABA 2: IMPORTAÇÃO DA PLANILHA */}
        {activeTab === 'importacao' && (
          <ImportacaoPlanilha
            executadoPor={`${adminUser.name} <${adminUser.email}>`}
            onConcluido={(resultado) => {
              void recarregarCustos();
              showToast(
                `Importação concluída: ${resultado.criados} criados, ${resultado.atualizados} atualizados, ${resultado.desativados} desativados.`
              );
            }}
          />
        )}

        {/* ABA 3: CATEGORIAS */}
        {activeTab === 'categorias' && (
          <GestaoCategorias categorias={categorias} produtos={produtos} onAviso={showToast} />
        )}

        {/* TAB 2: SITE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-base font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#8B0000]" />
                <span>Configurações do Site e Comunicação</span>
              </h2>
              <p className="text-xs text-gray-400">
                Altere em tempo real os textos institucionais, banners superiores e números de contato oficiais.
              </p>
            </div>

            {settingsSavedMsg && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{settingsSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              
              {/* Espaço para subir a Logo do Computador ou Celular */}
              <div className="p-4 rounded-xl bg-[#18181c] border border-white/10 space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-amber-500" />
                  <span>Logo Oficial do Site (Upload do Computador ou Celular)</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {settingsForm.siteLogo ? (
                    <div className="p-2 bg-black rounded border border-white/10 shrink-0 flex items-center justify-center max-h-20">
                      <img src={settingsForm.siteLogo} alt="Logo Previsto" className="max-h-14 w-auto object-contain" />
                    </div>
                  ) : (
                    <div className="p-3 bg-black rounded border border-dashed border-white/20 text-[11px] text-zinc-400 text-center">
                      Logo Padrão Tuareg SVG (Nenhum arquivo enviado)
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-[#8B0000] hover:bg-red-800 text-white rounded text-xs font-bold uppercase tracking-wider transition shadow">
                      <Upload className="w-4 h-4" />
                      <span>Escolher Logo (Galeria/Computador)</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>

                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 rounded text-xs font-bold uppercase tracking-wider transition shadow">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>Tirar Foto com a Câmera</span>
                      <input type="file" accept="image/*" capture="user" onChange={handleLogoUpload} className="hidden" />
                    </label>

                    {settingsForm.siteLogo && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, siteLogo: '' })}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded text-xs font-bold uppercase"
                      >
                        Remover Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* URL do Vídeo de Apresentação no YouTube */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-red-500" />
                  <span>Link / URL do Vídeo de Apresentação no YouTube (Hero da Tela Inicial)</span>
                </label>
                <input
                  type="text"
                  value={settingsForm.youtubeVideoUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, youtubeVideoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=5qap5aO4i9A ou ID do vídeo"
                  className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Insira qualquer link do YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...). O player do topo do site será atualizado automaticamente.
                </p>
              </div>

              {/* URLs dos Reels do Instagram */}
              <div className="p-4 rounded-xl bg-[#18181c] border border-white/10 space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <span>Feed de Vídeos do Instagram (Reels Reais)</span>
                </label>
                <p className="text-[10px] text-gray-400">
                  Insira as URLs de 4 Reels reais do seu Instagram (@parisdakarrodas) para exibir no rodapé do site. Cole o link completo do navegador (ex: https://www.instagram.com/reel/... ou https://www.instagram.com/p/...).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index}>
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Vídeo {index + 1} (Reel URL)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.instagramReels?.[index] || ''}
                        onChange={(e) => {
                          const updatedReels = [...(settingsForm.instagramReels || ['', '', '', ''])];
                          while (updatedReels.length < 4) updatedReels.push('');
                          updatedReels[index] = e.target.value;
                          setSettingsForm({ ...settingsForm, instagramReels: updatedReels });
                        }}
                        placeholder="https://www.instagram.com/reel/C5abc123/"
                        className="w-full px-3.5 py-2 rounded bg-black border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                  Texto do Banner Superior Anúncio (Barra de Notificações)
                </label>
                <input
                  type="text"
                  value={settingsForm.announcementText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                    Título Principal do Hero (Apresentação)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                    Subtítulo do Hero
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroSubtitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                    Número WhatsApp Oficial (Apenas números com DDD)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    placeholder="5511999998888"
                    className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                    Telefone Fixo Showroom
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                  Endereço do Centro de Distribuição / Showroom
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <button
                type="submit"
                className="bg-[#8B0000] hover:bg-red-800 text-white px-6 py-3 rounded font-black text-xs uppercase tracking-widest transition shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações de Configuração</span>
              </button>
            </form>
          </div>
        )}

        {/* ABA: GESTÃO DE VENDEDORES */}
        {activeTab === 'vendedores' && (
          <GestaoVendedores onAviso={showToast} />
        )}

        {/* TAB 3: CLIENTS MANAGEMENT (CPF & CNPJ) */}
        {activeTab === 'clients' && (
          <div className="space-y-8">
            
            {/* B2B CNPJ Table */}
            <div className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black uppercase italic text-amber-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>Clientes Lojistas / Atacado B2B ({cnpjClients.length})</span>
                </h3>
                <span className="text-[10px] text-gray-400">Exigência de Regime Tributário e CNPJ Validados</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-black text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Empresa / Razão Social</th>
                      <th className="p-3">CNPJ (Numérico / Alfanumérico)</th>
                      <th className="p-3">Regime Tributário</th>
                      <th className="p-3">Inscrição Estadual</th>
                      <th className="p-3">Contato & E-mail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cnpjClients.map((c, i) => (
                      <tr key={i} className="hover:bg-[#1a1a1a]">
                        <td className="p-3">
                          <strong className="text-white block uppercase">{c.companyName}</strong>
                          <span className="text-[10px] text-gray-400 block">{c.tradeName}</span>
                        </td>
                        <td className="p-3 font-mono text-amber-400 font-bold">
                          {c.cnpj}
                        </td>
                        <td className="p-3">
                          <span className="bg-amber-950/60 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            {c.taxRegime}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-gray-300">
                          {c.stateRegistration || 'Isento'}
                        </td>
                        <td className="p-3">
                          <span className="block text-gray-300">{c.phone}</span>
                          <span className="text-[10px] text-gray-500">{c.email}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B2C CPF Table */}
            <div className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black uppercase italic text-sky-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>Clientes Finais CPF ({cpfClients.length})</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-black text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Nome Completo</th>
                      <th className="p-3">CPF</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Endereço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cpfClients.map((c, i) => (
                      <tr key={i} className="hover:bg-[#1a1a1a]">
                        <td className="p-3 font-bold text-white uppercase">{c.fullName}</td>
                        <td className="p-3 font-mono text-sky-400">{c.cpf}</td>
                        <td className="p-3 text-gray-300">{c.phone}</td>
                        <td className="p-3 text-gray-300">{c.email}</td>
                        <td className="p-3 text-gray-400">{c.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: INQUIRIES & LEADS */}
        {activeTab === 'inquiries' && (
          <div className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black uppercase italic text-emerald-400 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>Solicitações de Cotação & Atendimento ({inquiries.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3">Cliente / Documento</th>
                    <th className="p-3">Produto Solicitado</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-[#1a1a1a]">
                      <td className="p-3">
                        <strong className="text-white block uppercase">{inq.clientName}</strong>
                        <span className="text-[10px] text-gray-400 block">
                          [{inq.clientType}] {inq.clientDocument} • {inq.clientPhone}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="text-amber-400 font-bold block">{inq.productName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">SKU: {inq.productSku}</span>
                      </td>

                      <td className="p-3 text-gray-400 font-mono">{inq.date}</td>

                      <td className="p-3">
                        <select
                          value={inq.status}
                          onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value as any)}
                          className="px-2 py-1 rounded bg-[#0A0A0A] border border-white/10 text-xs text-white"
                        >
                          <option value="Novo">Novo</option>
                          <option value="Em Atendimento">Em Atendimento</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                      </td>

                      <td className="p-3">
                        <a
                          href={`https://wa.me/${inq.clientPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-[#25D366] text-black font-black uppercase text-[10px] rounded hover:bg-[#1da851] transition inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Atender WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN SYSTEM USERS (SENIOR MASTER RESTRICTED) */}
        {activeTab === 'admins' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Senior Admin Only Notice */}
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded text-xs space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5 text-[#8B0000]" />
                <span>Controle de Permissão Master Senior</span>
              </div>
              <p className="text-gray-300">
                Apenas o Administrador Senior Master pode autorizar novos logins e conceder privilégios de edição total do catálogo.
              </p>
            </div>

            {/* List Current Admin Users */}
            <div className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-4">
              <h3 className="text-sm font-black uppercase italic text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#8B0000]" />
                <span>Administradores Autorizados</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-black text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Nome do Administrador</th>
                      <th className="p-3">E-mail de Acesso</th>
                      <th className="p-3">Nível</th>
                      <th className="p-3">Autorizado Por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminUsers.map((a) => (
                      <tr key={a.id} className="hover:bg-[#1a1a1a]">
                        <td className="p-3 font-bold text-white uppercase">{a.name}</td>
                        <td className="p-3 font-mono text-gray-300">{a.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.role === 'senior' ? 'bg-[#8B0000] text-white' : 'bg-zinc-800 text-gray-300'
                          }`}>
                            {a.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-emerald-400 font-bold text-[10px] uppercase">
                          ✓ Senior Master
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add New Admin Form */}
            {adminUser.role === 'senior' && (
              <div className="bg-[#111111] p-6 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-xs font-black uppercase italic text-amber-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Autorizar Novo Administrador</span>
                </h3>

                {adminSuccessMsg && (
                  <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded">
                    {adminSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Nome do Administrador
                    </label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Ex: Roberto Gerente Dakar"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      E-mail de Acesso
                    </label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="roberto@parisdakar.com.br"
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                      Nível de Permissão
                    </label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as AdminUser['role'])}
                      className="w-full px-3 py-2 rounded bg-[#1a1a1a] border border-white/10 text-white"
                    >
                      <option value="admin">Administrador Operacional — opera o catálogo, sem custo</option>
                      <option value="gerencia">Gerência — vê valor de reposição e margem</option>
                      <option value="senior">Sênior Master — controle total</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                      Somente <strong className="text-amber-400">Gerência</strong> e{' '}
                      <strong className="text-amber-400">Sênior</strong> enxergam o
                      ValorReposicao dos produtos.
                    </p>
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="bg-[#8B0000] hover:bg-red-800 text-white px-6 py-2.5 rounded font-black text-xs uppercase tracking-widest transition flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Cadastrar & Liberar Acesso Admin</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

      </div>


    </div>
  );
};
