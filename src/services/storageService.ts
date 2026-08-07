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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { obterDb, COLECOES } from '../firebase/config';

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

// Sem avatarUrl: nenhum vendedor real ainda cadastrou uma foto própria. Os
// componentes que exibem vendedor (WhatsAppSellerModal, AdminDashboard) já
// caem para um avatar de iniciais quando avatarUrl está vazio — nunca uma
// foto de banco de imagens fingindo ser um funcionário real.
export const DEFAULT_SELLERS: Seller[] = [
  {
    id: 'seller-001',
    name: 'Rodrigo Lima',
    phone: '(11) 99999-8888',
    email: 'rodrigo.vendas@parisdakar.com.br',
    specialty: 'Consultor Técnico 4x4 & Rodas Heavy-Duty',
    isActive: true,
    createdAt: '2026-01-15'
  },
  {
    id: 'seller-002',
    name: 'Eduardo Dakar',
    phone: '(11) 98888-7777',
    email: 'eduardo.dakar@parisdakar.com.br',
    specialty: 'Especialista em Pneus Off-Road & Lift Kits',
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
      return [];
    }
    try {
      const parsed: Product[] = JSON.parse(data);
      const realProducts = parsed.filter(
        (p) =>
          !p.id.startsWith('pd-rod-') &&
          !p.id.startsWith('pd-pneu-') &&
          !p.id.startsWith('pd-lift-') &&
          !p.id.startsWith('pd-combo-') &&
          !p.id.startsWith('pd-acess-') &&
          !p.id.startsWith('prod-0')
      );
      return realProducts;
    } catch {
      return [];
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

  async fetchSiteSettings(): Promise<SiteSettings | null> {
    try {
      const db = obterDb();
      if (!db) return null;
      const snap = await getDoc(doc(db, COLECOES.configuracoes, 'site'));
      if (snap.exists()) {
        const data = snap.data() as SiteSettings;
        localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('[storageService] erro ao carregar configuracoes do Firestore:', e);
    }
    return null;
  }

  saveSiteSettings(settings: SiteSettings) {
    localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(settings));
    try {
      const db = obterDb();
      if (db) {
        setDoc(doc(db, COLECOES.configuracoes, 'site'), {
          ...settings,
          atualizadoEm: new Date().toISOString()
        }).catch((err) => console.warn('[storageService] erro ao salvar configuracoes no Firestore:', err));
      }
    } catch (e) {
      console.warn('[storageService] firebase indisponivel para configuracoes:', e);
    }
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

  async syncCpfUserWithFirestore(firebaseUser: { uid: string; displayName?: string | null; email?: string | null; phoneNumber?: string | null }): Promise<CpfClient> {
    try {
      const db = obterDb();
      if (!db) {
        return this.syncCpfUserLocal(firebaseUser);
      }

      const docId = firebaseUser.email?.toLowerCase() || firebaseUser.uid;
      const userDocRef = doc(db, COLECOES.clientesCpf, docId);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const existing = snap.data() as CpfClient;
        this.saveCpfUserLocal(existing);
        return existing;
      } else {
        const newUser: CpfClient = {
          id: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'Usuário Google',
          cpf: '000.000.000-00',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '(11) 99999-9999',
          address: 'Cadastrado via Google Auth',
          cep: '00000-000',
          createdAt: new Date().toISOString().split('T')[0]
        };
        await setDoc(userDocRef, newUser);
        this.saveCpfUserLocal(newUser);
        return newUser;
      }
    } catch (e) {
      console.error('[storageService] erro ao sincronizar usuário B2C com Firestore:', e);
      return this.syncCpfUserLocal(firebaseUser);
    }
  }

  private syncCpfUserLocal(firebaseUser: any): CpfClient {
    const cpfUsers = this.getCpfUsers();
    let existing = cpfUsers.find((u) => u.email.toLowerCase() === (firebaseUser.email || '').toLowerCase());
    if (!existing) {
      existing = this.registerCpfUser({
        fullName: firebaseUser.displayName || 'Usuário Google',
        cpf: '000.000.000-00',
        email: firebaseUser.email || '',
        phone: firebaseUser.phoneNumber || '(11) 99999-9999',
        address: 'Cadastrado via Google Auth',
        cep: '00000-000'
      });
    }
    return existing;
  }

  private saveCpfUserLocal(user: CpfClient) {
    const users = this.getCpfUsers().filter((u) => u.id !== user.id && u.email !== user.email);
    users.unshift(user);
    localStorage.setItem(STORAGE_KEYS.CPF_USERS, JSON.stringify(users));
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
    try {
      const db = obterDb();
      if (db) {
        setDoc(doc(db, COLECOES.cotacoes, newLog.id), {
          ...newLog,
          criadoEm: new Date().toISOString()
        }).catch((err) => console.warn('[storageService] erro ao salvar cotacao no Firestore:', err));
      }
    } catch (e) {
      console.warn('[storageService] firebase indisponivel para cotacao:', e);
    }
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

  async fetchSellers(): Promise<Seller[] | null> {
    try {
      const db = obterDb();
      if (!db) return null;
      const snap = await getDoc(doc(db, COLECOES.configuracoes, 'sellers'));
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.sellers)) {
          const sellersList = data.sellers as Seller[];
          localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellersList));
          return sellersList;
        }
      } else {
        const sellersList = this.getSellers();
        this.saveSellers(sellersList);
        return sellersList;
      }
    } catch (e) {
      console.warn('[storageService] erro ao carregar vendedores do Firestore:', e);
    }
    return null;
  }

  saveSellers(sellers: Seller[]): Seller[] {
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellers));
    try {
      const db = obterDb();
      if (db) {
        setDoc(doc(db, COLECOES.configuracoes, 'sellers'), {
          sellers,
          atualizadoEm: new Date().toISOString()
        }).catch((err) => console.warn('[storageService] erro ao salvar vendedores no Firestore:', err));
      }
    } catch (e) {
      console.warn('[storageService] firebase indisponivel para vendedores:', e);
    }
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

  async saveCpfUserToFirestore(uid: string, user: Omit<CpfClient, 'id' | 'createdAt'>): Promise<CpfClient> {
    const newUser: CpfClient = {
      ...user,
      id: uid,
      createdAt: new Date().toISOString().split('T')[0]
    };
    try {
      const db = obterDb();
      if (db) {
        const docId = user.email?.toLowerCase() || uid;
        await setDoc(doc(db, COLECOES.clientesCpf, docId), newUser);
      }
    } catch (e) {
      console.warn('[storageService] erro ao salvar CPF no Firestore:', e);
    }
    this.saveCpfUserLocal(newUser);
    return newUser;
  }

  async fetchCpfUserFromFirestore(uid: string, email?: string): Promise<CpfClient | null> {
    try {
      const db = obterDb();
      if (db) {
        const docId = email?.toLowerCase() || uid;
        const snap = await getDoc(doc(db, COLECOES.clientesCpf, docId));
        if (snap.exists()) {
          const user = snap.data() as CpfClient;
          this.saveCpfUserLocal(user);
          return user;
        }
      }
    } catch (e) {
      console.warn('[storageService] erro ao buscar CPF no Firestore:', e);
    }
    return null;
  }

  async saveCnpjUserToFirestore(uid: string, user: Omit<B2BUser, 'id' | 'createdAt' | 'isLoggedIn'>): Promise<B2BUser> {
    const newUser: B2BUser = {
      ...user,
      id: uid,
      isLoggedIn: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    try {
      const db = obterDb();
      if (db) {
        await setDoc(doc(db, COLECOES.clientesCnpj, uid), newUser);
      }
    } catch (e) {
      console.warn('[storageService] erro ao salvar CNPJ no Firestore:', e);
    }
    const users = this.getCnpjUsers().filter((u) => u.id !== uid && u.email !== user.email);
    users.unshift(newUser);
    localStorage.setItem(STORAGE_KEYS.CNPJ_USERS, JSON.stringify(users));
    return newUser;
  }

  async fetchCnpjUserFromFirestore(uid: string): Promise<B2BUser | null> {
    try {
      const db = obterDb();
      if (db) {
        const snap = await getDoc(doc(db, COLECOES.clientesCnpj, uid));
        if (snap.exists()) {
          const user = snap.data() as B2BUser;
          const users = this.getCnpjUsers().filter((u) => u.id !== uid && u.email !== user.email);
          users.unshift(user);
          localStorage.setItem(STORAGE_KEYS.CNPJ_USERS, JSON.stringify(users));
          return user;
        }
      }
    } catch (e) {
      console.warn('[storageService] erro ao buscar CNPJ no Firestore:', e);
    }
    return null;
  }
}

export const storageService = new StorageService();
