import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SearchDashboard } from './components/SearchDashboard';
import { ProductCard } from './components/ProductCard';
import { StoreLocation } from './components/StoreLocation';
import { InstagramFeed } from './components/InstagramFeed';
import { Footer } from './components/Footer';
import { useTheme } from './hooks/useTheme';
import { useCatalog } from './hooks/useCatalog';
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
import { Filter, PackageCheck, Building2, PhoneCall, Lock, X, ServerCrash, RefreshCw } from 'lucide-react';

/*
 * Telas pesadas ficam em chunks separados: o visitante que só navega no
 * catálogo nunca baixa o painel admin, o portal de login nem os modais.
 */
const ProductDetailModal = lazy(() =>
  import('./components/ProductDetailModal').then((m) => ({ default: m.ProductDetailModal }))
);
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const ArchitectureViewer = lazy(() =>
  import('./components/ArchitectureViewer').then((m) => ({ default: m.ArchitectureViewer }))
);
const WhatsAppSellerModal = lazy(() =>
  import('./components/WhatsAppSellerModal').then((m) => ({ default: m.WhatsAppSellerModal }))
);

const EMPTY_B2B_USER: B2BUser = {
  isLoggedIn: false,
  companyName: '',
  cnpj: '',
  taxRegime: 'Simples Nacional',
  phone: '',
  email: ''
};

const CATEGORY_LABELS: Record<string, string> = {
  rodas: 'Rodas off-road',
  pneus: 'Pneus',
  'kits-lift': 'Kits de lift',
  combos: 'Combos',
  acessorios: 'Acessórios'
};

