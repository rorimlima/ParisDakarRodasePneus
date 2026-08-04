import type { GrupoCategoria } from './catalog';

export * from './catalog';

/**
 * Categoria de apresentação no site. Acompanha os grupos do catálogo Firestore
 * (`GrupoCategoria`) e mantém 'combos' para os conjuntos montados manualmente.
 */
export type ProductCategory = GrupoCategoria | 'combos';

export type TireType = 'MT' | 'AT' | 'LT' | 'HT';
export type WheelFinish = 'Preto Fosco' | 'Grafite Acetinado' | 'Bronze Off-Road' | 'Cromo Satinado' | 'Vermelho Dakar Accent';

export type TaxRegime = 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI (Microempreendedor Individual)';

export interface ProductSpecs {
  aro?: string; // e.g. "17\""
  furacao?: string; // e.g. "6x139.7"
  offset?: string; // e.g. "ET -12"
  tala?: string; // e.g. "9.0\""
  acabamento?: WheelFinish | string;
  medidaPneu?: string; // e.g. "285/70R17" or "35x12.5R17"
  tipoPneu?: TireType;
  indiceCarga?: string; // e.g. "121/118Q"
  alturaLift?: string; // e.g. "2.0 polegadas" (para kits de lift)
  garantia?: string; // e.g. "3 anos"
  peso?: string; // e.g. "14.5 kg"
}

export interface VehicleFitment {
  marca: string;
  modelo: string;
  anos: number[];
  furacaoPadrao: string;
  aroRecomendado: string;
}

/** Linha da ficha técnica renderizada no site, montada a partir do schema da categoria. */
export interface LinhaFichaTecnica {
  label: string;
  valor: string;
  destaque?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  isWholesaleOnly?: boolean; // Requer login B2B para ver preço
  b2bPrice?: number;
  badge?: string; // e.g., "FORGED 4X4", "NOVIDADE 2026", "TOP SALES"
  image: string;
  secondaryImages?: string[];
  description: string;
  specs: ProductSpecs;
  compatibleVehicles: string[]; // e.g. ["Toyota Hilux 2012-2026", "Ford Ranger 2013-2026"]
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewsCount: number;

  // --- vindos do catálogo Firestore ---
  /** Unidade de venda por extenso: "par", "jogo", "unidade"... */
  unidadeLabel?: string;
  /** Sigla original do ERP (UN, PR, JG, KT...). */
  unidadeSigla?: string;
  /** Ficha técnica completa, na ordem definida pela categoria. */
  fichaTecnicaCompleta?: LinhaFichaTecnica[];
  /** Nome da categoria de catálogo à qual o produto pertence. */
  categoriaNome?: string;
}

export interface VehicleSearchFilter {
  marca: string;
  modelo: string;
  ano: string;
  versao: string;
}

export interface SizeSearchFilter {
  category: ProductCategory | 'todos';
  aro: string;
  furacao: string;
  medidaPneu: string;
  tipoPneu: string;
}

// B2B CNPJ Client
export interface B2BUser {
  id?: string;
  isLoggedIn: boolean;
  companyName: string; // Razão Social
  tradeName?: string; // Nome Fantasia
  cnpj: string; // Suporta numérico e alfanumérico
  taxRegime: TaxRegime; // Exigência de regime tributário
  stateRegistration?: string; // Inscrição Estadual (IE)
  phone: string;
  email: string;
  address?: string;
  discountPercentage?: number;
  createdAt?: string;
}

// B2C CPF Client
export interface CpfClient {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  address: string;
  cep: string;
  createdAt: string;
}

// Admin User
/**
 * `senior`   — controle total, concede papéis.
 * `gerencia` — opera o catálogo e enxerga ValorReposicao/margem.
 * `admin`    — opera o catálogo sem acesso a custo.
 */
export type AdminRole = 'senior' | 'gerencia' | 'admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  grantedBySenior: boolean;
  createdAt: string;
}

// User Session
export type UserType = 'b2c' | 'b2b' | 'admin' | null;

export interface UserSession {
  type: UserType;
  b2cUser?: CpfClient | null;
  b2bUser?: B2BUser | null;
  adminUser?: AdminUser | null;
}

export interface HeroSlideSettings {
  id: string;
  image: string;
  tag: string;
  title: string;
  highlight: string;
  subtitle: string;
  inquiryMsg?: string;
}

// Global Site Settings
export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  whatsappNumber: string;
  phone: string;
  address: string;
  showStockStatus: boolean;
  youtubeVideoUrl?: string;
  siteLogo?: string;
  instagramReels?: string[];
  heroSlides?: HeroSlideSettings[];
}


// Vendedor / Atendimento WhatsApp
export interface Vendedor {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cargo?: string;
  fotoUrl?: string; // foto do vendedor ou logo em base64/URL
  ativo: boolean;
  createdAt: string;
}

// Customer Inquiry / Quote Request
export interface InquiryLog {
  id: string;
  clientName: string;
  clientType: 'CPF' | 'CNPJ';
  clientDocument: string;
  clientPhone: string;
  productName: string;
  productSku: string;
  date: string;
  status: 'Novo' | 'Em Atendimento' | 'Concluído';
  notes?: string;
}

export type Seller = Vendedor;

