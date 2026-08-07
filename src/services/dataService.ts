import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '../config/firebaseClient';
import { DEFAULT_SELLERS, DEFAULT_SITE_SETTINGS, storageService } from './storageService';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import type { AdminUser, B2BUser, CpfClient, InquiryLog, Product, Seller, SiteSettings } from '../types';

/**
 * Camada de dados do catálogo, configurações, vendedores e orçamentos.
 *
 * Com o Firebase configurado, tudo vive no Firestore e é compartilhado entre
 * dispositivos. Sem configuração (desenvolvimento local sem `.env`), cai para o
 * `storageService` em localStorage — a aplicação continua funcionando igual.
 *
 * As permissões de cada coleção estão em `firestore.rules`: catálogo é público
 * para leitura e só admin escreve; orçamentos são criados pelo próprio usuário.
 */

const PRODUCTS = 'products';
const SITE_SETTINGS = 'siteSettings';
const SITE_SETTINGS_DOC = 'global';
const SELLERS = 'sellers';
const INQUIRIES = 'inquiries';
const CLIENTS = 'clients';
const B2B_ACCOUNTS = 'b2bAccounts';
const ADMIN_USERS = 'adminUsers';

/** O Firestore rejeita `undefined`; campos opcionais vazios são removidos. */
const stripUndefined = <T extends Record<string, unknown>>(value: T): T => {
  const clean: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    clean[key] = item;
  }
  return clean as T;
};

const useFirestore = (): boolean => isFirebaseConfigured;

const currentUid = (): string | null => {
  if (!isFirebaseConfigured) return null;
  return getFirebaseAuth().currentUser?.uid ?? null;
};

