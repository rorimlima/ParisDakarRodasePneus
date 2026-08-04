import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero3DVisualizer } from './components/Hero3DVisualizer';
import { SearchDashboard } from './components/SearchDashboard';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { InstagramFeed } from './components/InstagramFeed';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { Footer } from './components/Footer';

import { WhatsAppSellerModal } from './components/WhatsAppSellerModal';
import { storageService } from './services/storageService';
import {
  Product,
  ProductCategory,
  VehicleSearchFilter,
  SizeSearchFilter,
  B2BUser,
  UserSession,
  SiteSettings,
  Seller
} from './types';
import { ShieldCheck, Filter, PackageCheck, Building2, PhoneCall, Lock } from 'lucide-react';

export default function App() {
  // Dark Mode State — o site abre em modo claro por padrão
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Persistent Storage States
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => storageService.getSiteSettings());
  const [currentSession, setCurrentSession] = useState<UserSession>(() => storageService.getUserSession());
  const [sellers, setSellers] = useState<Seller[]>(() => storageService.getSellers());

  // View Mode ('store' or 'admin')
  const [viewMode, setViewMode] = useState<'store' | 'admin'>('store');

  // Computed B2B User for compatibility with ProductCard and Modals
  const b2bUser: B2BUser = currentSession.type === 'b2b' && currentSession.b2bUser
    ? currentSession.b2bUser
    : { isLoggedIn: false, companyName: '', cnpj: '', taxRegime: 'Simples Nacional', phone: '', email: '' };

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'todos'>('todos');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleSearchFilter | null>(null);
  const [sizeFilter, setSizeFilter] = useState<SizeSearchFilter | null>(null);

  // Modals State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'b2c' | 'b2b' | 'admin'>('b2c');
  const [isArchitectureViewerOpen, setIsArchitectureViewerOpen] = useState<boolean>(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState<boolean>(false);
  const [pendingWhatsAppMsg, setPendingWhatsAppMsg] = useState<string | undefined>(undefined);
  const [pendingProductContext, setPendingProductContext] = useState<Product | undefined>(undefined);

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

  // Execute WhatsApp redirection to a specific seller
  const executeWhatsAppOpen = (seller: Seller, messageText?: string, productContext?: Product) => {
    let cleanNumber = seller.phone.replace(/\D/g, '');
    if (!cleanNumber.startsWith('55') && cleanNumber.length <= 11) {
      cleanNumber = '55' + cleanNumber;
    }
    const defaultMsg = `Olá ${seller.name}! Gostaria de consultar rodas e pneus na Paris Dakar.`;
    const encoded = encodeURIComponent(messageText || defaultMsg);

    if (productContext) {
      storageService.addInquiry({
        clientName: currentSession.b2cUser?.fullName || currentSession.b2bUser?.companyName || 'Cliente Visitante',
        clientType: currentSession.type === 'b2b' ? 'CNPJ' : 'CPF',
        clientDocument: currentSession.b2cUser?.cpf || currentSession.b2bUser?.cnpj || 'Não Informado',
        clientPhone: currentSession.b2cUser?.phone || currentSession.b2bUser?.phone || 'WhatsApp',
        productName: productContext.name,
        productSku: productContext.sku,
        notes: `Atendimento direcionado para o vendedor: ${seller.name} (${seller.phone})`,
        assignedSeller: seller.name
      });
    }

    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank');
    setIsSellerModalOpen(false);
  };

  // Execute WhatsApp redirection to Central number
  const executeWhatsAppCentral = (messageText?: string, productContext?: Product) => {
    const rawNumber = siteSettings.whatsappNumber || '5511999998888';
    let cleanNumber = rawNumber.replace(/\D/g, '');
    if (!cleanNumber.startsWith('55') && cleanNumber.length <= 11) {
      cleanNumber = '55' + cleanNumber;
    }
    const defaultMsg = 'Olá equipe Paris Dakar! Gostaria de consultar rodas e pneus para meu veículo.';
    const encoded = encodeURIComponent(messageText || defaultMsg);

    if (productContext) {
      storageService.addInquiry({
        clientName: currentSession.b2cUser?.fullName || currentSession.b2bUser?.companyName || 'Cliente Visitante',
        clientType: currentSession.type === 'b2b' ? 'CNPJ' : 'CPF',
        clientDocument: currentSession.b2cUser?.cpf || currentSession.b2bUser?.cnpj || 'Não Informado',
        clientPhone: currentSession.b2cUser?.phone || currentSession.b2bUser?.phone || 'WhatsApp',
        productName: productContext.name,
        productSku: productContext.sku,
        notes: `Consulta enviada via WhatsApp Central.`
      });
    }

    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank');
    setIsSellerModalOpen(false);
  };

  // WhatsApp Consultation Handler
  const handleConsultWhatsApp = (messageText?: string, productContext?: Product) => {
    const activeSellers = sellers.filter((s) => s.isActive);

    if (activeSellers.length > 1) {
      // Open modal so customer can select seller
      setPendingWhatsAppMsg(messageText);
      setPendingProductContext(productContext);
      setIsSellerModalOpen(true);
    } else if (activeSellers.length === 1) {
      // Direct open to single active seller
      executeWhatsAppOpen(activeSellers[0], messageText, productContext);
    } else {
      // Fallback to central number
      executeWhatsAppCentral(messageText, productContext);
    }
  };

  // Filter Products Logic
  const filteredProducts = products.filter((product) => {
    // 0. Active status (Se desativado pelo Admin, oculta do site público)
    if (product.isActive === false) {
      return false;
    }

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

    // 3. Vehicle Filter
    if (vehicleFilter && vehicleFilter.marca) {
      const matchBrandOrModel = product.compatibleVehicles.some((v) => {
        const lowerV = v.toLowerCase();
        const brandMatch = lowerV.includes(vehicleFilter.marca.toLowerCase());
        const modelMatch = vehicleFilter.modelo ? lowerV.includes(vehicleFilter.modelo.toLowerCase()) : true;
        return brandMatch && modelMatch;
      });
      if (!matchBrandOrModel) return false;
    }

    // 4. Size Filter
    if (sizeFilter) {
      if (sizeFilter.aro && product.specs.aro && !product.specs.aro.includes(sizeFilter.aro.replace('"', ''))) {
        return false;
      }
      if (sizeFilter.furacao && product.specs.furacao && product.specs.furacao !== sizeFilter.furacao) {
        return false;
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
        onProductsUpdated={(updated) => setProducts(updated)}
        onSiteSettingsUpdated={(settings) => setSiteSettings(settings)}
        onSellersUpdated={(updated) => setSellers(updated)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#0A0A0A] text-[#111111] dark:text-white transition-colors duration-200 flex flex-col font-sans">
      
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
      />

      {/* 2. Interactive 3D Hero Section */}
      <Hero3DVisualizer
        onConsultWhatsApp={handleConsultWhatsApp}
        onExploreCatalog={() => {
          const section = document.getElementById('catalog-section');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. Main Catalog Section */}
      <main id="catalog-section" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">

        {/* Search & Filter Dashboard */}
        <SearchDashboard
          onApplyVehicleFilter={(filter) => setVehicleFilter(filter)}
          onApplySizeFilter={(filter) => setSizeFilter(filter)}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
        />

        {/* Filter Feedback Banner */}
        {(vehicleFilter || sizeFilter || searchQuery || activeCategory !== 'todos') && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-300">
            <div className="flex items-start gap-2 font-medium min-w-0">
              <Filter className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                Filtros ativos:{' '}
                {activeCategory !== 'todos' && <strong>[Categoria: {activeCategory}] </strong>}
                {vehicleFilter?.marca && <strong>[Veículo: {vehicleFilter.marca} {vehicleFilter.modelo}] </strong>}
                {sizeFilter?.aro && <strong>[Aro: {sizeFilter.aro}] </strong>}
                {sizeFilter?.furacao && <strong>[Furação: {sizeFilter.furacao}] </strong>}
                {searchQuery && <strong>[Busca: "{searchQuery}"] </strong>}
              </span>
            </div>

            <button
              onClick={() => {
                setVehicleFilter(null);
                setSizeFilter(null);
                setSearchQuery('');
                setActiveCategory('todos');
              }}
              className="text-red-700 dark:text-white underline font-bold hover:text-amber-600 dark:hover:text-amber-400 shrink-0 self-start sm:self-auto"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        )}

        {/* Section Heading & Items Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-black/10 dark:border-white/10 pb-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[#111111] dark:text-white uppercase tracking-tight flex items-center gap-2">
              <PackageCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B0000] shrink-0" />
              <span>Catálogo Paris Dakar // Pronta Entrega</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-gray-400">
              Exibindo <strong className="text-red-600 dark:text-red-400">{filteredProducts.length}</strong> itens cadastrados com suporte de cotação via WhatsApp.
            </p>
          </div>

          {currentSession.type === 'b2b' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111111] border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold self-start sm:self-auto min-w-0">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Pessoa Jurídica: {currentSession.b2bUser?.tradeName || currentSession.b2bUser?.companyName}</span>
            </div>
          )}

          {currentSession.type === 'admin' && (
            <button
              onClick={() => setViewMode('admin')}
              className="px-3.5 py-1.5 bg-[#8B0000] hover:bg-red-800 text-white rounded text-xs font-black uppercase tracking-wider flex items-center gap-2 transition self-start sm:self-auto"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Gerenciar Catálogo no Painel Admin</span>
            </button>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
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
          <div className="text-center py-12 sm:py-16 px-4 rounded-2xl bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-100 dark:bg-red-950/30 text-red-500 flex items-center justify-center mx-auto border border-red-300 dark:border-red-800/40">
              <Filter className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white px-2">
              Nenhum item encontrado para esta combinação de filtros
            </h3>
            <p className="text-xs text-zinc-500 dark:text-gray-400 max-w-md mx-auto px-2">
              Nossa equipe técnica pode encomendar conjuntos sob medida para a furação e offset exatos do seu projeto 4x4.
            </p>
            <button
              onClick={() => handleConsultWhatsApp("Olá! Não encontrei a medida exata no site. Podem me ajudar com uma cotação sob medida?")}
              className="btn-paris inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-bold text-xs uppercase"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>Consultar Especialista no WhatsApp</span>
            </button>
          </div>
        )}

      </main>

      {/* 4. Instagram Social Proof Showcase */}
      <InstagramFeed />

      {/* 5. Footer Section */}
      <Footer
        onConsultWhatsApp={handleConsultWhatsApp}
        onOpenB2BModal={() => handleOpenAuthModal('b2b')}
        onOpenArchitectureViewer={() => setIsArchitectureViewerOpen(true)}
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

      {/* WhatsApp Sellers Choice Modal */}
      <WhatsAppSellerModal
        isOpen={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
        sellers={sellers}
        productName={pendingProductContext?.name}
        onSelectSeller={(seller) => executeWhatsAppOpen(seller, pendingWhatsAppMsg, pendingProductContext)}
        onFallbackCentral={() => executeWhatsAppCentral(pendingWhatsAppMsg, pendingProductContext)}
      />

    </div>
  );
}
