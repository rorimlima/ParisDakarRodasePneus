/**
 * Marcas e modelos de veículos atendidos.
 * Usado no multiselect "Marcas atendidas" da ficha técnica — um produto
 * (roda, alargador, calço, engate, capota) costuma atender várias marcas.
 */

export interface MarcaVeiculo {
  id: string;
  nome: string;
  furacoesComuns: string[];
  modelos: string[];
}

export const MARCAS_VEICULOS: MarcaVeiculo[] = [
  {
    id: 'toyota',
    nome: 'Toyota',
    furacoesComuns: ['6x139.7'],
    modelos: ['Hilux', 'Hilux SW4', 'Bandeirante', 'Land Cruiser', 'RAV4']
  },
  {
    id: 'ford',
    nome: 'Ford',
    furacoesComuns: ['6x139.7', '5x114.3'],
    modelos: ['Ranger', 'Ranger Raptor', 'F-250', 'F-1000', 'Bronco', 'Maverick']
  },
  {
    id: 'chevrolet',
    nome: 'Chevrolet',
    furacoesComuns: ['6x139.7', '6x114.3'],
    modelos: ['S10', 'Trailblazer', 'Blazer', 'Silverado', 'Montana', 'D-20']
  },
  {
    id: 'mitsubishi',
    nome: 'Mitsubishi',
    furacoesComuns: ['6x139.7'],
    modelos: ['L200 Triton', 'L200 Triton Sport', 'L200 Outdoor', 'Pajero', 'Pajero Sport', 'Pajero TR4']
  },
  {
    id: 'volkswagen',
    nome: 'Volkswagen',
    furacoesComuns: ['6x139.7', '5x120', '5x112'],
    modelos: ['Amarok', 'Saveiro', 'Taos', 'Tiguan']
  },
  {
    id: 'nissan',
    nome: 'Nissan',
    furacoesComuns: ['6x114.3', '6x139.7'],
    modelos: ['Frontier', 'Frontier Attack', 'X-Terra', 'Kicks']
  },
  {
    id: 'jeep',
    nome: 'Jeep',
    furacoesComuns: ['5x127', '5x110', '5x114.3'],
    modelos: ['Wrangler', 'Gladiator', 'Compass', 'Renegade', 'Commander', 'Willys']
  },
  {
    id: 'ram',
    nome: 'RAM',
    furacoesComuns: ['6x139.7', '8x165.1'],
    modelos: ['Rampage', 'Classic 2500', 'Classic 3500', 'Laramie 1500']
  },
  {
    id: 'fiat',
    nome: 'Fiat',
    furacoesComuns: ['5x114.3', '4x98'],
    modelos: ['Toro', 'Strada', 'Titano', 'Fastback', 'Pulse']
  },
  {
    id: 'gwm',
    nome: 'GWM',
    furacoesComuns: ['6x139.7'],
    modelos: ['Poer', 'Haval H6']
  },
  {
    id: 'jac',
    nome: 'JAC',
    furacoesComuns: ['6x139.7'],
    modelos: ['T8', 'T9']
  },
  {
    id: 'land-rover',
    nome: 'Land Rover',
    furacoesComuns: ['5x120', '5x165.1'],
    modelos: ['Defender', 'Discovery', 'Range Rover', 'Freelander']
  },
  {
    id: 'suzuki',
    nome: 'Suzuki',
    furacoesComuns: ['5x139.7'],
    modelos: ['Jimny', 'Jimny Sierra', 'Vitara', 'Grand Vitara']
  },
  {
    id: 'renault',
    nome: 'Renault',
    furacoesComuns: ['5x114.3', '4x100'],
    modelos: ['Oroch', 'Duster', 'Alaskan', 'Kardian']
  },
  {
    id: 'peugeot',
    nome: 'Peugeot',
    furacoesComuns: ['4x108', '5x108'],
    modelos: ['Landtrek', '3008', '2008']
  },
  {
    id: 'hyundai',
    nome: 'Hyundai',
    furacoesComuns: ['5x114.3'],
    modelos: ['Creta', 'Tucson', 'Santa Fe', 'HR']
  },
  {
    id: 'mercedes-benz',
    nome: 'Mercedes-Benz',
    furacoesComuns: ['5x112', '6x139.7'],
    modelos: ['Classe X', 'Sprinter', 'GLA', 'GLC']
  },
  {
    id: 'universal',
    nome: 'Universal / Multi-aplicação',
    furacoesComuns: [],
    modelos: ['Aplicação universal']
  }
];

export const NOMES_MARCAS: string[] = MARCAS_VEICULOS.map((m) => m.nome);

export const MODELOS_POR_MARCA: Record<string, string[]> = MARCAS_VEICULOS.reduce(
  (acc, m) => {
    acc[m.nome] = m.modelos;
    return acc;
  },
  {} as Record<string, string[]>
);

export const TODOS_MODELOS: string[] = Array.from(
  new Set(MARCAS_VEICULOS.flatMap((m) => m.modelos))
).sort();

/** Furações usadas em rodas, alargadores, adaptadores e porcas. */
export const FURACOES_DISPONIVEIS: string[] = [
  '4x100',
  '4x108',
  '4x114.3',
  '5x100',
  '5x108',
  '5x110',
  '5x112',
  '5x114.3',
  '5x120',
  '5x127',
  '5x139.7',
  '5x150',
  '5x165.1',
  '6x114.3',
  '6x127',
  '6x139.7',
  '8x165.1',
  '8x170',
  '8x180',
  '10x335'
];

export const AROS_DISPONIVEIS: string[] = [
  '13"', '14"', '15"', '16"', '17"', '18"', '19"', '20"', '22"', '24"'
];

export const TIPOS_PNEU: string[] = [
  'MT — Mud Terrain (lama)',
  'AT — All Terrain (misto)',
  'HT — Highway Terrain (asfalto)',
  'LT — Light Truck (reforçado)',
  'RT — Rugged Terrain (híbrido)',
  'Rally / Competição',
  'Câmera de ar'
];

export const GARANTIAS_PADRAO: string[] = [
  'Sem garantia (produto usado / recebido em troca)',
  '30 dias — garantia legal',
  '90 dias — garantia legal estendida',
  '6 meses',
  '1 ano de fábrica',
  '2 anos de fábrica',
  '3 anos de fábrica',
  '5 anos contra defeito de fabricação',
  'Vitalícia contra defeito de fabricação'
];