const asDateString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  const toDate = (value as { toDate?: () => Date } | null)?.toDate;
  if (typeof toDate === 'function') {
    return toDate.call(value).toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

// ---------------------------------------------------------------------------
// Catálogo de produtos
// ---------------------------------------------------------------------------

export const listProducts = async (): Promise<Product[]> => {
  if (!useFirestore()) return storageService.getProducts();

  const snapshot = await getDocs(collection(getFirebaseDb(), PRODUCTS));
  if (snapshot.empty) {
    // Catálogo ainda não semeado: mostra os dados de exemplo em vez de uma loja vazia.
    return MOCK_PRODUCTS;
  }

  return snapshot.docs.map((entry) => ({ ...(entry.data() as Product), id: entry.id }));
};

export const saveProduct = async (product: Product, current: Product[]): Promise<Product[]> => {
  if (!useFirestore()) return storageService.saveProduct(product);

  await setDoc(doc(getFirebaseDb(), PRODUCTS, product.id), stripUndefined({ ...product }));

  const index = current.findIndex((item) => item.id === product.id);
  if (index >= 0) {
    const updated = [...current];
    updated[index] = product;
    return updated;
  }
  return [product, ...current];
};

/** Grava a lista inteira (usado pela importação de planilha). */
export const saveProducts = async (products: Product[]): Promise<Product[]> => {
  if (!useFirestore()) {
    storageService.saveProducts(products);
    return products;
  }

  const db = getFirebaseDb();
  // O Firestore aceita no máximo 500 operações por lote.
  for (let start = 0; start < products.length; start += 400) {
    const batch = writeBatch(db);
    for (const product of products.slice(start, start + 400)) {
      batch.set(doc(db, PRODUCTS, product.id), stripUndefined({ ...product }));
    }
    await batch.commit();
  }

  return products;
};

export const deleteProduct = async (id: string, current: Product[]): Promise<Product[]> => {
  if (!useFirestore()) return storageService.deleteProduct(id);

  await deleteDoc(doc(getFirebaseDb(), PRODUCTS, id));
  return current.filter((item) => item.id !== id);
};

// ---------------------------------------------------------------------------
// Configurações do site
// ---------------------------------------------------------------------------

export const getSiteSettings = async (): Promise<SiteSettings> => {
  if (!useFirestore()) return storageService.getSiteSettings();

  const snapshot = await getDoc(doc(getFirebaseDb(), SITE_SETTINGS, SITE_SETTINGS_DOC));
  return snapshot.exists() ? ({ ...DEFAULT_SITE_SETTINGS, ...snapshot.data() } as SiteSettings) : DEFAULT_SITE_SETTINGS;
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<SiteSettings> => {
  if (!useFirestore()) {
    storageService.saveSiteSettings(settings);
    return settings;
  }

  await setDoc(doc(getFirebaseDb(), SITE_SETTINGS, SITE_SETTINGS_DOC), stripUndefined({ ...settings }));
  return settings;
};

// ---------------------------------------------------------------------------
// Vendedores
// ---------------------------------------------------------------------------

export const listSellers = async (): Promise<Seller[]> => {
  if (!useFirestore()) return storageService.getSellers();

  const snapshot = await getDocs(collection(getFirebaseDb(), SELLERS));
  if (snapshot.empty) return DEFAULT_SELLERS;

  return snapshot.docs.map((entry) => ({
    ...(entry.data() as Seller),
    id: entry.id,
    createdAt: asDateString((entry.data() as Seller).createdAt),
  }));
};

export const addSeller = async (
  data: Omit<Seller, 'id' | 'createdAt'>,
  current: Seller[]
): Promise<Seller[]> => {
  if (!useFirestore()) return storageService.addSeller(data);

  const seller: Seller = {
    ...data,
    id: `seller-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
  };
  await setDoc(doc(getFirebaseDb(), SELLERS, seller.id), stripUndefined({ ...seller }));
  return [seller, ...current];
};

export const updateSeller = async (seller: Seller, current: Seller[]): Promise<Seller[]> => {
  if (!useFirestore()) return storageService.updateSeller(seller);

  await setDoc(doc(getFirebaseDb(), SELLERS, seller.id), stripUndefined({ ...seller }));
  return current.map((item) => (item.id === seller.id ? seller : item));
};

export const deleteSeller = async (id: string, current: Seller[]): Promise<Seller[]> => {
  if (!useFirestore()) return storageService.deleteSeller(id);

  await deleteDoc(doc(getFirebaseDb(), SELLERS, id));
  return current.filter((item) => item.id !== id);
};

export const toggleSellerStatus = async (id: string, current: Seller[]): Promise<Seller[]> => {
  if (!useFirestore()) return storageService.toggleSellerStatus(id);

  const seller = current.find((item) => item.id === id);
  if (!seller) return current;

  const updated: Seller = { ...seller, isActive: !seller.isActive };
  await updateDoc(doc(getFirebaseDb(), SELLERS, id), { isActive: updated.isActive });
  return current.map((item) => (item.id === id ? updated : item));
};

// ---------------------------------------------------------------------------
// Orçamentos (leads do WhatsApp)
// ---------------------------------------------------------------------------

export const listInquiries = async (): Promise<InquiryLog[]> => {
  if (!useFirestore()) return storageService.getInquiries();

  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), INQUIRIES), orderBy('createdAt', 'desc'))
  );

  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      clientName: data.clientName ?? '',
      clientType: data.clientType === 'CNPJ' ? 'CNPJ' : 'CPF',
      clientDocument: data.clientDocument ?? '',
      clientPhone: data.clientPhone ?? '',
      productName: data.productName ?? '',
      productSku: data.productSku ?? '',
      date: asDateString(data.createdAt ?? data.date),
      status: data.status ?? 'Novo',
      notes: data.notes,
      assignedSeller: data.assignedSeller,
    } satisfies InquiryLog;
  });
};

/**
 * Registra um orçamento. As regras exigem usuário autenticado gravando em seu
 * próprio nome, então o lead de um visitante anônimo fica só no navegador.
 */
export const addInquiry = async (
  inquiry: Omit<InquiryLog, 'id' | 'date' | 'status'>
): Promise<InquiryLog> => {
  const uid = currentUid();

  if (!useFirestore() || !uid) {
    return storageService.addInquiry(inquiry);
  }

  const id = `inq-${Date.now()}`;
  await setDoc(
    doc(getFirebaseDb(), INQUIRIES, id),
    stripUndefined({
      ...inquiry,
      userId: uid,
      status: 'Novo',
      createdAt: serverTimestamp(),
    })
  );

  return {
    ...inquiry,
    id,
    date: new Date().toISOString().split('T')[0],
    status: 'Novo',
  };
};

export const updateInquiryStatus = async (
  id: string,
  status: InquiryLog['status'],
  current: InquiryLog[]
): Promise<InquiryLog[]> => {
  if (!useFirestore()) return storageService.updateInquiryStatus(id, status);

  await updateDoc(doc(getFirebaseDb(), INQUIRIES, id), { status });
  return current.map((item) => (item.id === id ? { ...item, status } : item));
};

// ---------------------------------------------------------------------------
// Carteira de clientes (somente administrador)
// ---------------------------------------------------------------------------

export const listCpfClients = async (): Promise<CpfClient[]> => {
  if (!useFirestore()) return storageService.getCpfUsers();

  const snapshot = await getDocs(collection(getFirebaseDb(), CLIENTS));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      fullName: data.fullName ?? '',
      cpf: data.cpf ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      address: data.address ?? '',
      cep: data.cep ?? '',
      createdAt: asDateString(data.createdAt),
    } satisfies CpfClient;
  });
};

export const listB2BAccounts = async (): Promise<B2BUser[]> => {
  if (!useFirestore()) return storageService.getCnpjUsers();

  const snapshot = await getDocs(collection(getFirebaseDb(), B2B_ACCOUNTS));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      isLoggedIn: false,
      companyName: data.companyName ?? '',
      tradeName: data.tradeName ?? '',
      cnpj: data.cnpj ?? '',
      taxRegime: data.taxRegime ?? 'Simples Nacional',
      stateRegistration: data.stateRegistration,
      phone: data.phone ?? '',
      email: data.email ?? '',
      address: data.address,
      discountPercentage: typeof data.discountPercentage === 'number' ? data.discountPercentage : 0,
      status: data.status ?? 'pending',
      createdAt: asDateString(data.createdAt),
    } satisfies B2BUser;
  });
};

/**
 * Lista os administradores registrados. A fonte da verdade da permissão é o
 * Custom Claim no Firebase Auth — esta coleção é apenas o cadastro descritivo
 * mantido pelo backend, e o navegador não consegue escrever nela.
 */
export const listAdminUsers = async (): Promise<AdminUser[]> => {
  if (!useFirestore()) return storageService.getAdminUsers();

  const snapshot = await getDocs(collection(getFirebaseDb(), ADMIN_USERS));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      name: data.name ?? '',
      email: data.email ?? '',
      role: data.role === 'senior' ? 'senior' : 'admin',
      grantedBySenior: data.grantedBySenior === true,
      createdAt: asDateString(data.createdAt),
    } satisfies AdminUser;
  });
};

/** Aprova a conta B2B e define o desconto de atacado (somente administrador). */
export const updateB2BAccount = async (
  uid: string,
  changes: { status?: B2BUser['status']; discountPercentage?: number },
  current: B2BUser[]
): Promise<B2BUser[]> => {
  if (!useFirestore()) return current;

  await updateDoc(doc(getFirebaseDb(), B2B_ACCOUNTS, uid), stripUndefined({ ...changes }));
  return current.map((item) => (item.id === uid ? { ...item, ...changes } : item));
};
