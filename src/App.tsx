import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { SearchDashboard } from './components/SearchDashboard';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { InstagramFeed } from './components/InstagramFeed';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { Footer } from './components/Footer';

import { storageService } from './services/storageService';
import { useCatalogoPublico } from './hooks/useCatalogo';
import {
  Product,
  ProductCategory,
  SizeSearchFilter,
  B2BUser,
  UserSession,
  SiteSettings
} from './types';
import { Filter, PackageCheck, Building2, PhoneCall, Lock, Loader2, MapPin, Phone, Clock } from 'lucide-react';

export default function App() {
  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(true);

  /**
   * Catálogo público: o hook assina apenas produtos com `ativo == true`.
   * Produto desativado ou com estoque zerado não chega sequer ao cliente —
   * a restrição está na query, nas Security Rules e no filtro do hook.
   */
  const {
    produtosExibicao: products,
    gruposComProdutos,
    carregando: carregandoCatalogo
  } = useCatalogoPublico();

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => storageService.getSiteSettings());
  const [currentSession, setCurrentSession] = useState<UserSession>(() => storageService.getUserSession());

  // View Mode ('store' or 'admin')
  const [viewMode, setViewMode] = useState<'store' | 'admin'>('store');

  // Computed B2B User for compatibility with ProductCard and Modals
  const b2bUser: B2BUser = currentSession.type === 'b2b' && currentSession.b2bUser
    ? currentSession.b2bUser
    : { isLoggedIn: false, companyName: '', cnpj: '', taxRegime: 'Simples Nacional', phone: '', email: '' };

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'todos'>('todos');
  const [sizeFilter, setSizeFilter] = useState<SizeSearchFilter | null>(null);

  // Modals State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'b2c' | 'b2b' | 'admin'>('b2c');
  const [isArchitectureViewerOpen, setIsArchitectureViewerOpen] = useState<boolean>(false);

  // Sync Dark Mode class with HTML root element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Open Auth Modal with specific tab
  const handleOpenAuthModal = (tab: 'b2c' | 'b2b' | 'admin' = 'b2c') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  // WhatsApp Consultation Handler
  const handleConsultWhatsApp = (messageText?: string, productContext?: Product) => {
    const rawNumber = siteSettings.whatsappNumber || '5511999998888';
    const cleanNumber = rawNumber.replace(/\D/g, '');
    const defaultMsg = 'Olá equipe Paris Dakar! Gostaria de consultar rodas e pneus para meu veículo.';
    const encoded = encodeURIComponent(messageText || defaultMsg);

    // Log lead inquiry if productContext is passed
    if (productContext) {
      storageService.addInquiry({
        clientName: currentSession.b2cUser?.fullName || currentSession.b2bUser?.companyName || 'Cliente Visitante',
        clientType: currentSession.type === 'b2b' ? 'CNPJ' : 'CPF',
        clientDocument: currentSession.b2cUser?.cpf || currentSession.b2bUser?.cnpj || 'Não Informado',
        clientPhone: currentSession.b2cUser?.phone || currentSession.b2bUser?.phone || 'WhatsApp',
        productName: productContext.name,
        productSku: productContext.sku,
        notes: `Consulta enviada via WhatsApp pelo site.`
      });
    }

    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank');
  };

  // Filter Products Logic
  const filteredProducts = products.filter((product) => {
    // 1. Category Filter
    if (activeCategory !== 'todos' && product.category !== activeCategory) {

      return false;
    }

    // 2. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchBrand = product.brand.toLowerCase().includes(q);
      const matchSku = product.sku.toLowerCase().includes(q);
      const matchAro = product.specs.aro?.toLowerCase().includes(q);
      const matchPneu = product.specs.medidaPneu?.toLowerCase().includes(q);
      const matchVehicles = product.compatibleVehicles.some((v) => v.toLowerCase().includes(q));

      if (!matchName && !matchBrand && !matchSku && !matchAro && !matchPneu && !matchVehicles) {
        return false;
      }
    }


    // 4. Size Filter
    if (sizeFilter) {
      if (sizeFilter.aro && product.specs.aro && !product.specs.aro.includes(sizeFilter.aro.replace('"', ''))) {
        return false;
      }
      if (sizeFilter.furacao && product.specs.furacao && product.specs.furacao !== sizeFilter.furacao) {
        return false;
      }
      if (sizeFilter.medidaPneu && sizeFilter.medidaPneu.trim()) {
        const qMedida = sizeFilter.medidaPneu.toLowerCase().replace(/\s+/g, '');
        const prodMedida = (product.specs.medidaPneu || '').toLowerCase().replace(/\s+/g, '');
        const prodName = product.name.toLowerCase();
        if (!prodMedida.includes(qMedida) && !prodName.includes(sizeFilter.medidaPneu.toLowerCase())) {
          return false;
        }
      }
      if (sizeFilter.tipoPneu && product.specs.tipoPneu && product.specs.tipoPneu !== sizeFilter.tipoPneu) {
        return false;
      }
    }

    return true;
  });

  // If in Admin Dashboard view mode and Admin is authenticated
  if (viewMode === 'admin' && currentSession.type === 'admin' && currentSession.adminUser) {
    return (
      <AdminDashboard
        adminUser={currentSession.adminUser}
        onExitAdmin={() => setViewMode('store')}
        onSiteSettingsUpdated={(settings) => setSiteSettings(settings)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0A0A0A] text-slate-900 dark:text-white transition-colors duration-200 flex flex-col font-sans">
      
      {/* 1. Header Navbar */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        currentSession={currentSession}
        onOpenAuthModal={(tab) => handleOpenAuthModal(tab)}
        onOpenAdminDashboard={() => setViewMode('admin')}
        onOpenArchitectureViewer={() => setIsArchitectureViewerOpen(true)}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        onConsultWhatsApp={handleConsultWhatsApp}
        announcementText={siteSettings.announcementText}
        siteLogo={siteSettings.siteLogo}
      />

      {/* 2. YouTube Video Hero Section */}
      <HeroSection
        onConsultWhatsApp={handleConsultWhatsApp}
        onExploreCatalog={() => {
          const section = document.getElementById('catalog-section');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        }}
        siteSettings={siteSettings}
      />

      {/* 3. Main Catalog Section */}
      <main id="catalog-section" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Search & Filter Dashboard */}
        <SearchDashboard
          onApplySizeFilter={(filter) => setSizeFilter(filter)}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          categorias={gruposComProdutos}
        />

        {/* Filter Feedback Banner */}
        {(sizeFilter || searchQuery || activeCategory !== 'todos') && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-red-950/20 border border-red-800/40 text-xs text-red-300">
            <div className="flex items-center gap-2 font-medium">
              <Filter className="w-4 h-4 text-red-500" />
              <span>
                Filtros ativos:{' '}
                {activeCategory !== 'todos' && <strong>[Categoria: {activeCategory}] </strong>}
                {sizeFilter?.aro && <strong>[Aro: {sizeFilter.aro}] </strong>}
                {sizeFilter?.furacao && <strong>[Furação: {sizeFilter.furacao}] </strong>}
                {searchQuery && <strong>[Busca: "{searchQuery}"] </strong>}
              </span>
            </div>

            <button
              onClick={() => {
                setSizeFilter(null);
                setSearchQuery('');
                setActiveCategory('todos');
              }}
              className="text-white underline font-bold hover:text-amber-400"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        )}

        {/* Section Heading & Items Count */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 font-heading">
              <PackageCheck className="w-5 h-5 text-red-500" />
              <span>Catálogo de Produtos em Pronta Entrega</span>
            </h2>
            <p className="text-xs text-zinc-400 font-normal">
              Exibindo <strong className="text-red-400 font-semibold">{filteredProducts.length}</strong> de{' '}
              {products.length} produtos ativos em estoque com cotação direta via WhatsApp.
            </p>
          </div>

          {currentSession.type === 'b2b' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111111] border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Building2 className="w-4 h-4" />
              <span>Pessoa Jurídica: {currentSession.b2bUser?.tradeName || currentSession.b2bUser?.companyName}</span>
            </div>
          )}

          {currentSession.type === 'admin' && (
            <button
              onClick={() => setViewMode('admin')}
              className="px-3.5 py-1.5 bg-[#8B0000] hover:bg-red-800 text-white rounded text-xs font-black uppercase tracking-wider flex items-center gap-2 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Gerenciar Catálogo no Painel Admin</span>
            </button>
          )}
        </div>

        {/* Product Cards Grid */}
        {carregandoCatalogo ? (
          <div className="text-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#8B0000]" />
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
              Carregando catálogo...
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                b2bUser={b2bUser}
                onOpenDetails={(p) => setSelectedProduct(p)}
                onConsultWhatsApp={(msg) => handleConsultWhatsApp(msg, product)}
                onOpenB2BModal={() => handleOpenAuthModal('b2b')}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#111111] border border-white/10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-950/30 text-red-500 flex items-center justify-center mx-auto border border-red-800/40">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Nenhum item encontrado para esta combinação de filtros
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Nossa equipe técnica pode encomendar conjuntos sob medida para a furação e offset exatos do seu projeto 4x4.
            </p>
            <button
              onClick={() => handleConsultWhatsApp("Olá! Não encontrei a medida exata no site. Podem me ajudar com uma cotação sob medida?")}
              className="btn-paris inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Consultar Especialista no WhatsApp</span>
            </button>
          </div>
        )}

      </main>

      {/* 4. Instagram Social Proof Showcase */}
      <InstagramFeed siteSettings={siteSettings} />

      {/* 4.5. Google Maps Location Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-lg dark:shadow-2xl transition-colors">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8B0000] dark:text-red-500">
                  Como nos encontrar
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                  Showroom Principal
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                  Visite-nos para ver de perto nossa seleção exclusiva de rodas forjadas heavy-duty e pneus off-road. Nossa equipe de especialistas está pronta para orientar seu projeto 4x4.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/30 flex items-center justify-center text-[#8B0000] dark:text-red-500 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Endereço</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">{siteSettings.address}</p>
                  </div>
                </div>

                {siteSettings.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Telefone</h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">{siteSettings.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/30 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Horário de Funcionamento</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">Segunda a Sexta: 08h às 18h | Sábado: 08h às 12h</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteSettings.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#8B0000] hover:bg-red-800 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/35"
                >
                  <MapPin className="w-4 h-4" />
                  Como Chegar (Google Maps)
                </a>

                <button
                  onClick={() => handleConsultWhatsApp("Olá! Gostaria de agendar uma visita ao showroom para ver modelos de rodas e pneus.")}
                  className="bg-transparent border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 text-slate-800 dark:text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-500" />
                  Agendar Visita
                </button>
              </div>
            </div>

            {/* Map Column */}
            <div className="lg:col-span-7 h-[350px] sm:h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner relative group">
              <iframe
                title="Paris Dakar Localização"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(siteSettings.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
                className="opacity-90 dark:opacity-80 dark:invert-[0.9] dark:hue-rotate-[180deg] transition-opacity duration-300 group-hover:opacity-100 group-hover:dark:opacity-90"
              />
            </div>

          </div>
        </div>
      </section>

      {/* 5. Footer Section */}
      <Footer
        onConsultWhatsApp={handleConsultWhatsApp}
        onOpenB2BModal={() => handleOpenAuthModal('b2b')}
        onOpenArchitectureViewer={() => setIsArchitectureViewerOpen(true)}
        siteLogo={siteSettings.siteLogo}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        b2bUser={b2bUser}
        onConsultWhatsApp={(msg) => selectedProduct && handleConsultWhatsApp(msg, selectedProduct)}
        onOpenB2BModal={() => handleOpenAuthModal('b2b')}
      />

      {/* Auth Portal Modal (CPF / CNPJ / ADMIN) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentSession={currentSession}
        initialTab={authModalTab}
        onLoginSuccess={(newSession) => {
          setCurrentSession(newSession);
          if (newSession.type === 'admin') {
            setViewMode('admin');
          }
        }}
      />

      {/* Next.js & Vercel Architecture Viewer Modal */}
      {isArchitectureViewerOpen && (
        <ArchitectureViewer onClose={() => setIsArchitectureViewerOpen(false)} />
      )}

    </div>
  );
}
