import {
  Product,
  SiteSettings,
  B2BUser,
  CpfClient,
  AdminUser,
  UserSession,
  InquiryLog,
  Seller
} from '../types';
import { MOCK_PRODUCTS } from '../data/mockProducts';

const STORAGE_KEYS = {
  PRODUCTS: 'pd_products',
  SITE_SETTINGS: 'pd_site_settings',
  CPF_USERS: 'pd_cpf_users',
  CNPJ_USERS: 'pd_cnpj_users',
  ADMIN_USERS: 'pd_admin_users',
  USER_SESSION: 'pd_user_session',
  INQUIRIES: 'pd_inquiries',
  SELLERS: 'pd_sellers'
};

export const DEFAULT_SELLERS: Seller[] = [
  {
    id: 'seller-001',
    name: 'Rodrigo Lima',
    phone: '(11) 99999-8888',
    email: 'rodrigo.vendas@parisdakar.com.br',
    specialty: 'Consultor Técnico 4x4 & Rodas Heavy-Duty',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2026-01-15'
  },
  {
    id: 'seller-002',
    name: 'Eduardo Dakar',
    phone: '(11) 98888-7777',
    email: 'eduardo.dakar@parisdakar.com.br',
    specialty: 'Especialista em Pneus Off-Road & Lift Kits',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: '2026-02-01'
  }
];


export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroTitle: 'Especialistas em Caminhonetes 4x4',
  heroSubtitle: 'Rodas Forjadas Heavy-Duty, Pneus Off-Road & Lift Kits de Suspensão de Alta Performance para Caminhonetes',
  announcementText: '⚡ ESPECIALISTAS EM CAMINHONETES 4X4 • RODAS FORJADAS & PNEUS OFF-ROAD • VENDAS E CONSULTORIA ESPECIALIZADA',
  whatsappNumber: '5511999998888',
  phone: '(11) 3456-7890',
  address: 'Av. das Nações Unidas, 12901 - Morumbi, São Paulo - SP',
  showStockStatus: true
};

export const DEFAULT_SENIOR_ADMIN: AdminUser = {
  id: 'admin-senior-001',
  name: 'Master Supremo',
  email: 'admin@parisdakar.com.br',
  role: 'senior',
  grantedBySenior: true,
  createdAt: '2026-01-01'
};


export const DEFAULT_SAMPLE_B2B: B2BUser = {
  id: 'b2b-001',
  isLoggedIn: true,
  companyName: 'Dakar Auto Center & Preparações LTDA',
  tradeName: 'Dakar Caminhonetes 4x4 SP',
  cnpj: '12.ABC.345/0001-89',
  taxRegime: 'Simples Nacional',
  stateRegistration: '112.334.556.778',
  phone: '(11) 98888-7777',
  email: 'contato@dakaroffroad.com.br',
  address: 'Rua dos Trilhos, 450 - Mooca, São Paulo - SP',
  discountPercentage: 20,
  createdAt: '2026-02-10'
};

export const DEFAULT_SAMPLE_CPF: CpfClient = {
  id: 'b2c-001',
  fullName: 'Carlos Eduardo Hilux',
  cpf: '123.456.789-00',
  email: 'carlos@expedicao.com.br',
  phone: '(11) 97777-5555',
  address: 'Rua das Palmeiras, 120 - Jardins, São Paulo - SP',
  cep: '01400-000',
  createdAt: '2026-03-01'
};

// Storage Service Class
class StorageService {
  
