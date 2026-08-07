import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'pd-rod-001',
    sku: 'PD-DAKAR-1790-6139',
    name: 'Roda Forged Dakar Heavy-Duty 17x9.0 ET-12 (Hilux / Ranger / S10)',
    brand: 'Paris Dakar Custom',
    category: 'rodas',
    subcategory: 'Forjada Caminhonete 4x4',
    price: 2890,
    originalPrice: 3200,
    isWholesaleOnly: false,
    b2bPrice: 2350,
    badge: 'FORGED 4X4 HEAVY-DUTY',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=800&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Roda forjada em alumínio aeronáutico T6-6061 sob medida para caminhonetes 4x4. Alta capacidade de carga por roda (1.350kg) com acabamento em preto fosco acetinado e parafusos decorativos em inox.',
    specs: {
      aro: '17"',
      furacao: '6x139.7',
      offset: 'ET -12',
      tala: '9.0"',
      acabamento: 'Preto Fosco',
      garantia: '5 Anos Estrutural',
      peso: '12.8 kg'
    },
    compatibleVehicles: ['Toyota Hilux 2012-2026', 'Ford Ranger 2013-2026', 'Chevrolet S10 2014-2026', 'Mitsubishi L200 Triton', 'Nissan Frontier'],
    inStock: true,
    stockQuantity: 16,
    rating: 4.9,
    reviewsCount: 38
  },
  {
    id: 'pd-pne-002',
    sku: 'PD-MAX-35125-17',
    name: 'Pneu Dakar Mud-Terrain Extreme MT 35x12.50R17 LT 121Q para Caminhonetes',
    brand: 'Paris Dakar Tires',
    category: 'pneus',
    subcategory: 'Mud-Terrain (MT)',
    price: 2450,
    originalPrice: 2750,
    isWholesaleOnly: false,
    b2bPrice: 1980,
    badge: 'EXTREME MUD MT',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Pneu desenvolvido para máxima tração e durabilidade em caminhonetes 4x4 na lama, terra batida e terrenos rochosos. Carcaça reforçada de 3 tramas de poliéster com ejetores de pedras.',
    specs: {
      aro: '17"',
      medidaPneu: '35x12.50R17',
      tipoPneu: 'MT',
      indiceCarga: '121/118Q (1450 kg por pneu)',
      garantia: '5 Anos contra defeito de fabricação',
      peso: '28.5 kg'
    },
    compatibleVehicles: ['Toyota Hilux com Lift', 'Ford Ranger Raptor', 'RAM 1500 Rebel', 'Chevrolet S10 4x4', 'Mitsubishi L200 Triton'],
    inStock: true,
    stockQuantity: 24,
    rating: 5.0,
    reviewsCount: 42
  },
  {
    id: 'pd-rod-003',
    sku: 'PD-TACTICAL-2095-5127',
    name: 'Roda Tactical Off-Road Satin Bronze 20x9.5 ET0 (RAM / F-150 / Silverado)',
    brand: 'Paris Dakar Custom',
    category: 'rodas',
    subcategory: 'Heavy Duty Caminhonetes',
    price: 3490,
    isWholesaleOnly: false,
    b2bPrice: 2850,
    badge: 'BRONZE EDITION',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    description: 'Design côncavo em Bronze Acetinado e borda usinada em CNC. Estrutura ultra reforçada com capacidade de carga de até 1.450kg por roda para caminhonetes de grande porte.',
    specs: {
      aro: '20"',
      furacao: '6x139.7',
      offset: 'ET 0',
      tala: '9.5"',
      acabamento: 'Bronze Off-Road',
      garantia: '3 Anos Estrutural',
      peso: '15.2 kg'
    },
    compatibleVehicles: ['RAM 1500 Classic', 'Ford F-150 FX4', 'Chevrolet Silverado', 'Toyota Hilux GR-Sport'],
    inStock: true,
    stockQuantity: 12,
    rating: 4.8,
    reviewsCount: 19
  },
  {
    id: 'pd-pne-004',
    sku: 'PD-AT-2857017',
    name: 'Pneu Dakar All-Terrain Tough AT2 285/70R17 116T (Hilux / Ranger / Amarok / S10)',
    brand: 'Paris Dakar Tires',
    category: 'pneus',
    subcategory: 'All-Terrain (AT)',
    price: 1890,
    originalPrice: 2100,
    isWholesaleOnly: false,
    b2bPrice: 1520,
    badge: 'ALTA DURABILIDADE',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
    description: 'Pneu para caminhonetes com equilíbrio perfeito: 50% Asfalto e 50% Off-Road. Rodar silencioso em estradas com excelente tração em cascalho e terra.',
    specs: {
      aro: '17"',
      medidaPneu: '285/70R17',
      tipoPneu: 'AT',
      indiceCarga: '116T (1250 kg / 190 km/h)',
      garantia: '5 Anos',
      peso: '22.1 kg'
    },
    compatibleVehicles: ['Toyota Hilux SW4', 'Ford Ranger Limited', 'Chevrolet S10 High Country', 'Volkswagen Amarok V6', 'Mitsubishi L200 Triton'],
    inStock: true,
    stockQuantity: 32,
    rating: 4.9,
    reviewsCount: 56
  },
  {
    id: 'pd-lif-005',
    sku: 'PD-LIFT-25-HILUX',
    name: 'Kit Lift de Suspensão 2.5" Performance Nitro para Caminhonetes Hilux / Ranger / S10',
    brand: 'Paris Dakar Suspension',
    category: 'kits-lift',
    subcategory: 'Suspensão Caminhonetes 4x4',
    price: 4890,
    originalPrice: 5400,
    isWholesaleOnly: false,
    b2bPrice: 3990,
    badge: 'PREMIUM SUSPENSION',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
    description: 'Kit de elevação completo para caminhonetes com amortecedores pressurizados a Nitrogênio, molas helicoidais de carga progressiva e calços de alumínio Billet.',
    specs: {
      alturaLift: '2.5 polegadas (6.3 cm)',
      garantia: '2 Anos sem limite de km',
      peso: '24.0 kg'
    },
    compatibleVehicles: ['Toyota Hilux 2016-2026', 'Ford Ranger 2016-2026', 'Chevrolet S10 2014-2026', 'Volkswagen Amarok V6'],
    inStock: true,
    stockQuantity: 8,
    rating: 5.0,
    reviewsCount: 27
  },
  {
    id: 'pd-comb-006',
    sku: 'PD-COMBO-RAM2500',
    name: 'Combo Dakar Caminhonetes RAM: 4 Rodas 20x10 ET-24 + 4 Pneus 37x12.50R20 MT',
    brand: 'Paris Dakar Performance',
    category: 'combos',
    subcategory: 'Combo Caminhonete 4x4 Montado',
    price: 21900,
    originalPrice: 24500,
    isWholesaleOnly: true, // Requer B2B
    b2bPrice: 18500,
    badge: 'EXCLUSIVO B2B / ATACADO',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    description: 'Conjunto completo pronto para instalação em caminhonetes Heavy Duty. Inclui 4 rodas Forged 20x10 Furação 8x165.1 + 4 Pneus 37" Mud Terrain + Bicos de Alta Pressão e balanceamento no raio laser.',
    specs: {
      aro: '20"',
      furacao: '8x165.1',
      offset: 'ET -24',
      tala: '10.0"',
      medidaPneu: '37x12.50R20',
      tipoPneu: 'MT',
      acabamento: 'Preto Fosco com detalhes usinados'
    },
    compatibleVehicles: ['RAM 2500 Laramie', 'RAM 3500 Longhorn', 'Ford F-250 Super Duty'],
    inStock: true,
    stockQuantity: 4,
    rating: 5.0,
    reviewsCount: 15
  },
  {
    id: 'pd-ace-007',
    sku: 'PD-SPACER-6139-38',
    name: 'Espaçador / Alargador de Roda 38mm Furação 6x139.7 Billet para Caminhonetes (Jogo c/ 4)',
    brand: 'Paris Dakar Accessories',
    category: 'acessorios',
    subcategory: 'Espaçadores para Caminhonetes',
    price: 1290,
    isWholesaleOnly: false,
    b2bPrice: 990,
    badge: 'BILLET AIRCRAFT',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    description: 'Alargador de via com duplo centrador usinado em CNC em alumínio Billet de uso aeronáutico. Proporciona postura mais agressiva e maior estabilidade em caminhonetes.',
    specs: {
      furacao: '6x139.7 para 6x139.7',
      garantia: '1 Ano',
      peso: '6.2 kg'
    },
    compatibleVehicles: ['Toyota Hilux', 'Ford Ranger', 'Chevrolet S10', 'Mitsubishi L200 Triton', 'Nissan Frontier'],
    inStock: true,
    stockQuantity: 20,
    rating: 4.9,
    reviewsCount: 64
  },
  {
    id: 'pd-rod-008',
    sku: 'PD-GRAVITY-1890-5114',
    name: 'Roda Paris Dakar Compact Truck Spec Matte Graphite 18x9.0 ET+18',
    brand: 'Paris Dakar Custom',
    category: 'rodas',
    subcategory: 'Caminhonetes Intermediárias',
    price: 2690,
    isWholesaleOnly: false,
    b2bPrice: 2190,
    badge: 'GRAFITE ACETINADO',
    image: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=800&q=80',
    description: 'Concebida sob medida para caminhonetes intermediárias e compactas 4x4. Pintura eletrostática fosca ultra-resistente contra impactos de sujeira e lavagens.',
    specs: {
      aro: '18"',
      furacao: '5x114.3 / 5x120',
      offset: 'ET +18',
      tala: '9.0"',
      acabamento: 'Grafite Acetinado',
      garantia: '3 Anos'
    },
    compatibleVehicles: ['RAM Rampage 4x4', 'Ford Maverick 4x4', 'Fiat Toro Ultra 4x4', 'Renault Oroch 4x4'],
    inStock: true,
    stockQuantity: 12,
    rating: 4.7,
    reviewsCount: 22
  }
];

