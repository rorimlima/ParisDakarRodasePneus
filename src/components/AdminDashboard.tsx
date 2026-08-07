import React, { useState, useEffect } from 'react';
import {
  Package,
  Settings,
  Users,
  Building2,
  User,
  ShieldCheck,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Phone,
  MessageCircle,
  MapPin,
  Eye,
  EyeOff,
  Upload,
  Download,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  LogOut,
  ArrowLeft,
  DollarSign,
  Layers,
  Sparkles,
  Tag,
  Lock,
  Briefcase,
  Headphones,
  UserCheck
} from 'lucide-react';

import {
  Product,
  SiteSettings,
  CpfClient,
  B2BUser,
  AdminUser,
  InquiryLog,
  ProductCategory,
  TaxRegime,
  WheelFinish,
  TireType,
  Seller
} from '../types';
import { storageService } from '../services/storageService';
import { catalogService } from '../services/catalogService';
import { catalogRepository } from '../services/catalogRepository';
import {
  listProducts,
  saveProducts as saveProductsRemote,
  getSiteSettings as getSiteSettingsRemote,
  saveSiteSettings as saveSiteSettingsRemote,
  listSellers,
  addSeller as addSellerRemote,
  updateSeller as updateSellerRemote,
  deleteSeller as deleteSellerRemote,
  toggleSellerStatus as toggleSellerStatusRemote,
  listInquiries,
  updateInquiryStatus as updateInquiryStatusRemote,
  listCpfClients,
  listB2BAccounts,
  listAdminUsers
} from '../services/dataService';
import { listaParaExibicao } from '../utils/produtoAdapter';
import { ProductPhotoManager } from './ProductPhotoManager';
import { ProdutoCatalogo } from '../types/catalog';
import { formatCNPJ, formatCPF } from '../utils/validation';