export default function App() {
  const { isDark, toggleTheme } = useTheme();

  // Catálogo vem da API (Firestore). O resto ainda é local — ver README.
  const { products, status: catalogStatus, error: catalogError, reload: reloadCatalog, setProducts } = useCatalog();
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => storageService.getSiteSettings());
  const [currentSession, setCurrentSession] = useState<UserSession>(() => storageService.getUserSession());
  const [sellers, setSellers] = useState<Seller[]>(() => storageService.getSellers());

  const [viewMode, setViewMode] = useState<'store' | 'admin'>('store');

  const b2bUser: B2BUser =
    currentSession.type === 'b2b' && currentSession.b2bUser ? currentSession.b2bUser : EMPTY_B2B_USER;

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'todos'>('todos');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleSearchFilter | null>(null);
  const [sizeFilter, setSizeFilter] = useState<SizeSearchFilter | null>(null);

  // Modais
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'b2c' | 'b2b' | 'admin'>('b2c');
  const [isArchitectureViewerOpen, setIsArchitectureViewerOpen] = useState<boolean>(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState<boolean>(false);
  const [pendingWhatsAppMsg, setPendingWhatsAppMsg] = useState<string | undefined>(undefined);
  const [pendingProductContext, setPendingProductContext] = useState<Product | undefined>(undefined);

  const handleOpenAuthModal = useCallback((tab: 'b2c' | 'b2b' | 'admin' = 'b2c') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const logInquiry = useCallback(
    (productContext: Product, notes: string, assignedSeller?: string) => {
      storageService.addInquiry({
        clientName:
          currentSession.b2cUser?.fullName || currentSession.b2bUser?.companyName || 'Cliente visitante',
        clientType: currentSession.type === 'b2b' ? 'CNPJ' : 'CPF',
        clientDocument: currentSession.b2cUser?.cpf || currentSession.b2bUser?.cnpj || 'Não informado',
        clientPhone: currentSession.b2cUser?.phone || currentSession.b2bUser?.phone || 'WhatsApp',
        productName: productContext.name,
        productSku: productContext.sku,
        notes,
        assignedSeller
      });
    },
    [currentSession]
  );

  const openWhatsApp = useCallback((rawNumber: string, message: string) => {
    let cleanNumber = rawNumber.replace(/\D/g, '');
    if (!cleanNumber.startsWith('55') && cleanNumber.length <= 11) {
      cleanNumber = `55${cleanNumber}`;
    }
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }, []);

  const executeWhatsAppOpen = useCallback(
    (seller: Seller, messageText?: string, productContext?: Product) => {
      const message =
        messageText || `Olá ${seller.name}! Gostaria de consultar rodas e pneus na Paris Dakar.`;

      if (productContext) {
        logInquiry(
          productContext,
          `Atendimento direcionado para o vendedor: ${seller.name} (${seller.phone})`,
          seller.name
        );
      }

      openWhatsApp(seller.phone, message);
      setIsSellerModalOpen(false);
    },
    [logInquiry, openWhatsApp]
  );

  const executeWhatsAppCentral = useCallback(
    (messageText?: string, productContext?: Product) => {
      const message =
        messageText || 'Olá equipe Paris Dakar! Gostaria de consultar rodas e pneus para meu veículo.';

      if (productContext) {
        logInquiry(productContext, 'Consulta enviada via WhatsApp central.');
      }

      openWhatsApp(siteSettings.whatsappNumber || '5511999998888', message);
      setIsSellerModalOpen(false);
    },
    [logInquiry, openWhatsApp, siteSettings.whatsappNumber]
  );

  const handleConsultWhatsApp = useCallback(
    (messageText?: string, productContext?: Product) => {
      const activeSellers = sellers.filter((s) => s.isActive);

      if (activeSellers.length > 1) {
        setPendingWhatsAppMsg(messageText);
        setPendingProductContext(productContext);
        setIsSellerModalOpen(true);
      } else if (activeSellers.length === 1) {
        executeWhatsAppOpen(activeSellers[0], messageText, productContext);
      } else {
        executeWhatsAppCentral(messageText, productContext);
      }
    },
    [sellers, executeWhatsAppOpen, executeWhatsAppCentral]
  );

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const clearAllFilters = useCallback(() => {
    setVehicleFilter(null);
    setSizeFilter(null);
    setSearchQuery('');
    setActiveCategory('todos');
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      // Itens desativados no painel admin não aparecem na loja
      if (product.isActive === false) return false;

      if (activeCategory !== 'todos' && product.category !== activeCategory) return false;

      if (query) {
        const haystack = [
          product.name,
          product.brand,
          product.sku,
          product.specs.aro,
          product.specs.medidaPneu,
          ...product.compatibleVehicles
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      if (vehicleFilter?.marca) {
        const brand = vehicleFilter.marca.toLowerCase();
        const model = vehicleFilter.modelo?.toLowerCase();
        const compatible = product.compatibleVehicles.some((v) => {
          const lower = v.toLowerCase();
          return lower.includes(brand) && (model ? lower.includes(model) : true);
        });
        if (!compatible) return false;
      }

      if (sizeFilter) {
        if (
          sizeFilter.aro &&
          product.specs.aro &&
          !product.specs.aro.includes(sizeFilter.aro.replace('"', ''))
        ) {
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
  }, [products, activeCategory, searchQuery, vehicleFilter, sizeFilter]);

  const hasActiveFilters =
    Boolean(vehicleFilter) || Boolean(sizeFilter) || Boolean(searchQuery) || activeCategory !== 'todos';

  // Painel administrativo (rota interna)
  if (viewMode === 'admin' && currentSession.type === 'admin' && currentSession.adminUser) {
    return (
      <Suspense fallback={<FullScreenLoader label="Carregando painel administrativo" />}>
        <AdminDashboard
          adminUser={currentSession.adminUser}
          onExitAdmin={() => setViewMode('store')}
          onProductsUpdated={setProducts}
          onSiteSettingsUpdated={setSiteSettings}
          onSellersUpdated={setSellers}
        />
      </Suspense>
    );
  }

  return (
    <div id="topo" className="pd-page min-h-screen flex flex-col">
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        currentSession={currentSession}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenAdminDashboard={() => setViewMode('admin')}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        onConsultWhatsApp={handleConsultWhatsApp}
        announcementText={siteSettings.announcementText}
      />

      <Hero
        title={siteSettings.heroTitle}
        subtitle={siteSettings.heroSubtitle}
        onConsultWhatsApp={handleConsultWhatsApp}
        onExploreCatalog={() => scrollToId('catalog-section')}
        onOpenLocation={() => scrollToId('localizacao')}
      />

      <main
        id="catalog-section"
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 scroll-mt-24"
      >
        <SearchDashboard
          onApplyVehicleFilter={setVehicleFilter}
          onApplySizeFilter={setSizeFilter}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {hasActiveFilters && (
          <div className="pd-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Filter className="w-4 h-4 pd-brand-text shrink-0" aria-hidden="true" />
              <span className="pd-text-2 font-medium">Filtros ativos:</span>

              {activeCategory !== 'todos' && (
                <span className="pd-badge pd-badge-brand">
                  {CATEGORY_LABELS[activeCategory] || activeCategory}
                </span>
              )}
              {vehicleFilter?.marca && (
                <span className="pd-badge pd-badge-brand">
                  {vehicleFilter.marca} {vehicleFilter.modelo}
                </span>
              )}
              {sizeFilter?.aro && <span className="pd-badge pd-badge-brand">Aro {sizeFilter.aro}</span>}
              {sizeFilter?.furacao && <span className="pd-badge pd-badge-brand">{sizeFilter.furacao}</span>}
              {searchQuery && <span className="pd-badge pd-badge-brand">“{searchQuery}”</span>}
            </div>

            <button type="button" onClick={clearAllFilters} className="btn btn-subtle btn-sm">
              <X className="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </button>
          </div>
        )}

        {/* Cabeçalho do catálogo */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b pd-border">
          <div>
            <h2 className="pd-serif text-xl sm:text-2xl font-extrabold uppercase tracking-tight pd-text flex items-center gap-2.5">
              <PackageCheck className="w-5 h-5 pd-brand-text" aria-hidden="true" />
              <span>Catálogo — pronta entrega</span>
            </h2>
            <p className="text-xs pd-text-3 mt-1.5">
              {catalogStatus === 'loading' ? (
                'Carregando catálogo...'
              ) : (
                <>
                  <strong className="pd-brand-text">{filteredProducts.length}</strong>{' '}
                  {filteredProducts.length === 1 ? 'item disponível' : 'itens disponíveis'} com cotação
                  via WhatsApp.
                </>
              )}
            </p>
          </div>

          {currentSession.type === 'b2b' && (
            <span className="pd-badge pd-badge-gold">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              {currentSession.b2bUser?.tradeName || currentSession.b2bUser?.companyName}
            </span>
          )}

          {currentSession.type === 'admin' && (
            <button type="button" onClick={() => setViewMode('admin')} className="btn btn-primary btn-sm">
              <Lock className="w-3.5 h-3.5" />
              <span>Gerenciar catálogo</span>
            </button>
          )}
        </div>

        {catalogStatus === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pd-card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] w-full pd-surface-2" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/3 rounded pd-surface-2" />
                  <div className="h-4 w-full rounded pd-surface-2" />
                  <div className="h-4 w-2/3 rounded pd-surface-2" />
                  <div className="h-9 w-full rounded pd-surface-2 mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {catalogStatus === 'error' && (
          <div className="pd-card text-center py-16 px-6 space-y-4" role="alert">
            <div
              className="w-14 h-14 rounded-full pd-surface-2 pd-brand-text flex items-center justify-center mx-auto border pd-border"
              aria-hidden="true"
            >
              <ServerCrash className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold pd-text">Não foi possível carregar o catálogo</h3>
            <p className="text-xs pd-text-3 max-w-md mx-auto leading-relaxed">{catalogError}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button type="button" onClick={reloadCatalog} className="btn btn-primary">
                <RefreshCw className="w-4 h-4" />
                <span>Tentar novamente</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleConsultWhatsApp('Olá! O site está fora do ar. Podem me atender por aqui?')
                }
                className="btn btn-whats"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Falar no WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {catalogStatus === 'ready' && (filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                b2bUser={b2bUser}
                onOpenDetails={setSelectedProduct}
                onConsultWhatsApp={(msg) => handleConsultWhatsApp(msg, product)}
                onOpenB2BModal={() => handleOpenAuthModal('b2b')}
              />
            ))}
          </div>
        ) : (
          <div className="pd-card text-center py-16 px-6 space-y-4">
            <div
              className="w-14 h-14 rounded-full pd-surface-2 pd-brand-text flex items-center justify-center mx-auto border pd-border"
              aria-hidden="true"
            >
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold pd-text">Nenhum item para esta combinação de filtros</h3>
            <p className="text-xs pd-text-3 max-w-md mx-auto leading-relaxed">
              Nossa equipe técnica encomenda conjuntos sob medida para a furação e o offset exatos do seu
              projeto 4x4.
            </p>
            <button
              type="button"
              onClick={() =>
                handleConsultWhatsApp(
                  'Olá! Não encontrei a medida exata no site. Podem me ajudar com uma cotação sob medida?'
                )
              }
              className="btn btn-primary btn-lg"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Consultar especialista</span>
            </button>
          </div>
        ))}
      </main>

      <StoreLocation
        address={siteSettings.address}
        phone={siteSettings.phone}
        onConsultWhatsApp={handleConsultWhatsApp}
      />

      <InstagramFeed />

      <Footer
        onConsultWhatsApp={handleConsultWhatsApp}
        onOpenB2BModal={() => handleOpenAuthModal('b2b')}
        onOpenArchitectureViewer={() => setIsArchitectureViewerOpen(true)}
      />

      {/* Chunks sob demanda */}
      <Suspense fallback={null}>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            b2bUser={b2bUser}
            onConsultWhatsApp={(msg) => handleConsultWhatsApp(msg, selectedProduct)}
            onOpenB2BModal={() => handleOpenAuthModal('b2b')}
          />
        )}

        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentSession={currentSession}
            initialTab={authModalTab}
            onLoginSuccess={(newSession) => {
              setCurrentSession(newSession);
              if (newSession.type === 'admin') setViewMode('admin');
            }}
          />
        )}

        {isArchitectureViewerOpen && (
          <ArchitectureViewer onClose={() => setIsArchitectureViewerOpen(false)} />
        )}

        {isSellerModalOpen && (
          <WhatsAppSellerModal
            isOpen={isSellerModalOpen}
            onClose={() => setIsSellerModalOpen(false)}
            sellers={sellers}
            productName={pendingProductContext?.name}
            onSelectSeller={(seller) =>
              executeWhatsAppOpen(seller, pendingWhatsAppMsg, pendingProductContext)
            }
            onFallbackCentral={() => executeWhatsAppCentral(pendingWhatsAppMsg, pendingProductContext)}
          />
        )}
      </Suspense>
    </div>
  );
}

const FullScreenLoader: React.FC<{ label: string }> = ({ label }) => (
  <div className="pd-page min-h-screen flex flex-col items-center justify-center gap-4">
    <div
      className="w-9 h-9 rounded-full border-2 border-transparent animate-spin"
      style={{ borderTopColor: 'var(--pd-brand)', borderRightColor: 'var(--pd-brand)' }}
      aria-hidden="true"
    />
    <p className="text-xs font-bold uppercase tracking-widest pd-text-3">{label}</p>
  </div>
);
