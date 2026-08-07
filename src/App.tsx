import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SearchDashboard } from './components/SearchDashboard';
import { ProductCard } from './components/ProductCard';
import { StoreLocation } from './components/StoreLocation';
import { InstagramFeed } from './components/InstagramFeed';
import { Footer } from './components/Footer';
import { useTheme } from './hooks/useTheme';
import { useCatalogoPublico } from './hooks/useCatalogo';
import { storageService } from './services/storageService';
import { obterAuth } from './firebase/config';
import {
  Product,
  ProductCategory,
  VehicleSearchFilter,
  SizeSearchFilter,
  B2BUser,
  UserSession,
  SiteSettings,
  Seller,
  CartItem
} from './types';
import { Filter, PackageCheck, Building2, PhoneCall, Lock, X, Heart, ShoppingCart } from 'lucide-react';

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
const FavoritosCarrinho = lazy(() =>
  import('./components/FavoritosCarrinho').then((m) => ({ default: m.FavoritosCarrinho }))
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
  acessorios: 'Acessórios',
  promocao: '🔥 Promoção'
};

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const { produtosExibicao } = useCatalogoPublico();

  // Exibir produtos reais do Firestore ou do banco local, sem dados mock fictícios
  const [localProducts, setLocalProducts] = useState<Product[]>(() => storageService.getProducts());
  const products = useMemo(() => {
    if (produtosExibicao && produtosExibicao.length > 0) {
      return produtosExibicao;
    }
    return localProducts;
  }, [produtosExibicao, localProducts]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => storageService.getSiteSettings());
  const [currentSession, setCurrentSession] = useState<UserSession>(() => storageService.getUserSession());
  const [sellers, setSellers] = useState<Seller[]>(() => storageService.getSellers());

  useEffect(() => {
    storageService.fetchSiteSettings().then((remoteSettings) => {
      if (remoteSettings) {
        setSiteSettings(remoteSettings);
      }
    });
    storageService.fetchSellers().then((remoteSellers) => {
      if (remoteSellers && remoteSellers.length > 0) {
        setSellers(remoteSellers);
      }
    });

    // Capturar resultado de redirecionamento do Google Auth (login)
    const auth = obterAuth();
    if (auth) {
      import('firebase/auth').then(({ getRedirectResult }) => {
        getRedirectResult(auth)
          .then((result) => {
            if (result && result.user) {
              const user = result.user;
              storageService.syncCpfUserWithFirestore(user).then((existing) => {
                const session: UserSession = { type: 'b2c', b2cUser: existing };
                storageService.saveUserSession(session);
                setCurrentSession(session);
              });
            }
          })
          .catch((err) => {
            console.error('[Google Redirect Auth Error]', err);
          });
      });
    }
  }, []);

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
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isArchitectureViewerOpen, setIsArchitectureViewerOpen] = useState<boolean>(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState<boolean>(false);
  const [pendingWhatsAppMsg, setPendingWhatsAppMsg] = useState<string | undefined>(undefined);
  const [pendingProductContext, setPendingProductContext] = useState<Product | undefined>(undefined);

  // Favoritos e Carrinho (apenas para clientes B2C logados)
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleOpenAuthModal = useCallback((tab: 'b2c' | 'b2b' | 'admin' = 'b2c', mode: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  // --- FAVORITOS ---
  const handleAddToFavorites = useCallback((product: Product) => {
    setFavorites((prev) => prev.find((p) => p.id === product.id) ? prev : [...prev, product]);
  }, []);

  const handleRemoveFavorite = useCallback((productId: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  // --- CARRINHO ---
  const handleAddToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleUpdateCartQty = useCallback((productId: string, qty: number) => {
    setCart((prev) => prev.map((item) => item.product.id === productId ? { ...item, quantity: qty } : item));
  }, []);

  const handleClearCart = useCallback(() => setCart([]), []);

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

    const filtered = products.filter((product) => {
      // Itens desativados no painel admin não aparecem na loja
      if (product.isActive === false) return false;

      // Se a categoria selecionada não for 'todos', aplicamos o filtro correspondente.
      if (activeCategory !== 'todos') {
        if (activeCategory === 'acessorios') {
          // Acessórios serve como categoria agregadora para pecas, fixação, iluminacao, capota, engate, outros, etc.
          const principais = ['rodas', 'pneus', 'kits-lift', 'combos'];
          if (principais.includes(product.category)) return false;
        } else if ((activeCategory as string) === 'promocao') {
          // Aba Promoção: apenas produtos marcados como isPromocao
          if (!product.isPromocao) return false;
        } else {
          if (product.category !== activeCategory) return false;
        }
      }

      // Filtro: apenas pneus devem ter obrigatoriamente estoque > 4 para serem exibidos
      if (product.category === 'pneus' && (product.stockQuantity ?? 0) <= 4) return false;

      if (query) {
        const haystack = [
          product.name,
          product.brand,
          product.sku,
          product.specs.aro,
          product.specs.medidaPneu,
          ...(product.compatibleVehicles || [])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      if (vehicleFilter?.marca) {
        const brand = vehicleFilter.marca.toLowerCase();
        const model = vehicleFilter.modelo?.toLowerCase();
        
        const vehicles = product.compatibleVehicles || [];
        // Se houver lista de veículos compatíveis cadastrada, verifica a compatibilidade.
        if (vehicles.length > 0) {
          const compatible = vehicles.some((v) => {
            const lower = v.toLowerCase();
            // Verifica a marca (suporta marca contida no texto ou texto contido na marca)
            if (!lower.includes(brand) && !brand.includes(lower)) return false;
            
            if (!model) return true;
            
            // Verifica o modelo: correspondência direta
            if (lower.includes(model)) return true;
            
            // Correspondência por palavra principal (ex: "Hilux SRX" -> "Hilux")
            const modelWords = model.split(/\s+/).filter(w => w.length > 1);
            if (modelWords.length > 0) {
              const mainModelName = modelWords[0];
              if (mainModelName === 'ram' && modelWords.length > 1) {
                return lower.includes(modelWords[1]);
              }
              return lower.includes(mainModelName);
            }
            return false;
          });
          if (!compatible) return false;
        }
      }

      if (sizeFilter) {
        if (sizeFilter.aro) {
          const productAro = product.specs.aro;
          if (!productAro || !productAro.includes(sizeFilter.aro.replace('"', ''))) {
            return false;
          }
        }
        if (sizeFilter.furacao) {
          const productFuracao = product.specs.furacao;
          if (!productFuracao || productFuracao !== sizeFilter.furacao) {
            return false;
          }
        }
        if (sizeFilter.tipoPneu) {
          const productTipoPneu = product.specs.tipoPneu;
          if (!productTipoPneu || productTipoPneu !== sizeFilter.tipoPneu) {
            return false;
          }
        }
        // Filtro por medida de pneu — ex: "175/70R14", "265/70 R17"
        // Busca no nome, SKU e campo medidaPneu do produto (normalizado: sem espaços, caixa baixa)
        if (sizeFilter.medidaPneu) {
          const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '');
          const needle = normalize(sizeFilter.medidaPneu);
          const haystack = [
            product.name,
            product.sku,
            product.specs.medidaPneu || ''
          ].map(normalize).join(' ');
          if (!haystack.includes(needle)) return false;
        }
      }

      return true;
    });

    // Ordenar: produtos com badge 'PGA' primeiro
    return filtered.sort((a, b) => {
      const aPGA = a.badge?.toUpperCase().includes('PGA') ? 0 : 1;
      const bPGA = b.badge?.toUpperCase().includes('PGA') ? 0 : 1;
      return aPGA - bPGA;
    });
  }, [products, activeCategory, searchQuery, vehicleFilter, sizeFilter]);

  const hasActiveFilters =
    Boolean(vehicleFilter) || Boolean(sizeFilter) || Boolean(searchQuery) || activeCategory !== 'todos';

  // Produtos em destaque (máx. 4) para o carrossel da página principal
  const destaqueProducts = useMemo(
    () => products.filter((p) => p.isActive !== false && p.isDestaque).slice(0, 4),
    [products]
  );

  // Produtos em promoção para a seção "Promoções", exibida logo abaixo dos Destaques
  const promocaoProducts = useMemo(
    () => products.filter((p) => p.isActive !== false && p.isPromocao),
    [products]
  );

  // Estado do carrossel de destaques
  const [destaqueIdx, setDestaqueIdx] = React.useState(0);
  React.useEffect(() => {
    if (destaqueProducts.length < 2) return;
    const t = setInterval(() => setDestaqueIdx((i) => (i + 1) % destaqueProducts.length), 4000);
    return () => clearInterval(t);
  }, [destaqueProducts.length]);

  // Painel administrativo (rota interna)
  if (viewMode === 'admin' && currentSession.type === 'admin' && currentSession.adminUser) {
    return (
      <Suspense fallback={<FullScreenLoader label="Carregando painel administrativo" />}>
        <AdminDashboard
          adminUser={currentSession.adminUser}
          onExitAdmin={() => setViewMode('store')}
          onProductsUpdated={(updated) => {
            storageService.saveProducts(updated);
            setLocalProducts(updated);
          }}
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

        {/* ======================== CARROSSEL DESTAQUES ======================== */}
        {destaqueProducts.length > 0 && (
          <section aria-label="Produtos em destaque" className="pd-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b pd-border">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-lg" aria-hidden="true">★</span>
                <h2 className="text-xs font-black uppercase tracking-[0.14em] pd-text">Destaques</h2>
                <span className="text-[10px] font-bold pd-text-3 uppercase tracking-wider">— seleção especial</span>
              </div>
              <div className="flex items-center gap-1.5">
                {destaqueProducts.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Destaque ${i + 1}`}
                    onClick={() => setDestaqueIdx(i)}
                    className={`rounded-full transition-all ${
                      i === destaqueIdx
                        ? 'w-5 h-2 bg-[#8B0000]'
                        : 'w-2 h-2 pd-surface-2 border pd-border hover:border-[#8B0000]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Slide */}
            <div className="relative">
              {destaqueProducts.map((p, i) => {
                const discount = p.originalPrice && p.originalPrice > p.price
                  ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                  : null;
                return (
                  <div
                    key={p.id}
                    className={`transition-all duration-500 ${i === destaqueIdx ? 'block' : 'hidden'}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                      {/* Imagem */}
                      <div className="relative overflow-hidden bg-black/30 min-h-[220px] sm:min-h-[280px]">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                          style={{ maxHeight: '320px' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-yellow-500 text-black">
                            ★ Destaque
                          </span>
                          {p.isPromocao && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-[#8B0000] text-white">
                              🔥 {p.promoTipo || 'Promoção'}
                            </span>
                          )}
                          {discount && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-orange-600 text-white">
                              -{discount}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-6 flex flex-col justify-between">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest pd-brand-text">{p.brand}</p>
                          <h3 className="text-lg font-black uppercase tracking-tight pd-text leading-tight">{p.name}</h3>
                          <p className="text-xs pd-text-3 line-clamp-2 leading-relaxed">{p.description}</p>
                          {p.specs.aro && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {p.specs.aro && <span className="text-[10px] px-2 py-0.5 rounded pd-surface-2 border pd-border pd-text-2 font-bold">Aro {p.specs.aro}</span>}
                              {p.specs.medidaPneu && <span className="text-[10px] px-2 py-0.5 rounded pd-surface-2 border pd-border pd-text-2 font-bold">{p.specs.medidaPneu}</span>}
                              {p.specs.furacao && <span className="text-[10px] px-2 py-0.5 rounded pd-surface-2 border pd-border pd-text-2 font-bold">{p.specs.furacao}</span>}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 pt-4">
                          {p.originalPrice && p.originalPrice > p.price && (
                            <p className="text-xs line-through pd-text-3">
                              R$ {p.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          <p className="text-2xl font-black pd-brand-text">
                            R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(p)}
                            className="btn btn-primary w-full sm:w-auto"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Ver detalhes</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Prev / Next arrows */}
              {destaqueProducts.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Anterior"
                    onClick={() => setDestaqueIdx((i) => (i - 1 + destaqueProducts.length) % destaqueProducts.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full pd-surface border pd-border flex items-center justify-center hover:border-[#8B0000] hover:pd-brand-text transition text-sm font-bold pd-text-2 shadow"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Próximo"
                    onClick={() => setDestaqueIdx((i) => (i + 1) % destaqueProducts.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full pd-surface border pd-border flex items-center justify-center hover:border-[#8B0000] hover:pd-brand-text transition text-sm font-bold pd-text-2 shadow"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {/* ======================== PROMOÇÕES ======================== */}
        {promocaoProducts.length > 0 && (
          <section aria-label="Promoções" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">🔥</span>
              <h2 className="text-xs font-black uppercase tracking-[0.14em] pd-text">Promoções</h2>
              <span className="text-[10px] font-bold pd-text-3 uppercase tracking-wider">
                — {promocaoProducts.length === 1 ? 'oferta por tempo limitado' : 'ofertas por tempo limitado'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {promocaoProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  b2bUser={b2bUser}
                  onOpenDetails={setSelectedProduct}
                  onConsultWhatsApp={(msg) => handleConsultWhatsApp(msg, product)}
                  onOpenB2BModal={() => handleOpenAuthModal('b2b')}
                  isB2CLoggedIn={currentSession.type === 'b2c'}
                  isFavorited={favorites.some((f) => f.id === product.id)}
                  onAddToFavorites={() => handleAddToFavorites(product)}
                  onRemoveFromFavorites={() => handleRemoveFavorite(product.id)}
                  onAddToCart={() => { handleAddToCart(product); setIsCartOpen(true); }}
                />
              ))}
            </div>
          </section>
        )}

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
          <div className="min-w-0">
            <h2 className="pd-serif text-xl sm:text-2xl font-extrabold uppercase tracking-tight pd-text flex items-center gap-2.5">
              <PackageCheck className="w-5 h-5 shrink-0 pd-brand-text" aria-hidden="true" />
              <span>Catálogo — pronta entrega</span>
            </h2>
            <p className="text-xs pd-text-3 mt-1.5">
              <strong className="pd-brand-text">{filteredProducts.length}</strong>{' '}
              {filteredProducts.length === 1 ? 'item disponível' : 'itens disponíveis'} com cotação via
              WhatsApp.
            </p>
          </div>

          {currentSession.type === 'b2b' && (
            <span className="pd-badge pd-badge-gold">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              {currentSession.b2bUser?.tradeName || currentSession.b2bUser?.companyName}
            </span>
          )}

          {currentSession.type === 'admin' && (
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className="btn btn-primary btn-sm w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Gerenciar catálogo</span>
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                b2bUser={b2bUser}
                onOpenDetails={setSelectedProduct}
                onConsultWhatsApp={(msg) => handleConsultWhatsApp(msg, product)}
                onOpenB2BModal={() => handleOpenAuthModal('b2b')}
                isB2CLoggedIn={currentSession.type === 'b2c'}
                isFavorited={favorites.some((f) => f.id === product.id)}
                onAddToFavorites={() => handleAddToFavorites(product)}
                onRemoveFromFavorites={() => handleRemoveFavorite(product.id)}
                onAddToCart={() => { handleAddToCart(product); setIsCartOpen(true); }}
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
        )}
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
        onOpenAdminPanel={() => handleOpenAuthModal('admin')}
      />

      {/* Botão flutuante do carrinho — apenas para clientes B2C logados */}
      {currentSession.type === 'b2c' && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#8B0000] text-white shadow-2xl flex items-center justify-center hover:bg-red-700 transition-all hover:scale-110 border-2 border-red-900"
          aria-label="Abrir favoritos e carrinho"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#8B0000] rounded-full text-[10px] font-black flex items-center justify-center border border-[#8B0000]">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      )}

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
            initialMode={authModalMode}
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

        {isCartOpen && (
          <FavoritosCarrinho
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            favorites={favorites}
            cart={cart}
            currentB2CUser={currentSession.b2cUser}
            sellers={sellers}
            onRemoveFavorite={handleRemoveFavorite}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateQty={handleUpdateCartQty}
            onClearCart={handleClearCart}
            onSendToWhatsApp={(msg) => handleConsultWhatsApp(msg)}
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