function productParaProdutoCatalogo(p: Product): ProdutoCatalogo {
  const catSlug = (p.category || 'rodas').toLowerCase();
  return {
    codigo: p.sku || p.id,
    descricao: p.name,
    descricaoDetalhada: p.description || p.name,
    referencia: p.brand || p.sku || 'Paris Dakar',
    tipoProduto: p.subcategory || p.category || 'Rodas',
    categoriaSlug: catSlug,
    grupo: catSlug as any,
    unidade: p.unidadeSigla || 'UN',
    unidadeLabel: p.unidadeLabel || 'unidades',
    quantidade: p.stockQuantity ?? (p.inStock ? 10 : 0),
    valorVenda: p.price,
    ativoManual: p.isActive !== false,
    ativo: p.isActive !== false && (p.stockQuantity ?? 10) > 0,
    fichaTecnica: {
      aro: p.specs?.aro ?? null,
      furacao: p.specs?.furacao ?? null,
      offset: p.specs?.offset ?? null,
      tala: p.specs?.tala ?? null,
      acabamento: p.specs?.acabamento ?? null,
      medidaPneu: p.specs?.medidaPneu ?? null,
      tipoPneu: p.specs?.tipoPneu ?? null,
      garantia: p.specs?.garantia ?? null,
      peso: p.specs?.peso ?? null
    },
    marcasAtendidas: p.compatibleVehicles || [],
    modelosAtendidos: [],
    imagens: p.image ? [p.image, ...(p.secondaryImages || [])] : [],
    promocao: p.isPromocao === true,
    promoTipo: p.promoTipo,
    destaque: p.isDestaque === true,
    fichaCompleta: 100,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
}

interface AdminDashboardProps {
  adminUser: AdminUser;
  onExitAdmin: () => void;
  onProductsUpdated: (products: Product[]) => void;
  onSiteSettingsUpdated: (settings: SiteSettings) => void;
  onSellersUpdated?: (sellers: Seller[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onExitAdmin,
  onProductsUpdated,
  onSiteSettingsUpdated,
  onSellersUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'clients' | 'admins' | 'inquiries' | 'sellers'>('products');

  // Local state initialized from storageService
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(storageService.getSiteSettings());
  const [cpfClients, setCpfClients] = useState<CpfClient[]>(storageService.getCpfUsers());
  const [cnpjClients, setCnpjClients] = useState<B2BUser[]>(storageService.getCnpjUsers());
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(storageService.getAdminUsers());
  const [inquiries, setInquiries] = useState<InquiryLog[]>(storageService.getInquiries());
  const [sellers, setSellers] = useState<Seller[]>(storageService.getSellers());

  // Carrega os dados reais do Firestore assim que o painel abre. O estado inicial
  // acima é só o conteúdo local, usado enquanto a busca não termina (ou quando o
  // Firebase não está configurado neste ambiente).
  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const [produtos, configuracoes, vendedores, clientesCpf, contasB2b, orcamentos, admins] =
          await Promise.all([
            listProducts(),
            getSiteSettingsRemote(),
            listSellers(),
            listCpfClients(),
            listB2BAccounts(),
            listInquiries(),
            listAdminUsers(),
          ]);

        if (!ativo) return;
        setProducts(produtos);
        setSiteSettings(configuracoes);
        setSellers(vendedores);
        setCpfClients(clientesCpf);
        setCnpjClients(contasB2b);
        setInquiries(orcamentos);
        // A permissão real vive nos Custom Claims; se a coleção descritiva estiver
        // vazia, mostra ao menos o administrador que está logado agora.
        setAdminUsers(admins.length > 0 ? admins : [adminUser]);
      } catch (erro) {
        console.error('[Admin] Falha ao carregar os dados do Firestore:', erro);
      }
    };

    void carregar();
    return () => {
      ativo = false;
    };
  }, [adminUser]);

  // Sellers Management Form State
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerSpecialty, setSellerSpecialty] = useState('Consultor Técnico 4x4');
  const [sellerAvatarUrl, setSellerAvatarUrl] = useState('');
  const [sellerIsActive, setSellerIsActive] = useState(true);
  const [sellerSearch, setSellerSearch] = useState('');

  // Search & Filter state for products
  const [productSearch, setProductSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('todos');

  // Product Editing / Adding / Import State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newProdIsActive, setNewProdIsActive] = useState(true);
  const [newProdIsPromocao, setNewProdIsPromocao] = useState(false);
  const [newProdPromoTipo, setNewProdPromoTipo] = useState('');
  const [newProdIsDestaque, setNewProdIsDestaque] = useState(false);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('Paris Dakar Custom');
  const [newProdCat, setNewProdCat] = useState<ProductCategory>('rodas');
  const [newProdSubcat, setNewProdSubcat] = useState('Off-Road');
  const [newProdPrice, setNewProdPrice] = useState<number>(2500);
  const [newProdB2bPrice, setNewProdB2bPrice] = useState<number>(2000);
  const [newProdOrigPrice, setNewProdOrigPrice] = useState<number>(2800);
  const [newProdStock, setNewProdStock] = useState<number>(10);
  const [newProdInStock, setNewProdInStock] = useState(true);
  const [newProdBadge, setNewProdBadge] = useState('NOVIDADE 2026');
  const [newProdImages, setNewProdImages] = useState<string[]>([]);
  const [newProdDesc, setNewProdDesc] = useState('');

  // Product Specs Form State
  const [specAro, setSpecAro] = useState('17"');
  const [specFuracao, setSpecFuracao] = useState('6x139.7');
  const [specOffset, setSpecOffset] = useState('ET -12');
  const [specTala, setSpecTala] = useState('9.0"');
  const [specAcabamento, setSpecAcabamento] = useState('Preto Fosco');
  const [specMedidaPneu, setSpecMedidaPneu] = useState('285/70R17');
  const [specTipoPneu, setSpecTipoPneu] = useState<TireType>('MT');
  const [specGarantia, setSpecGarantia] = useState('3 Anos');
  const [specPeso, setSpecPeso] = useState('14.0 kg');
  const [specVehicles, setSpecVehicles] = useState('Toyota Hilux, Ford Ranger, Mitsubishi L200');

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Add Admin Form State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'senior' | 'admin'>('admin');
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  // Notification Banner
  const [toastMsg, setToastMsg] = useState('');

  // Sincronização em tempo real com o banco Firestore para o painel admin
  useEffect(() => {
    const cancelObs = catalogService.observarProdutos((produtosFirestore) => {
      const exibicao = listaParaExibicao(produtosFirestore);
      if (exibicao && exibicao.length > 0) {
        setProducts(exibicao);
        onProductsUpdated(exibicao);
      }
    }, { somenteAtivos: false });

    return () => cancelObs();
  }, [onProductsUpdated]);

  // Carrega os vendedores do Firestore ao abrir o painel admin
  useEffect(() => {
    storageService.fetchSellers().then((remoteSellers) => {
      if (remoteSellers && remoteSellers.length > 0) {
        setSellers(remoteSellers);
        if (onSellersUpdated) onSellersUpdated(remoteSellers);
      }
    });
  }, [onSellersUpdated]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // --- TOGGLE ACTIVE STATUS (EXPOSIÇÃO NO SITE EM TEMPO REAL) ---
  const handleToggleProductActive = async (id: string) => {
    const prod = products.find((p) => p.id === id || p.sku === id);
    if (prod) {
      const newStatus = prod.isActive === false ? true : false;
      try {
        await catalogService.definirAtivacao(prod.sku || prod.id, newStatus);
        const updated: Product = { ...prod, isActive: newStatus, inStock: newStatus && (prod.stockQuantity ?? 0) > 0 };
        storageService.saveProduct(updated);
        const nextProducts = products.map((p) => (p.id === id || p.sku === id ? updated : p));
        setProducts(nextProducts);
        onProductsUpdated(nextProducts);
        showToast(
          newStatus
            ? `✓ Produto "${prod.name}" ATIVADO no Firestore e exposto no site!`
            : `⚡ Produto "${prod.name}" DESATIVADO no Firestore (Ocultado do site público).`
        );
      } catch (err: any) {
        showToast(`Erro ao alterar status no banco: ${err.message}`);
      }
    }
  };

  // Carrega o catálogo da origem vigente (API ou local) ao abrir o painel.
  useEffect(() => {
    let cancelled = false;
    setCatalogBusy(true);

    catalogRepository
      .list()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch((error) => {
        if (!cancelled) showToast(`Falha ao carregar o catálogo: ${(error as Error).message}`);
      })
      .finally(() => {
        if (!cancelled) setCatalogBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // --- SPREADSHEET IMPORT HANDLERS (EXCEL / CSV) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // A biblioteca de planilhas (~400 kB) só é baixada na hora de importar.
        const XLSX = await import('xlsx');

        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          showToast('A planilha enviada está vazia.');
          return;
        }

        let createdCount = 0;
        let updatedCount = 0;
        let currentProducts = [...products];

        for (let idx = 0; idx < rawRows.length; idx++) {
          const row = rawRows[idx];
          const normRow: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
            if (cleanKey.includes('sku') || cleanKey.includes('cod')) normRow['sku'] = String(row[key]).trim();
            else if (cleanKey.includes('nome') || cleanKey.includes('produto') || cleanKey.includes('desc')) normRow['name'] = String(row[key]).trim();
            else if (cleanKey.includes('categoria') || cleanKey.includes('tipo')) normRow['category'] = String(row[key]).trim().toLowerCase();
            else if (cleanKey.includes('marca') || cleanKey.includes('fabricante')) normRow['brand'] = String(row[key]).trim();
            else if (cleanKey.includes('preco_b2c') || cleanKey === 'preco' || cleanKey === 'valor') normRow['price'] = Number(row[key]) || 0;
            else if (cleanKey.includes('b2b') || cleanKey.includes('atacado')) normRow['b2bPrice'] = Number(row[key]) || 0;
            else if (cleanKey.includes('estoque') || cleanKey.includes('qtd')) normRow['stockQuantity'] = Number(row[key]) || 0;
            else if (cleanKey.includes('aro')) normRow['aro'] = String(row[key]).trim();
            else if (cleanKey.includes('furacao')) normRow['furacao'] = String(row[key]).trim();
            else if (cleanKey.includes('offset')) normRow['offset'] = String(row[key]).trim();
            else if (cleanKey.includes('tala')) normRow['tala'] = String(row[key]).trim();
            else if (cleanKey.includes('pneu')) normRow['medidaPneu'] = String(row[key]).trim();
          });

          const sku = normRow['sku'] || `PD-IMP-${Date.now()}-${idx}`;
          const existingIdx = currentProducts.findIndex((p) => p.sku.toLowerCase() === sku.toLowerCase());

          let productToSave: Product;

          if (existingIdx >= 0) {
            const existing = currentProducts[existingIdx];
            productToSave = {
              ...existing,
              name: normRow['name'] || existing.name,
              brand: normRow['brand'] || existing.brand,
              price: normRow['price'] > 0 ? normRow['price'] : existing.price,
              b2bPrice: normRow['b2bPrice'] > 0 ? normRow['b2bPrice'] : existing.b2bPrice,
              stockQuantity: normRow['stockQuantity'] >= 0 ? normRow['stockQuantity'] : existing.stockQuantity,
              inStock: (normRow['stockQuantity'] ?? existing.stockQuantity) > 0,
              isActive: true,
              specs: {
                ...existing.specs,
                aro: normRow['aro'] || existing.specs.aro,
                furacao: normRow['furacao'] || existing.specs.furacao,
                offset: normRow['offset'] || existing.specs.offset,
                tala: normRow['tala'] || existing.specs.tala,
                medidaPneu: normRow['medidaPneu'] || existing.specs.medidaPneu
              }
            };
            currentProducts[existingIdx] = productToSave;
            updatedCount++;
          } else {
            const validCats = ['rodas', 'pneus', 'kits-lift', 'acessorios', 'combos'];
            const cat = (validCats.includes(normRow['category']) ? normRow['category'] : 'rodas') as ProductCategory;

            productToSave = {
              id: `pd-imp-${Date.now()}-${idx}`,
              sku,
              name: normRow['name'] || `Produto Importado ${sku}`,
              brand: normRow['brand'] || 'Paris Dakar Custom',
              category: cat,
              subcategory: 'Importado via Planilha',
              price: normRow['price'] || 2000,
              b2bPrice: normRow['b2bPrice'] || 1600,
              stockQuantity: normRow['stockQuantity'] || 10,
              inStock: (normRow['stockQuantity'] || 10) > 0,
              isActive: true,
              badge: 'PLANILHA 2026',
              image: '',
              description: 'Produto cadastrado via importação de planilha.',
              specs: {
                aro: normRow['aro'] || '17"',
                furacao: normRow['furacao'] || '6x139.7',
                offset: normRow['offset'] || 'ET -12',
                tala: normRow['tala'] || '9.0"',
                medidaPneu: normRow['medidaPneu'] || '285/70R17'
              },
              compatibleVehicles: ['Toyota Hilux', 'Ford Ranger', 'Mitsubishi L200'],
              rating: 5.0,
              reviewsCount: 1
            };
            currentProducts.unshift(productToSave);
            createdCount++;
          }

          try {
            await catalogService.salvarProduto(productParaProdutoCatalogo(productToSave));
          } catch (dbErr) {
            console.warn('[Import] Erro ao gravar item no Firestore:', dbErr);
          }
        }

        await saveProductsRemote(currentProducts);
        setProducts(currentProducts);
        onProductsUpdated(currentProducts);
        setIsImportModalOpen(false);
        showToast(`Planilha importada com sucesso no Firestore! ${createdCount} novos, ${updatedCount} atualizados.`);
      } catch (err: any) {
        alert('Erro ao processar arquivo da planilha: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const csvHeader = "SKU;Nome;Marca;Categoria;Preco_B2C;Preco_B2B;Estoque;Aro;Furacao;Offset;Tala;Medida_Pneu\n";
    const sampleRow1 = "PD-DAKAR-1790-6139;Roda Forged Dakar Heavy-Duty 17x9;Paris Dakar;rodas;2850;2280;12;17\";6x139.7;ET -12;9.0\";\n";
    const sampleRow2 = "PD-MAX-35125-17;Pneu Dakar Mud-Terrain Extreme 35x12.5R17;Paris Dakar;pneus;1950;1560;20;17\";;;;35x12.5R17\n";
    
    const blob = new Blob([csvHeader + sampleRow1 + sampleRow2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_importacao_planilha_paris_dakar.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CATALOG MANAGEMENT HANDLERS ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProdId = newProdSku || `PD-${Date.now()}`;
    const newProd: Product = {
      id: newProdId,
      sku: newProdSku || newProdId,
      name: newProdName,
      brand: newProdBrand,
      category: newProdCat,
      subcategory: newProdSubcat,
      price: Number(newProdPrice),
      b2bPrice: Number(newProdB2bPrice),
      originalPrice: Number(newProdOrigPrice),
      isWholesaleOnly: false,
      badge: newProdBadge,
      image: newProdImages[0] || '',
      secondaryImages: newProdImages.slice(1),
      description: newProdDesc || 'Produto de alta performance Paris Dakar Off-Road.',
      specs: {
        aro: specAro,
        furacao: specFuracao,
        offset: specOffset,
        tala: specTala,
        acabamento: specAcabamento,
        medidaPneu: specMedidaPneu,
        tipoPneu: specTipoPneu,
        garantia: specGarantia,
        peso: specPeso
      },
      compatibleVehicles: specVehicles.split(',').map((v) => v.trim()),
      inStock: newProdInStock,
      stockQuantity: Number(newProdStock),
      isActive: newProdIsActive,
      isPromocao: newProdIsPromocao,
      promoTipo: newProdIsPromocao ? newProdPromoTipo.trim() || undefined : undefined,
      isDestaque: newProdIsDestaque,
      rating: 5.0,
      reviewsCount: 1
    };

    try {
      await catalogService.salvarProduto(productParaProdutoCatalogo(newProd));
      storageService.saveProduct(newProd);
      const nextProducts = [newProd, ...products];
      setProducts(nextProducts);
      onProductsUpdated(nextProducts);
      setIsAddProductModalOpen(false);
      setNewProdImages([]);
      setNewProdIsPromocao(false);
      setNewProdPromoTipo('');
      setNewProdIsDestaque(false);
      showToast('Novo produto salvo no Firestore e exposto no site!');
    } catch (err: any) {
      showToast(`Erro ao salvar no Firestore: ${err.message}`);
    }
  };

  const handleUpdateProduct = async (prod: Product) => {
    try {
      await catalogService.salvarProduto(productParaProdutoCatalogo(prod));
      storageService.saveProduct(prod);
      const nextProducts = products.map((p) => (p.id === prod.id || p.sku === prod.sku ? prod : p));
      setProducts(nextProducts);
      onProductsUpdated(nextProducts);
      setEditingProduct(null);
      showToast('Produto atualizado com sucesso no Firestore!');
    } catch (err: any) {
      showToast(`Erro ao atualizar produto no Firestore: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto do catálogo do site?')) {
      try {
        const prod = products.find((p) => p.id === id || p.sku === id);
        const codeToDelete = prod?.sku || id;
        await catalogService.excluirProduto(codeToDelete);
        storageService.deleteProduct(id);
        const nextProducts = products.filter((p) => p.id !== id && p.sku !== id);
        setProducts(nextProducts);
        onProductsUpdated(nextProducts);
        showToast('Produto removido do catálogo Firestore.');
      } catch (err: any) {
        showToast(`Erro ao excluir produto no Firestore: ${err.message}`);
      }
    }
  };

  // Quick inline price / stock update
  const handleQuickPriceUpdate = (id: string, newPrice: number, newStock: number) => {
    const prod = products.find((p) => p.id === id);
    if (prod) {
      const updated = { ...prod, price: newPrice, stockQuantity: newStock, inStock: newStock > 0 };
      handleUpdateProduct(updated);
    }
  };

  // --- SITE SETTINGS HANDLERS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSiteSettingsRemote(settingsForm);
    setSiteSettings(settingsForm);
    onSiteSettingsUpdated(settingsForm);
    setSettingsSavedMsg('Configurações alteradas e salvas no banco do site!');
    setTimeout(() => setSettingsSavedMsg(''), 3000);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail) return;

    const emailClean = newAdminEmail.trim().toLowerCase();
    const newAdmin = storageService.addAdminUser({
      name: newAdminName,
      email: emailClean,
      role: newAdminRole,
      grantedBySenior: true
    });

    setAdminUsers((prev) => [...prev.filter((a) => a.email.toLowerCase() !== emailClean), newAdmin]);
    setAdminSuccessMsg(
      `✓ Administrador "${newAdminName}" (${emailClean}) cadastrado com permissão (${newAdminRole === 'senior' ? 'Sênior Master' : 'Administrador Operacional'})! Ao efetuar login no site com este e-mail, o painel administrativo será aberto automaticamente.`
    );
    setNewAdminName('');
    setNewAdminEmail('');
    setTimeout(() => setAdminSuccessMsg(''), 10000);
  };

  // --- INQUIRIES LOG HANDLERS ---
  const handleInquiryStatusChange = async (id: string, newStatus: 'Novo' | 'Em Atendimento' | 'Concluído') => {
    const updated = await updateInquiryStatusRemote(id, newStatus, inquiries);
    setInquiries(updated);
    showToast('Status da cotação atualizado!');
  };

  // --- SELLERS HANDLERS ---
  const handleOpenAddSeller = () => {
    setEditingSeller(null);
    setSellerName('');
    setSellerPhone('');
    setSellerEmail('');
    setSellerSpecialty('Consultor Técnico 4x4 & Rodas Heavy-Duty');
    setSellerAvatarUrl('');
    setSellerIsActive(true);
    setIsSellerModalOpen(true);
  };

  const handleOpenEditSeller = (seller: Seller) => {
    setEditingSeller(seller);
    setSellerName(seller.name);
    setSellerPhone(seller.phone);
    setSellerEmail(seller.email || '');
    setSellerSpecialty(seller.specialty || '');
    setSellerAvatarUrl(seller.avatarUrl || '');
    setSellerIsActive(seller.isActive);
    setIsSellerModalOpen(true);
  };

  const handleSaveSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerName || !sellerPhone) {
      showToast('Preencha o Nome e WhatsApp do vendedor.');
      return;
    }

    let updatedSellers: Seller[];
    if (editingSeller) {
      const updated: Seller = {
        ...editingSeller,
        name: sellerName,
        phone: sellerPhone,
        email: sellerEmail,
        specialty: sellerSpecialty,
        avatarUrl: sellerAvatarUrl,
        isActive: sellerIsActive
      };
      updatedSellers = await updateSellerRemote(updated, sellers);
      showToast(`Vendedor ${sellerName} atualizado com sucesso!`);
    } else {
      updatedSellers = await addSellerRemote(
        {
          name: sellerName,
          phone: sellerPhone,
          email: sellerEmail,
          specialty: sellerSpecialty,
          avatarUrl: sellerAvatarUrl,
          isActive: sellerIsActive
        },
        sellers
      );
      showToast(`Vendedor ${sellerName} cadastrado com sucesso!`);
    }

    setSellers(updatedSellers);
    if (onSellersUpdated) onSellersUpdated(updatedSellers);
    setIsSellerModalOpen(false);
  };

  const handleToggleSellerStatus = async (id: string) => {
    const updatedSellers = await toggleSellerStatusRemote(id, sellers);
    setSellers(updatedSellers);
    if (onSellersUpdated) onSellersUpdated(updatedSellers);
    showToast('Status do vendedor alterado!');
  };

  const handleDeleteSeller = async (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover o vendedor ${name}?`)) {
      const updatedSellers = await deleteSellerRemote(id, sellers);
      setSellers(updatedSellers);
      if (onSellersUpdated) onSellersUpdated(updatedSellers);
      showToast(`Vendedor ${name} removido.`);
    }
  };


  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = selectedCatFilter === 'todos' || p.category === selectedCatFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen pd-page pd-text flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className="fixed top-4 right-4 left-4 sm:left-auto sm:top-5 sm:right-5 z-50 bg-[#8B0000] text-white px-4 sm:px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce"
          style={{ marginTop: 'var(--safe-top)' }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 pd-bg-alt border-b border-[#8B0000]/50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#8B0000] text-white rounded flex items-center justify-center font-black italic text-sm shadow-md border border-[#8B0000]/60">
            PD
          </div>
          <div>
            <h1 className="text-base font-black uppercase italic tracking-wider pd-text flex items-center gap-2">
              <span>Painel de Administração do Site</span>
              <span className="bg-[#8B0000] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                {adminUser.role === 'senior' ? 'SÊNIOR MASTER' : 'ADMINISTRADOR'}
              </span>
            </h1>
            <p className="text-[11px] pd-text-2">
              Usuário Logado: <span className="pd-gold-text font-bold">{adminUser.name}</span> ({adminUser.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xs:w-auto">
          <button
            onClick={onExitAdmin}
            className="flex items-center gap-2 px-4 py-2 pd-surface pd-row-hover border pd-border pd-text-2 text-xs font-bold uppercase tracking-wider rounded transition"
          >
            <ArrowLeft className="w-4 h-4 pd-brand-text" />
            <span>Voltar para o Site</span>
          </button>
          <button
            onClick={() => {
              storageService.clearUserSession();
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-800/60 pd-brand-text text-xs font-bold uppercase tracking-wider rounded transition"
            title="Encerrar sessão administrativa"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 xs:p-4 sm:p-6 lg:p-8 space-y-6">

        {/* KPI Analytics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="pd-surface p-4 rounded-xl border pd-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block">Total Produtos</span>
            <div className="text-xl font-black italic pd-text flex items-center justify-between">
              <span>{products.length}</span>
              <Package className="w-5 h-5 pd-brand-text" />
            </div>
          </div>

          <div className="pd-surface p-4 rounded-xl border pd-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block">Clientes Lojistas (CNPJ)</span>
            <div className="text-xl font-black italic pd-gold-text flex items-center justify-between">
              <span>{cnpjClients.length}</span>
              <Building2 className="w-5 h-5 pd-gold-text" />
            </div>
          </div>

          <div className="pd-surface p-4 rounded-xl border pd-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block">Clientes Finais (CPF)</span>
            <div className="text-xl font-black italic pd-info-text flex items-center justify-between">
              <span>{cpfClients.length}</span>
              <User className="w-5 h-5 pd-info-text" />
            </div>
          </div>

          <div className="pd-surface p-4 rounded-xl border pd-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block">Cotações / Leads</span>
            <div className="text-xl font-black italic pd-success-text flex items-center justify-between">
              <span>{inquiries.length}</span>
              <FileSpreadsheet className="w-5 h-5 pd-success-text" />
            </div>
          </div>

          <div className="pd-surface p-4 rounded-xl border pd-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block">Administradores</span>
            <div className="text-xl font-black italic pd-brand-text flex items-center justify-between">
              <span>{adminUsers.length}</span>
              <ShieldCheck className="w-5 h-5 pd-brand-text" />
            </div>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex flex-wrap gap-2 border-b pd-border pb-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-[#8B0000] text-white shadow-md'
                : 'pd-surface pd-text-2 border pd-border'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>1. Catálogo & Estoque ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-[#8B0000] text-white shadow-md'
                : 'pd-surface pd-text-2 border pd-border'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>2. Configurações do Site</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'bg-[#8B0000] text-white shadow-md'
                : 'pd-surface pd-text-2 border pd-border'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Clientes (CPF / CNPJ)</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'bg-[#8B0000] text-white shadow-md'
                : 'pd-surface pd-text-2 border pd-border'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>4. Cotações & Leads</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'admins'
                ? 'bg-[#8B0000] text-white shadow-md'
                : 'pd-surface pd-text-2 border pd-border'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>5. Administradores</span>
          </button>

          <button
            onClick={() => setActiveTab('sellers')}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2.5 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'sellers'
                ? 'bg-[#8B0000] text-white shadow-md'
                : 'pd-surface pd-text-2 border pd-border'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>6. Equipe de Vendedores</span>
          </button>
        </div>

        {/* TAB 1: CATALOG PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Action & Filter Toolbar */}
            <div className="pd-surface p-4 rounded-xl border pd-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 pd-text-2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar por nome, SKU, marca..."
                    className="w-full pl-9 pr-4 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="px-3 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none"
                >
                  <option value="todos">Todas Categorias</option>
                  <option value="rodas">Rodas</option>
                  <option value="pneus">Pneus</option>
                  <option value="kits-lift">Kits de Lift</option>
                  <option value="acessorios">Acessórios</option>
                  <option value="combos">Combos</option>
                </select>
              </div>

              <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-2.5 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2.5 rounded font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg shrink-0 justify-center"
                  title="Importar catálogo em lote via planilha Excel ou CSV"
                >
                  <FileSpreadsheet className="w-4 h-4 pd-success-text" />
                  <span>Importar Planilha (Excel/CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="bg-[#8B0000] hover:bg-red-800 text-white px-4 py-2.5 rounded font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg shrink-0 justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Novo Produto</span>
                </button>
              </div>
            </div>

            {/* Products Data Table */}
            <div className="pd-surface rounded-xl border pd-border overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="pd-bg-alt border-b pd-border pd-text-2 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Imagem & Nome</th>
                      <th className="p-3">SKU / Categoria</th>
                      <th className="p-3">Preço B2C</th>
                      <th className="p-3">Preço B2B (Atacado)</th>
                      <th className="p-3">Estoque</th>
                      <th className="p-3 text-center">Exposição no Site</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className={`transition ${p.isActive === false ? 'opacity-50 bg-red-950/10' : 'pd-row-hover'}`}>
                        <td className="p-3 flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded pd-surface-2 shrink-0 border pd-border" />
                          <div>
                            <span className="font-bold pd-text uppercase italic block">{p.name}</span>
                            <span className="text-[10px] pd-brand-text font-bold block uppercase">{p.brand}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-mono pd-text-2 block">{p.sku}</span>
                          <span className="text-[10px] pd-text-3 uppercase">{p.category} // {p.subcategory}</span>
                        </td>

                        <td className="p-3 font-bold font-mono pd-success-text">
                          R$ {p.price.toLocaleString('pt-BR')}
                        </td>

                        <td className="p-3 font-bold font-mono pd-gold-text">
                          R$ {(p.b2bPrice || p.price * 0.8).toLocaleString('pt-BR')}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={p.stockQuantity}
                              onChange={(e) => handleQuickPriceUpdate(p.id, p.price, Number(e.target.value))}
                              className="w-16 px-2 py-1 rounded pd-surface-2 border pd-border text-center text-xs pd-text font-mono"
                            />
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              p.inStock ? 'bg-emerald-950 pd-success-text border border-emerald-800' : 'bg-red-950 pd-brand-text border border-red-800'
                            }`}>
                              {p.inStock ? 'EM ESTOQUE' : 'ESGOTADO'}
                            </span>
                          </div>
                        </td>

                        {/* BOTÃO ATIVAR / DESATIVAR EXPOSIÇÃO DO PRODUTO NO SITE */}
                        <td className="p-3 text-center">
                          {p.isActive !== false ? (
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-950/90 pd-success-text border border-emerald-700 text-[10px] font-black uppercase inline-flex items-center gap-1.5 hover:bg-emerald-900 transition shadow-sm"
                              title="Clique para DESATIVAR e ocultar este produto do site público"
                            >
                              <Eye className="w-3.5 h-3.5 pd-success-text" />
                              <span>Ativo no Site</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-950/90 pd-brand-text border border-red-700 text-[10px] font-black uppercase inline-flex items-center gap-1.5 hover:bg-red-900 transition shadow-sm"
                              title="Clique para ATIVAR e expor este produto no site público"
                            >
                              <EyeOff className="w-3.5 h-3.5 pd-brand-text" />
                              <span>Oculto (Desativado)</span>
                            </button>
                          )}
                        </td>

                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-2 rounded pd-surface-2 pd-row-hover pd-text-2 transition"
                            title="Editar especificações"
                          >
                            <Edit className="w-4 h-4 pd-gold-text" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 rounded bg-red-950/60 hover:bg-red-900 pd-brand-text transition"
                            title="Remover produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: SITE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="pd-surface p-6 rounded-xl border pd-border space-y-6 max-w-3xl mx-auto">
            <div className="border-b pd-border pb-4">
              <h2 className="text-base font-black uppercase italic tracking-wider pd-text flex items-center gap-2">
                <Settings className="w-5 h-5 pd-brand-text" />
                <span>Configurações do Site e Comunicação</span>
              </h2>
              <p className="text-xs pd-text-2">
                Altere em tempo real os textos institucionais, banners superiores e números de contato oficiais.
              </p>
            </div>

            {settingsSavedMsg && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 pd-success-text text-xs font-bold rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{settingsSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                  Texto do Banner Superior Anúncio (Barra de Notificações)
                </label>
                <input
                  type="text"
                  value={settingsForm.announcementText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                    Título Principal do Hero (Visualizador 3D)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                    Subtítulo do Hero
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroSubtitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                    Número WhatsApp Oficial (Apenas números com DDD)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    placeholder="5511999998888"
                    className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                    Telefone Fixo Showroom
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                  Endereço do Centro de Distribuição / Showroom
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              {/* SEÇÃO DE IMAGENS DO SITE */}
              <div className="border-t pd-border pt-5 space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest pd-brand-text flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  Imagens do Site
                </h3>

                {/* Logo */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1.5">
                    Logo / Marca (exibida no cabeçalho)
                  </label>
                  <div className="flex items-center gap-3">
                    {settingsForm.logoUrl && (
                      <img
                        src={settingsForm.logoUrl}
                        alt="Logo"
                        className="h-12 w-auto object-contain rounded border pd-border pd-surface-2 p-1"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <label
                      htmlFor="upload-logo"
                      className="flex items-center gap-2 px-3 py-2 pd-surface-2 border pd-border rounded cursor-pointer hover:border-[#8B0000] transition text-xs font-bold pd-text-2"
                    >
                      <Upload className="w-3.5 h-3.5 pd-brand-text" />
                      Enviar Logo
                      <input
                        id="upload-logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => setSettingsForm({ ...settingsForm, logoUrl: ev.target?.result as string });
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {settingsForm.logoUrl && (
                      <button type="button" onClick={() => setSettingsForm({ ...settingsForm, logoUrl: '' })} className="text-[10px] pd-brand-text font-bold hover:underline flex items-center gap-1">
                        <X className="w-3 h-3" /> Remover
                      </button>
                    )}
                  </div>
                </div>

                {/* Hero / Banner Background */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1.5">
                    Imagem de Fundo do Hero / Banner Principal
                  </label>
                  <div className="space-y-2">
                    {settingsForm.heroImageUrl && (
                      <div className="relative h-28 rounded-lg overflow-hidden border pd-border">
                        <img src={settingsForm.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setSettingsForm({ ...settingsForm, heroImageUrl: '' })} className="absolute top-2 right-2 w-6 h-6 bg-red-900/80 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <label htmlFor="upload-hero" className="flex items-center justify-center gap-2 px-3 py-2 pd-surface-2 border pd-border rounded cursor-pointer hover:border-[#8B0000] transition text-xs font-bold pd-text-2">
                        <Upload className="w-3.5 h-3.5 pd-brand-text" />
                        Do Computador
                        <input id="upload-hero" type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => setSettingsForm({ ...settingsForm, heroImageUrl: ev.target?.result as string });
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      <label htmlFor="upload-hero-cam" className="flex items-center justify-center gap-2 px-3 py-2 pd-surface-2 border pd-border rounded cursor-pointer hover:border-[#8B0000] transition text-xs font-bold pd-text-2">
                        <RefreshCw className="w-3.5 h-3.5 pd-brand-text" />
                        Câmera / Celular
                        <input id="upload-hero-cam" type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => setSettingsForm({ ...settingsForm, heroImageUrl: ev.target?.result as string });
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                    <input type="text" value={settingsForm.heroImageUrl || ''} onChange={(e) => setSettingsForm({ ...settingsForm, heroImageUrl: e.target.value })} placeholder="Ou cole uma URL de imagem..." className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text text-[11px]" />
                  </div>
                </div>

                {/* Texto do Banner */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1.5">
                    Texto Personalizado do Banner / Hero
                  </label>
                  <textarea
                    value={settingsForm.bannerText || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bannerText: e.target.value })}
                    rows={2}
                    placeholder="Ex: Promoção especial de aniversário! Descontos imperdíveis em rodas e pneus."
                    className="w-full px-3.5 py-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000] resize-none"
                  />
                </div>
              </div>

              {/* SEÇÃO DE GERENCIAMENTO DE CATEGORIAS */}
              <div className="border-t pd-border pt-5 space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest pd-brand-text flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  Gerenciar Categorias do Site
                </h3>
                <p className="text-[10px] pd-text-2 leading-relaxed">
                  Desative categorias inteiras para ocultar <strong>todos</strong> os produtos daquela categoria da loja pública.
                  Os produtos não serão excluídos — apenas ficam invisíveis para os visitantes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {([
                    { slug: 'rodas', label: 'Rodas Off-Road', icon: '🛞', desc: 'Rodas forjadas e calotas' },
                    { slug: 'pneus', label: 'Pneus MT / AT / LT', icon: '🔧', desc: 'Pneus Mud, All-Terrain e Light Truck' },
                    { slug: 'kits-lift', label: 'Kits de Lift', icon: '⬆️', desc: 'Kits de suspensão e elevação' },
                    { slug: 'combos', label: 'Combos Prontos', icon: '📦', desc: 'Pacotes roda + pneu montados' },
                    { slug: 'acessorios', label: 'Acessórios', icon: '🔩', desc: 'Peças, fixação, iluminação e outros' },
                    { slug: 'promocao', label: '🔥 Promoção', icon: '🔥', desc: 'Produtos em promoção ativa' }
                  ] as const).map((cat) => {
                    const disabled = (settingsForm.disabledCategories || []).includes(cat.slug);
                    const catProducts = cat.slug === 'promocao'
                      ? products.filter((p) => p.isPromocao)
                      : cat.slug === 'acessorios'
                        ? products.filter((p) => !['rodas', 'pneus', 'kits-lift', 'combos'].includes(p.category))
                        : products.filter((p) => p.category === cat.slug);
                    const count = catProducts.length;

                    return (
                      <div
                        key={cat.slug}
                        className={`relative rounded-lg border p-3.5 transition-all ${
                          disabled
                            ? 'border-red-800/50 bg-red-950/20 opacity-70'
                            : 'pd-border pd-surface-2'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base" aria-hidden="true">{cat.icon}</span>
                            <div>
                              <p className={`text-[11px] font-black uppercase tracking-wider ${disabled ? 'line-through pd-text-3' : 'pd-text'}`}>
                                {cat.label}
                              </p>
                              <p className="text-[9px] pd-text-3">{cat.desc}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const current = settingsForm.disabledCategories || [];
                              const updated = disabled
                                ? current.filter((c) => c !== cat.slug)
                                : [...current, cat.slug];
                              setSettingsForm({ ...settingsForm, disabledCategories: updated });
                            }}
                            className="transition-colors shrink-0"
                            title={disabled ? `Reativar ${cat.label}` : `Desativar ${cat.label}`}
                          >
                            {disabled ? (
                              <ToggleLeft className="w-8 h-8 text-red-600" />
                            ) : (
                              <ToggleRight className="w-8 h-8 text-emerald-500" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold pd-text-2">
                            {count} {count === 1 ? 'produto' : 'produtos'}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            disabled
                              ? 'bg-red-900/60 text-red-300'
                              : 'bg-emerald-900/40 text-emerald-400'
                          }`}>
                            {disabled ? 'Desativada' : 'Ativa'}
                          </span>
                        </div>

                        {disabled && (
                          <div className="mt-2 text-[9px] text-red-400 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Todos os {count} produtos estão ocultos no site</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(settingsForm.disabledCategories || []).length > 0 && (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded text-[10px] text-amber-300 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {(settingsForm.disabledCategories || []).length} {(settingsForm.disabledCategories || []).length === 1 ? 'categoria desativada' : 'categorias desativadas'} — os visitantes não verão esses produtos na loja.
                      Clique em "Salvar Alterações" para confirmar.
                    </span>
                  </div>
                )}
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

        {/* TAB 3: CLIENTS MANAGEMENT (CPF & CNPJ) */}
        {activeTab === 'clients' && (
          <div className="space-y-8">
            
            {/* B2B CNPJ Table */}
            <div className="pd-surface p-6 rounded-xl border pd-border space-y-4">
              <div className="flex items-center justify-between border-b pd-border pb-3">
                <h3 className="text-sm font-black uppercase italic pd-gold-text flex items-center gap-2">
                  <Building2 className="w-4 h-4 pd-gold-text" />
                  <span>Clientes Lojistas / Atacado B2B ({cnpjClients.length})</span>
                </h3>
                <span className="text-[10px] pd-text-2">Exigência de Regime Tributário e CNPJ Validados</span>
              </div>

              <div className="data-table-scroll">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="pd-bg-alt pd-text-2 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Empresa / Razão Social</th>
                      <th className="p-3">CNPJ (Numérico / Alfanumérico)</th>
                      <th className="p-3">Regime Tributário</th>
                      <th className="p-3">Inscrição Estadual</th>
                      <th className="p-3">Contato & E-mail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cnpjClients.map((c, i) => (
                      <tr key={i} className="pd-row-hover">
                        <td className="p-3">
                          <strong className="pd-text block uppercase">{c.companyName}</strong>
                          <span className="text-[10px] pd-text-2 block">{c.tradeName}</span>
                        </td>
                        <td className="p-3 font-mono pd-gold-text font-bold">
                          {c.cnpj}
                        </td>
                        <td className="p-3">
                          <span className="bg-amber-950/60 pd-gold-text border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            {c.taxRegime}
                          </span>
                        </td>
                        <td className="p-3 font-mono pd-text-2">
                          {c.stateRegistration || 'Isento'}
                        </td>
                        <td className="p-3">
                          <span className="block pd-text-2">{c.phone}</span>
                          <span className="text-[10px] pd-text-3">{c.email}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B2C CPF Table */}
            <div className="pd-surface p-6 rounded-xl border pd-border space-y-4">
              <div className="flex items-center justify-between border-b pd-border pb-3">
                <h3 className="text-sm font-black uppercase italic pd-info-text flex items-center gap-2">
                  <User className="w-4 h-4 pd-info-text" />
                  <span>Clientes Finais CPF ({cpfClients.length})</span>
                </h3>
              </div>

              <div className="data-table-scroll">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="pd-bg-alt pd-text-2 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Nome Completo</th>
                      <th className="p-3">CPF</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Endereço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cpfClients.map((c, i) => (
                      <tr key={i} className="pd-row-hover">
                        <td className="p-3 font-bold pd-text uppercase">{c.fullName}</td>
                        <td className="p-3 font-mono pd-info-text">{c.cpf}</td>
                        <td className="p-3 pd-text-2">{c.phone}</td>
                        <td className="p-3 pd-text-2">{c.email}</td>
                        <td className="p-3 pd-text-2">{c.address}</td>
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
          <div className="pd-surface p-6 rounded-xl border pd-border space-y-4">
            <div className="flex items-center justify-between border-b pd-border pb-3">
              <h3 className="text-sm font-black uppercase italic pd-success-text flex items-center gap-2">
                <MessageCircle className="w-4 h-4 pd-success-text" />
                <span>Solicitações de Cotação & Atendimento ({inquiries.length})</span>
              </h3>
            </div>

            <div className="data-table-scroll">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="pd-bg-alt pd-text-2 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3">Cliente / Documento</th>
                    <th className="p-3">Produto Solicitado</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="pd-row-hover">
                      <td className="p-3">
                        <strong className="pd-text block uppercase">{inq.clientName}</strong>
                        <span className="text-[10px] pd-text-2 block">
                          [{inq.clientType}] {inq.clientDocument} • {inq.clientPhone}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="pd-gold-text font-bold block">{inq.productName}</span>
                        <span className="text-[10px] pd-text-3 font-mono">SKU: {inq.productSku}</span>
                      </td>

                      <td className="p-3 pd-text-2 font-mono">{inq.date}</td>

                      <td className="p-3">
                        <select
                          value={inq.status}
                          onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value as any)}
                          className="px-2 py-1 rounded pd-page border pd-border text-xs pd-text"
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
              <div className="flex items-center gap-2 pd-brand-text font-bold uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5 pd-brand-text" />
                <span>Controle de Permissão Master Senior</span>
              </div>
              <p className="pd-text-2">
                Apenas o Administrador Senior Master pode autorizar novos logins e conceder privilégios de edição total do catálogo.
              </p>
            </div>

            {/* List Current Admin Users */}
            <div className="pd-surface p-6 rounded-xl border pd-border space-y-4">
              <h3 className="text-sm font-black uppercase italic pd-text flex items-center gap-2">
                <Lock className="w-4 h-4 pd-brand-text" />
                <span>Administradores Autorizados</span>
              </h3>

              <div className="data-table-scroll">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="pd-bg-alt pd-text-2 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Nome do Administrador</th>
                      <th className="p-3">E-mail de Acesso</th>
                      <th className="p-3">Nível</th>
                      <th className="p-3">Autorizado Por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminUsers.map((a) => (
                      <tr key={a.id} className="pd-row-hover">
                        <td className="p-3 font-bold pd-text uppercase">{a.name}</td>
                        <td className="p-3 font-mono pd-text-2">{a.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.role === 'senior' ? 'bg-[#8B0000] text-white' : 'pd-surface-3 pd-text-2'
                          }`}>
                            {a.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 pd-success-text font-bold text-[10px] uppercase">
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
              <div className="pd-surface p-6 rounded-xl border pd-border space-y-4">
                <h3 className="text-xs font-black uppercase italic pd-gold-text flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Autorizar Novo Administrador</span>
                </h3>

                {adminSuccessMsg && (
                  <div className="p-3 bg-emerald-950 border border-emerald-800 pd-success-text text-xs font-bold rounded">
                    {adminSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Nome do Administrador
                    </label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Ex: Roberto Gerente Dakar"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      E-mail de Acesso
                    </label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="roberto@parisdakar.com.br"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest pd-text-2 block mb-1">
                      Nível de Permissão
                    </label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                    >
                      <option value="admin">Administrador Operacional</option>
                      <option value="senior">Sênior Master</option>
                    </select>
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

        {/* TAB 6: SELLERS MANAGEMENT */}
        {activeTab === 'sellers' && (
          <div className="space-y-6">
            {/* Action & Search Toolbar */}
            <div className="pd-surface p-4 rounded-xl border pd-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-3 pd-text-2" />
                <input
                  type="text"
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                  placeholder="Buscar por nome, telefone ou especialidade do vendedor..."
                  className="w-full pl-9 pr-4 py-2 rounded pd-surface-2 border pd-border text-xs pd-text focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <button
                onClick={handleOpenAddSeller}
                className="bg-[#8B0000] hover:bg-red-800 text-white px-5 py-2.5 rounded font-black text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-lg shrink-0 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Vendedor</span>
              </button>
            </div>

            {/* Sellers Data Table */}
            <div className="pd-surface rounded-xl border pd-border overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="pd-bg-alt border-b pd-border pd-text-2 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Vendedor</th>
                      <th className="p-3">WhatsApp / Telefone</th>
                      <th className="p-3">Especialidade / Cargo</th>
                      <th className="p-3">Email</th>
                      <th className="p-3 text-center">Status no Site</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sellers
                      .filter((s) =>
                        s.name.toLowerCase().includes(sellerSearch.toLowerCase()) ||
                        s.phone.includes(sellerSearch) ||
                        (s.specialty && s.specialty.toLowerCase().includes(sellerSearch.toLowerCase()))
                      )
                      .map((seller) => (
                        <tr key={seller.id} className="pd-row-hover transition">
                          <td className="p-3 flex items-center gap-3">
                            {seller.avatarUrl ? (
                              <img src={seller.avatarUrl} alt={seller.name} className="w-9 h-9 rounded-full object-cover border pd-border shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#8B0000] text-white font-black text-xs flex items-center justify-center shrink-0">
                                {seller.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold pd-text text-sm">{seller.name}</div>
                              <div className="text-[10px] pd-text-3">Desde: {seller.createdAt}</div>
                            </div>
                          </td>
                          <td className="p-3 font-mono pd-success-text font-bold">
                            {seller.phone}
                          </td>
                          <td className="p-3 pd-text-2">
                            {seller.specialty || 'Consultor Técnico Paris Dakar'}
                          </td>
                          <td className="p-3 pd-text-2">
                            {seller.email || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleSellerStatus(seller.id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                                seller.isActive
                                  ? 'bg-emerald-500/20 pd-success-text border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-red-500/20 pd-brand-text border border-red-500/40 hover:bg-red-500/30'
                              }`}
                            >
                              {seller.isActive ? 'Ativo no WhatsApp' : 'Inativo (Oculto)'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditSeller(seller)}
                                className="p-1.5 rounded pd-surface-2 pd-row-hover pd-text-2 transition"
                                title="Editar Vendedor"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSeller(seller.id, seller.name)}
                                className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 pd-brand-text transition"
                                title="Excluir Vendedor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>


      {/* ADD PRODUCT MODAL */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pd-overlay-bg overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-3xl pd-surface rounded-2xl border pd-border shadow-2xl my-4 sm:my-8 overflow-hidden pd-text p-4 sm:p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b pd-border pb-3">
              <h3 className="text-base font-black uppercase italic tracking-wider pd-text">
                Cadastrar Novo Produto no Catálogo
              </h3>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="p-2 rounded-full pd-surface-2 pd-text-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Ex: Roda Forged Dakar Heavy-Duty 17x9"
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">SKU Único *</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="PD-DAKAR-1790-6139"
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Categoria</label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                  >
                    <option value="rodas">Rodas</option>
                    <option value="pneus">Pneus</option>
                    <option value="kits-lift">Kits de Lift</option>
                    <option value="acessorios">Acessórios</option>
                    <option value="combos">Combos</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Subcategoria</label>
                  <input
                    type="text"
                    value={newProdSubcat}
                    onChange={(e) => setNewProdSubcat(e.target.value)}
                    placeholder="Forjada Caminhonete 4x4"
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Selo / Badge</label>
                  <input
                    type="text"
                    value={newProdBadge}
                    onChange={(e) => setNewProdBadge(e.target.value)}
                    placeholder="FORGED 4X4 HEAVY-DUTY"
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Preço B2C (R$)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase pd-gold-text block mb-1">Preço Atacado B2B (R$)</label>
                  <input
                    type="number"
                    value={newProdB2bPrice}
                    onChange={(e) => setNewProdB2bPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text font-mono"
                  />
                </div>
              </div>

              {/* Specs Grid */}
              <div className="p-3 pd-surface-2 rounded border pd-border space-y-2">
                <span className="text-[10px] font-bold uppercase pd-gold-text block">Tabela de Especificações Técnicas</span>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={specAro}
                    onChange={(e) => setSpecAro(e.target.value)}
                    placeholder='Aro (Ex: 17")'
                    className="px-2 py-1 pd-page border pd-border rounded pd-text text-[11px]"
                  />
                  <input
                    type="text"
                    value={specFuracao}
                    onChange={(e) => setSpecFuracao(e.target.value)}
                    placeholder="Furação (Ex: 6x139.7)"
                    className="px-2 py-1 pd-page border pd-border rounded pd-text text-[11px]"
                  />
                  <input
                    type="text"
                    value={specOffset}
                    onChange={(e) => setSpecOffset(e.target.value)}
                    placeholder="Offset (Ex: ET -12)"
                    className="px-2 py-1 pd-page border pd-border rounded pd-text text-[11px]"
                  />
                  <input
                    type="text"
                    value={specTala}
                    onChange={(e) => setSpecTala(e.target.value)}
                    placeholder='Tala (Ex: 9.0")'
                    className="px-2 py-1 pd-page border pd-border rounded pd-text text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Fotos Reais do Produto</label>
                <ProductPhotoManager
                  codigoProduto={newProdSku}
                  images={newProdImages}
                  onChange={setNewProdImages}
                />
              </div>


              <div>
                <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Veículos Compatíveis (Separados por vírgula)</label>
                <input
                  type="text"
                  value={specVehicles}
                  onChange={(e) => setSpecVehicles(e.target.value)}
                  placeholder="Toyota Hilux, Ford Ranger, Chevrolet S10"
                  className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                />
              </div>

              {/* FLAGS: PROMOÇÃO e DESTAQUE — novo produto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 pd-surface-2 rounded border pd-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold pd-text block">Promoção</span>
                    <span className="text-[10px] pd-text-2 block">Exibe na aba "Promoção"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProdIsPromocao((v) => !v)}
                    className={`px-3 py-1.5 rounded font-black text-xs uppercase flex items-center gap-1.5 transition ${
                      newProdIsPromocao ? 'bg-orange-950 text-orange-400 border border-orange-700' : 'pd-surface border pd-border pd-text-2'
                    }`}
                  >
                    <span>{newProdIsPromocao ? '🔥 PROMOÇÃO' : 'SEM PROMOÇÃO'}</span>
                  </button>
                </div>
                {newProdIsPromocao && (
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">
                      Tipo de Promoção <span className="normal-case font-normal">(digite livremente, ex: Dia dos Pais)</span>
                    </label>
                    <input
                      type="text"
                      value={newProdPromoTipo}
                      onChange={(e) => setNewProdPromoTipo(e.target.value)}
                      placeholder="Ex: Dia dos Pais"
                      className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                    />
                  </div>
                )}
                <div className="p-3 pd-surface-2 rounded border pd-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold pd-text block">Destaque</span>
                    <span className="text-[10px] pd-text-2 block">Carrossel na página principal</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProdIsDestaque((v) => !v)}
                    className={`px-3 py-1.5 rounded font-black text-xs uppercase flex items-center gap-1.5 transition ${
                      newProdIsDestaque ? 'bg-yellow-950 text-yellow-400 border border-yellow-700' : 'pd-surface border pd-border pd-text-2'
                    }`}
                  >
                    <span>{newProdIsDestaque ? '★ DESTAQUE' : 'SEM DESTAQUE'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 rounded pd-surface-2 pd-text-2 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#8B0000] hover:bg-red-800 text-white px-6 py-2 rounded font-black uppercase text-xs tracking-widest shadow-lg"
                >
                  Salvar Produto no Banco
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pd-overlay-bg overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-2xl pd-surface rounded-2xl border pd-border shadow-2xl my-4 sm:my-8 overflow-hidden pd-text p-4 sm:p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b pd-border pb-3">
              <h3 className="text-base font-black uppercase italic tracking-wider pd-text">
                Editar Produto: {editingProduct.name}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-full pd-surface-2 pd-text-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProduct(editingProduct);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Nome do Produto</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Preço Venda B2C (R$)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase pd-gold-text block mb-1">Preço Venda Atacado B2B (R$)</label>
                  <input
                    type="number"
                    value={editingProduct.b2bPrice || editingProduct.price * 0.8}
                    onChange={(e) => setEditingProduct({ ...editingProduct, b2bPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Quantidade em Estoque</label>
                  <input
                    type="number"
                    value={editingProduct.stockQuantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value), inStock: Number(e.target.value) > 0 })}
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">Fotos Reais do Produto</label>
                <ProductPhotoManager
                  codigoProduto={editingProduct.sku || editingProduct.id}
                  images={[editingProduct.image, ...(editingProduct.secondaryImages || [])].filter(Boolean)}
                  onChange={(images) =>
                    setEditingProduct({
                      ...editingProduct,
                      image: images[0] || '',
                      secondaryImages: images.slice(1)
                    })
                  }
                />
              </div>

              {/* TOGGLE PROMOÇÃO no edit modal */}
              <div className="p-3 pd-surface-2 rounded border pd-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold pd-text block">Promoção</span>
                  <span className="text-[10px] pd-text-2 block">Exibe na aba "Promoção" com badge especial</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, isPromocao: !editingProduct.isPromocao })}
                  className={`px-4 py-2 rounded font-black text-xs uppercase flex items-center gap-2 transition ${
                    editingProduct.isPromocao ? 'bg-orange-950 text-orange-400 border border-orange-700' : 'pd-surface-2 pd-text-2 border pd-border'
                  }`}
                >
                  <span>{editingProduct.isPromocao ? '★ EM PROMOÇÃO' : 'SEM PROMOÇÃO'}</span>
                </button>
              </div>

              {editingProduct.isPromocao && (
                <div>
                  <label className="text-[10px] font-bold uppercase pd-text-2 block mb-1">
                    Tipo de Promoção <span className="normal-case font-normal">(digite livremente, ex: Dia dos Pais)</span>
                  </label>
                  <input
                    type="text"
                    value={editingProduct.promoTipo || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, promoTipo: e.target.value })}
                    placeholder="Ex: Dia dos Pais"
                    className="w-full px-3 py-2 rounded pd-surface-2 border pd-border pd-text"
                  />
                </div>
              )}

              {/* TOGGLE DESTAQUE no edit modal */}
              <div className="p-3 pd-surface-2 rounded border pd-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold pd-text block">Destaque</span>
                  <span className="text-[10px] pd-text-2 block">Exibe no carrossel de destaques na página principal (máx. 4)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, isDestaque: !editingProduct.isDestaque })}
                  className={`px-4 py-2 rounded font-black text-xs uppercase flex items-center gap-2 transition ${
                    editingProduct.isDestaque ? 'bg-yellow-950 text-yellow-400 border border-yellow-700' : 'pd-surface-2 pd-text-2 border pd-border'
                  }`}
                >
                  <span>{editingProduct.isDestaque ? '★ DESTAQUE' : 'SEM DESTAQUE'}</span>
                </button>
              </div>

              {/* TOGGLE EXPOR NO SITE NO EDIT MODAL */}
              <div className="p-3 pd-surface-2 rounded border pd-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold pd-text block">Expor Produto no Site (Ativo / Visível)</span>
                  <span className="text-[10px] pd-text-2 block">Se desativado, o produto é mantido no banco mas ocultado do catálogo público</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, isActive: editingProduct.isActive === false ? true : false })}
                  className={`px-4 py-2 rounded font-black text-xs uppercase flex items-center gap-2 transition ${
                    editingProduct.isActive !== false ? 'bg-emerald-950 pd-success-text border border-emerald-700' : 'bg-red-950 pd-brand-text border border-red-700'
                  }`}
                >
                  {editingProduct.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{editingProduct.isActive !== false ? 'ATIVO NO SITE' : 'DESATIVADO'}</span>
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t pd-border">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded pd-surface-2 pd-text-2 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#8B0000] hover:bg-red-800 text-white px-6 py-2 rounded font-black uppercase text-xs tracking-widest"
                >
                  Salvar Edição
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* SPREADSHEET IMPORT MODAL (EXCEL / CSV) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pd-overlay-bg overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-xl pd-surface rounded-2xl border border-emerald-600/40 shadow-2xl my-4 sm:my-8 overflow-hidden pd-text p-4 sm:p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b pd-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-900/80 pd-success-text rounded flex items-center justify-center border border-emerald-600/50">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase italic tracking-wider pd-text">
                    Importação de Planilha (.XLSX / .CSV)
                  </h3>
                  <p className="text-[11px] pd-text-2">
                    Cadastre ou atualize milhares de produtos de uma só vez por SKU com Upsert inteligente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 rounded-full pd-surface-2 pd-text-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Card */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold pd-success-text uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  Instruções da Planilha
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 rounded text-[10px] font-black uppercase transition inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Baixar Planilha Modelo (.CSV)
                </button>
              </div>
              <p className="pd-text-2 text-[11px]">
                A planilha deve conter os cabeçalhos: <code className="pd-gold-text font-mono">SKU, Nome, Marca, Categoria, Preco_B2C, Preco_B2B, Estoque, Aro, Furacao, Offset, Tala, Medida_Pneu</code>.
              </p>
            </div>

            {/* File Input */}
            <div className="p-6 pd-surface-2 border-2 border-dashed border-emerald-600/40 rounded-xl text-center space-y-3">
              <FileSpreadsheet className="w-10 h-10 pd-success-text mx-auto animate-pulse" />
              <div>
                <label className="text-xs font-bold pd-text block mb-1">
                  Selecione seu arquivo .xlsx, .xls ou .csv
                </label>
                <span className="text-[10px] pd-text-2 block">
                  O sistema identificará produtos existentes pelo SKU e atualizará o estoque automaticamente.
                </span>
              </div>

              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="block w-full text-xs pd-text-2 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-3 border-t pd-border pt-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded pd-surface-2 pd-text-2 font-bold text-xs"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SELLER */}
      {isSellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pd-overlay-bg pd-anim-rise overflow-y-auto overscroll-contain">
          <div className="pd-surface border pd-border rounded-2xl w-full max-w-md my-4 sm:my-0 p-4 sm:p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b pd-border pb-3">
              <h3 className="text-base font-black pd-text uppercase tracking-wider flex items-center gap-2">
                <Headphones className="w-5 h-5 pd-brand-text" />
                <span>{editingSeller ? 'Editar Vendedor' : 'Cadastrar Novo Vendedor'}</span>
              </h3>
              <button
                onClick={() => setIsSellerModalOpen(false)}
                className="pd-text-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeller} className="space-y-4 text-xs">
              <div>
                <label className="block pd-text-2 font-bold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Ex: Rodrigo Lima"
                  className="w-full p-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <div>
                <label className="block pd-text-2 font-bold mb-1">WhatsApp / Telefone (Com DDD) *</label>
                <input
                  type="text"
                  required
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-8888 ou 5511999998888"
                  className="w-full p-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                />
                <p className="text-[10px] pd-text-3 mt-1">Este número será acionado ao cliente escolher o vendedor no WhatsApp.</p>
              </div>

              <div>
                <label className="block pd-text-2 font-bold mb-1">Especialidade / Cargo</label>
                <input
                  type="text"
                  value={sellerSpecialty}
                  onChange={(e) => setSellerSpecialty(e.target.value)}
                  placeholder="Ex: Consultor Técnico 4x4 & Rodas Heavy-Duty"
                  className="w-full p-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <div>
                <label className="block pd-text-2 font-bold mb-1">Email de Contato (Opcional)</label>
                <input
                  type="email"
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  placeholder="Ex: vendedor@parisdakar.com.br"
                  className="w-full p-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <div>
                <label className="block pd-text-2 font-bold mb-1">URL da Foto de Perfil (Opcional)</label>
                <input
                  type="url"
                  value={sellerAvatarUrl}
                  onChange={(e) => setSellerAvatarUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full p-2.5 rounded pd-surface-2 border pd-border pd-text focus:outline-none focus:border-[#8B0000]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sellerIsActive"
                  checked={sellerIsActive}
                  onChange={(e) => setSellerIsActive(e.target.checked)}
                  className="rounded pd-surface-2 pd-border pd-brand-text focus:ring-0"
                />
                <label htmlFor="sellerIsActive" className="pd-text-2 font-bold cursor-pointer">
                  Vendedor Ativo no WhatsApp (Aparecer como opção para os clientes)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t pd-border">
                <button
                  type="button"
                  onClick={() => setIsSellerModalOpen(false)}
                  className="px-4 py-2 rounded pd-surface-2 pd-row-hover pd-text-2 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#8B0000] hover:bg-red-800 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Vendedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