  // Products
  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      this.saveProducts(MOCK_PRODUCTS);
      return MOCK_PRODUCTS;
    }
    try {
      const parsed: Product[] = JSON.parse(data);
      // Clean up stale mock data with beadlock references
      const cleaned = parsed.map((p) => {
        if (p.name.includes('Beadlock')) {
          p.name = p.name.replace(/Beadlock Spec/gi, 'Heavy-Duty').replace(/Beadlock/gi, 'Heavy-Duty');
        }
        if (p.subcategory?.includes('Beadlock')) {
          p.subcategory = 'Forjada Caminhonete 4x4';
        }
        if (p.badge?.includes('BEADLOCK')) {
          p.badge = 'FORGED 4X4 HEAVY-DUTY';
        }
        return p;
      });
      return cleaned;
    } catch {
      return MOCK_PRODUCTS;
    }
  }

  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  saveProduct(product: Product): Product[] {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    this.saveProducts(products);
    return products;
  }

  deleteProduct(id: string): Product[] {
    const products = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(products);
    return products;
  }

  // Site Settings
  getSiteSettings(): SiteSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SITE_SETTINGS);
    if (!data) {
      this.saveSiteSettings(DEFAULT_SITE_SETTINGS);
      return DEFAULT_SITE_SETTINGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  }

  saveSiteSettings(settings: SiteSettings) {
    localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(settings));
  }

  // CPF Users (B2C)
  getCpfUsers(): CpfClient[] {
    const data = localStorage.getItem(STORAGE_KEYS.CPF_USERS);
    if (!data) {
      const initial = [DEFAULT_SAMPLE_CPF];
      localStorage.setItem(STORAGE_KEYS.CPF_USERS, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [DEFAULT_SAMPLE_CPF];
    }
  }

  registerCpfUser(user: Omit<CpfClient, 'id' | 'createdAt'>): CpfClient {
    const users = this.getCpfUsers();
    const newUser: CpfClient = {
      ...user,
      id: `cpf-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    users.unshift(newUser);
    localStorage.setItem(STORAGE_KEYS.CPF_USERS, JSON.stringify(users));
    return newUser;
  }

  // CNPJ Users (B2B)
  getCnpjUsers(): B2BUser[] {
    const data = localStorage.getItem(STORAGE_KEYS.CNPJ_USERS);
    if (!data) {
      const initial = [DEFAULT_SAMPLE_B2B];
      localStorage.setItem(STORAGE_KEYS.CNPJ_USERS, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [DEFAULT_SAMPLE_B2B];
    }
  }

  registerCnpjUser(user: Omit<B2BUser, 'id' | 'createdAt' | 'isLoggedIn'>): B2BUser {
    const users = this.getCnpjUsers();
    const newUser: B2BUser = {
      ...user,
      id: `cnpj-${Date.now()}`,
      isLoggedIn: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    users.unshift(newUser);
    localStorage.setItem(STORAGE_KEYS.CNPJ_USERS, JSON.stringify(users));
    return newUser;
  }

  // Admin Users
  getAdminUsers(): AdminUser[] {
    const data = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS);
    if (!data) {
      const initial = [DEFAULT_SENIOR_ADMIN];
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [DEFAULT_SENIOR_ADMIN];
    }
  }

  addAdminUser(newAdmin: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser {
    const admins = this.getAdminUsers();
    const admin: AdminUser = {
      ...newAdmin,
      id: `admin-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    admins.push(admin);
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(admins));
    return admin;
  }

  // Session Management
  getUserSession(): UserSession {
    const data = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!data) {
      return { type: null };
    }
    try {
      return JSON.parse(data);
    } catch {
      return { type: null };
    }
  }

  saveUserSession(session: UserSession) {
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
  }

  clearUserSession() {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  }

  // Inquiries / Leads
  getInquiries(): InquiryLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
    if (!data) {
      const initialSample: InquiryLog[] = [
        {
          id: 'inq-001',
          clientName: 'Dakar Auto Center',
          clientType: 'CNPJ',
          clientDocument: '12.ABC.345/0001-89',
          clientPhone: '(11) 98888-7777',
          productName: 'Roda Forged Dakar Heavy-Duty 17x9.0 ET-12',
          productSku: 'PD-DAKAR-1790-6139',
          date: '2026-08-01',
          status: 'Em Atendimento',
          notes: 'Cliente solicitou cotação de 4 jogos para caminhonetes Hilux e Ranger'
        },
        {
          id: 'inq-002',
          clientName: 'Carlos Eduardo Hilux',
          clientType: 'CPF',
          clientDocument: '123.456.789-00',
          clientPhone: '(11) 97777-5555',
          productName: 'Pneu Dakar Mud-Terrain Extreme MT 35x12.50R17',
          productSku: 'PD-MAX-35125-17',
          date: '2026-08-02',
          status: 'Novo',
          notes: 'Consulta de compatibilidade para Hilux SRX com Lift 2.5"'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(initialSample));
      return initialSample;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  addInquiry(inquiry: Omit<InquiryLog, 'id' | 'date' | 'status'>): InquiryLog {
    const inquiries = this.getInquiries();
    const newLog: InquiryLog = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Novo'
    };
    inquiries.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    return newLog;
  }

  updateInquiryStatus(id: string, status: 'Novo' | 'Em Atendimento' | 'Concluído') {
    const inquiries = this.getInquiries();
    const item = inquiries.find((i) => i.id === id);
    if (item) {
      item.status = status;
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    }
    return inquiries;
  }

  // Sellers Management
  getSellers(): Seller[] {
    const data = localStorage.getItem(STORAGE_KEYS.SELLERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(DEFAULT_SELLERS));
      return DEFAULT_SELLERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_SELLERS;
    }
  }

  saveSellers(sellers: Seller[]): Seller[] {
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellers));
    return sellers;
  }

  addSeller(sellerData: Omit<Seller, 'id' | 'createdAt'>): Seller[] {
    const sellers = this.getSellers();
    const newSeller: Seller = {
      ...sellerData,
      id: `seller-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    sellers.unshift(newSeller);
    return this.saveSellers(sellers);
  }

  updateSeller(updatedSeller: Seller): Seller[] {
    const sellers = this.getSellers();
    const index = sellers.findIndex((s) => s.id === updatedSeller.id);
    if (index >= 0) {
      sellers[index] = updatedSeller;
    }
    return this.saveSellers(sellers);
  }

  deleteSeller(id: string): Seller[] {
    const sellers = this.getSellers().filter((s) => s.id !== id);
    return this.saveSellers(sellers);
  }

  toggleSellerStatus(id: string): Seller[] {
    const sellers = this.getSellers();
    const seller = sellers.find((s) => s.id === id);
    if (seller) {
      seller.isActive = !seller.isActive;
    }
    return this.saveSellers(sellers);
  }
}

export const storageService = new StorageService();