export const VEHICLE_BRANDS = [
  { id: 'toyota', name: 'Toyota', models: ['Hilux SRX', 'Hilux GR-Sport', 'Hilux SW4', 'Land Cruiser'] },
  { id: 'ford', name: 'Ford', models: ['Ranger XLS', 'Ranger XLT', 'Ranger Limited', 'Ranger Raptor', 'F-150', 'F-250', 'Maverick'] },
  { id: 'ram', name: 'RAM', models: ['RAM Rampage', 'RAM 1500 Classic / Rebel', 'RAM 2500 Laramie', 'RAM 3500'] },
  { id: 'chevrolet', name: 'Chevrolet', models: ['S10 LTZ', 'S10 High Country', 'Silverado High Country'] },
  { id: 'mitsubishi', name: 'Mitsubishi', models: ['L200 Triton Sport', 'L200 Triton Savana', 'Pajero Sport'] },
  { id: 'volkswagen', name: 'Volkswagen', models: ['Amarok V6 Extreme', 'Amarok Highline'] },
  { id: 'nissan', name: 'Nissan', models: ['Frontier Attack', 'Frontier PRO-4X', 'Frontier XE'] }
];

export const ARO_OPTIONS = ['15"', '16"', '17"', '18"', '20"', '22"', '24"'];
export const FURACAO_OPTIONS = ['5x114.3', '5x120', '6x114.3', '6x120', '6x139.7', '8x165.1', '8x180'];
