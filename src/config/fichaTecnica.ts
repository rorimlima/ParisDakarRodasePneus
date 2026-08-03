/**
 * Schema de ficha técnica por categoria.
 *
 * A planilha do ERP entrega só código, descrição, tipo, unidade, quantidade e preço.
 * Tudo que o site precisa para vender (furação, marcas atendidas, tipo de pneu,
 * garantia, medidas) é preenchido manualmente no painel — e é este arquivo que
 * define, por categoria, quais campos o formulário exibe e quais são obrigatórios.
 *
 * Estes schemas são semeados em `categories/{slug}.campos` no Firestore, onde podem
 * ser editados sem novo deploy.
 */

import {
  CampoFichaTecnica,
  CategoriaCatalogo,
  GrupoCategoria
} from '../types/catalog';
import {
  AROS_DISPONIVEIS,
  FURACOES_DISPONIVEIS,
  GARANTIAS_PADRAO,
  NOMES_MARCAS,
  TIPOS_PNEU,
  TODOS_MODELOS
} from './marcasVeiculos';

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

/** "PNEUS E CÂMERAS" → "pneus-e-cameras" */
export function slugify(valor: string): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sem-categoria';
}

/** "PNEUS E CÂMERAS" → "Pneus e Câmeras" */
export function humanizar(valor: string): string {
  const minusculas = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'em', 'para', 'com', 'n']);
  return (valor || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((palavra, i) => {
      if (i > 0 && minusculas.has(palavra)) return palavra;
      if (palavra.length <= 2 && !minusculas.has(palavra)) return palavra.toUpperCase();
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

// ---------------------------------------------------------------------------
// Campos reutilizáveis
// ---------------------------------------------------------------------------

const campoMarcas = (ordem: number, obrigatorio = true): CampoFichaTecnica => ({
  key: 'marcasAtendidas',
  label: 'Marcas de veículo atendidas',
  tipo: 'multiselect',
  opcoes: NOMES_MARCAS,
  permiteValorLivre: true,
  obrigatorio,
  ajuda: 'Selecione todas as montadoras que este item atende. O filtro "Busca por veículo" do site usa este campo.',
  ordem,
  destaqueNoCard: true,
  filtravel: true
});

const campoModelos = (ordem: number): CampoFichaTecnica => ({
  key: 'modelosAtendidos',
  label: 'Modelos compatíveis',
  tipo: 'multiselect',
  opcoes: TODOS_MODELOS,
  permiteValorLivre: true,
  ajuda: 'Ex.: Hilux, Ranger, S10. Deixe vazio se atende toda a linha da marca.',
  ordem,
  filtravel: true
});

const campoAnos = (ordem: number): CampoFichaTecnica => ({
  key: 'anosCompativeis',
  label: 'Anos compatíveis',
  tipo: 'text',
  placeholder: '2012-2026',
  ordem
});

const campoGarantia = (ordem: number, obrigatorio = true): CampoFichaTecnica => ({
  key: 'garantia',
  label: 'Garantia',
  tipo: 'select',
  opcoes: GARANTIAS_PADRAO,
  permiteValorLivre: true,
  obrigatorio,
  ordem,
  destaqueNoCard: true
});

const campoFuracao = (ordem: number, obrigatorio = true): CampoFichaTecnica => ({
  key: 'furacao',
  label: 'Tipo de furação',
  tipo: 'select',
  opcoes: FURACOES_DISPONIVEIS,
  permiteValorLivre: true,
  obrigatorio,
  ajuda: 'Padrão de furos x diâmetro do círculo primitivo (PCD).',
  ordem,
  destaqueNoCard: true,
  filtravel: true
});

const campoObservacoes = (ordem: number): CampoFichaTecnica => ({
  key: 'observacoes',
  label: 'Observações técnicas',
  tipo: 'textarea',
  placeholder: 'Informações adicionais exibidas na ficha do produto.',
  ordem
});

// ---------------------------------------------------------------------------
// Schemas por grupo
// ---------------------------------------------------------------------------

const CAMPOS_RODAS: CampoFichaTecnica[] = [
  {
    key: 'aro',
    label: 'Aro',
    tipo: 'select',
    opcoes: AROS_DISPONIVEIS,
    permiteValorLivre: true,
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  campoFuracao(2),
  {
    key: 'tala',
    label: 'Tala (largura)',
    tipo: 'text',
    placeholder: '9.0"',
    obrigatorio: true,
    ordem: 3,
    destaqueNoCard: true
  },
  {
    key: 'offset',
    label: 'Offset (ET)',
    tipo: 'text',
    placeholder: 'ET -12',
    obrigatorio: true,
    ordem: 4,
    destaqueNoCard: true
  },
  { key: 'centerBore', label: 'Furo central (center bore)', tipo: 'text', placeholder: '106.1 mm', ordem: 5 },
  {
    key: 'material',
    label: 'Material',
    tipo: 'select',
    opcoes: ['Liga leve fundida', 'Liga leve forjada', 'Liga leve fluxo rotativo', 'Aço estampado', 'Aço reforçado'],
    permiteValorLivre: true,
    ordem: 6
  },
  {
    key: 'acabamento',
    label: 'Acabamento',
    tipo: 'select',
    opcoes: [
      'Preto Fosco',
      'Preto Brilhante',
      'Grafite Acetinado',
      'Bronze Off-Road',
      'Cromo Satinado',
      'Diamantado',
      'Prata',
      'Vermelho Dakar Accent'
    ],
    permiteValorLivre: true,
    ordem: 7,
    destaqueNoCard: true
  },
  { key: 'capacidadeCarga', label: 'Capacidade de carga por roda', tipo: 'text', placeholder: '1100 kg', ordem: 8 },
  { key: 'peso', label: 'Peso unitário', tipo: 'text', placeholder: '14.5 kg', ordem: 9 },
  {
    key: 'quantidadePorJogo',
    label: 'Peças por jogo',
    tipo: 'number',
    ajuda: 'Preencha quando a unidade do ERP for JG (jogo).',
    ordem: 10
  },
  campoMarcas(11),
  campoModelos(12),
  campoAnos(13),
  campoGarantia(14),
  campoObservacoes(15)
];

const CAMPOS_PNEUS: CampoFichaTecnica[] = [
  {
    key: 'medidaPneu',
    label: 'Medida',
    tipo: 'text',
    placeholder: '285/70R17 ou 35x12.50R17',
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  {
    key: 'tipoPneu',
    label: 'Tipo de pneu',
    tipo: 'select',
    opcoes: TIPOS_PNEU,
    obrigatorio: true,
    ordem: 2,
    destaqueNoCard: true,
    filtravel: true
  },
  { key: 'aro', label: 'Aro', tipo: 'select', opcoes: AROS_DISPONIVEIS, permiteValorLivre: true, ordem: 3, filtravel: true },
  {
    key: 'indiceCargaVelocidade',
    label: 'Índice de carga / velocidade',
    tipo: 'text',
    placeholder: '121/118Q',
    obrigatorio: true,
    ordem: 4
  },
  { key: 'lonas', label: 'Lonas (ply rating)', tipo: 'text', placeholder: '10 lonas / LT', ordem: 5 },
  {
    key: 'construcao',
    label: 'Construção',
    tipo: 'select',
    opcoes: ['Radial', 'Diagonal (bias)'],
    ordem: 6
  },
  { key: 'desenhoBanda', label: 'Desenho da banda', tipo: 'text', placeholder: 'Blocos agressivos com ombro reforçado', ordem: 7 },
  {
    key: 'usoRecomendado',
    label: 'Uso recomendado',
    tipo: 'multiselect',
    opcoes: ['Asfalto', 'Terra', 'Lama', 'Pedra / rochoso', 'Areia', 'Trilha pesada', 'Uso urbano', 'Carga pesada'],
    ordem: 8
  },
  { key: 'dot', label: 'DOT / semana de fabricação', tipo: 'text', placeholder: '3225', ordem: 9 },
  { key: 'runFlat', label: 'Run-flat', tipo: 'boolean', ordem: 10 },
  campoMarcas(11, false),
  campoModelos(12),
  campoGarantia(13),
  campoObservacoes(14)
];

const CAMPOS_KITS_LIFT: CampoFichaTecnica[] = [
  {
    key: 'alturaLift',
    label: 'Altura de elevação',
    tipo: 'text',
    placeholder: '2.0 polegadas',
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true
  },
  {
    key: 'posicaoAplicacao',
    label: 'Posição de aplicação',
    tipo: 'multiselect',
    opcoes: ['Dianteira', 'Traseira', 'Conjunto completo'],
    obrigatorio: true,
    ordem: 2
  },
  {
    key: 'itensInclusos',
    label: 'Itens inclusos no kit',
    tipo: 'textarea',
    placeholder: '2 calços dianteiros, 2 espaçadores traseiros, parafusos e manual',
    obrigatorio: true,
    ordem: 3
  },
  {
    key: 'material',
    label: 'Material',
    tipo: 'select',
    opcoes: ['Alumínio usinado', 'Aço carbono', 'Poliuretano', 'Borracha vulcanizada', 'Nylon técnico'],
    permiteValorLivre: true,
    ordem: 4
  },
  { key: 'exigeAlinhamento', label: 'Exige alinhamento após instalação', tipo: 'boolean', ordem: 5 },
  { key: 'tempoInstalacao', label: 'Tempo estimado de instalação', tipo: 'text', placeholder: '3 horas', ordem: 6 },
  campoMarcas(7),
  campoModelos(8),
  campoAnos(9),
  campoGarantia(10),
  campoObservacoes(11)
];

const CAMPOS_ACESSORIOS: CampoFichaTecnica[] = [
  {
    key: 'tipoAcessorio',
    label: 'Tipo de acessório',
    tipo: 'select',
    opcoes: [
      'Estribo / Estribo lateral',
      'Santantônio',
      'Protetor de caçamba',
      'Protetor de cárter',
      'Bagageiro / rack',
      'Snorkel',
      'Guincho e acessórios',
      'Para-choque',
      'Suspensão / amortecedor',
      'Alargador de paralama',
      'Calço / espaçador',
      'Elétrica e som',
      'Interior / conforto',
      'Outro'
    ],
    permiteValorLivre: true,
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  {
    key: 'material',
    label: 'Material / acabamento',
    tipo: 'text',
    placeholder: 'Aço carbono com pintura eletrostática preta',
    ordem: 2
  },
  { key: 'medidas', label: 'Medidas / dimensões', tipo: 'text', placeholder: '1900 x 180 x 90 mm', ordem: 3 },
  { key: 'ladoAplicacao', label: 'Lado de aplicação', tipo: 'select', opcoes: ['Direito', 'Esquerdo', 'Par', 'Único / central'], ordem: 4 },
  { key: 'instalacao', label: 'Tipo de instalação', tipo: 'select', opcoes: ['Encaixe original (sem furar)', 'Requer furação', 'Requer solda', 'Instalação profissional obrigatória'], ordem: 5 },
  campoMarcas(6),
  campoModelos(7),
  campoAnos(8),
  campoGarantia(9),
  campoObservacoes(10)
];

const CAMPOS_PECAS: CampoFichaTecnica[] = [
  {
    key: 'sistema',
    label: 'Sistema do veículo',
    tipo: 'select',
    opcoes: ['Suspensão', 'Freio', 'Motor', 'Transmissão', 'Direção', 'Elétrica', 'Arrefecimento', 'Escapamento', 'Carroceria', 'Outro'],
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  { key: 'posicao', label: 'Posição', tipo: 'select', opcoes: ['Dianteira direita', 'Dianteira esquerda', 'Dianteira (par)', 'Traseira direita', 'Traseira esquerda', 'Traseira (par)', 'Única'], ordem: 2 },
  { key: 'numeroOriginal', label: 'Número da peça original (OEM)', tipo: 'text', ordem: 3 },
  { key: 'fabricante', label: 'Fabricante', tipo: 'text', placeholder: 'Cofap, Nakata, Monroe...', ordem: 4 },
  { key: 'original', label: 'Peça genuína / original', tipo: 'boolean', ordem: 5 },
  campoMarcas(6),
  campoModelos(7),
  campoAnos(8),
  campoGarantia(9),
  campoObservacoes(10)
];

const CAMPOS_ILUMINACAO: CampoFichaTecnica[] = [
  {
    key: 'tipoIluminacao',
    label: 'Tipo de iluminação',
    tipo: 'select',
    opcoes: ['Farol de milha', 'Barra LED', 'Farol auxiliar', 'Lâmpada LED', 'Lâmpada Xênon', 'Setas / lanternas', 'Iluminação de caçamba', 'Sinalizador'],
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  { key: 'potencia', label: 'Potência', tipo: 'text', placeholder: '180 W', obrigatorio: true, ordem: 2, destaqueNoCard: true },
  { key: 'voltagem', label: 'Voltagem', tipo: 'select', opcoes: ['12V', '24V', '12V/24V bivolt'], obrigatorio: true, ordem: 3 },
  { key: 'lumens', label: 'Fluxo luminoso', tipo: 'text', placeholder: '18000 lúmens', ordem: 4 },
  { key: 'temperaturaCor', label: 'Temperatura de cor', tipo: 'text', placeholder: '6000K', ordem: 5 },
  { key: 'facho', label: 'Tipo de facho', tipo: 'select', opcoes: ['Spot (longo alcance)', 'Flood (abertura)', 'Combo'], ordem: 6 },
  { key: 'grauProtecao', label: 'Grau de proteção', tipo: 'select', opcoes: ['IP65', 'IP67', 'IP68', 'IP69K'], permiteValorLivre: true, ordem: 7 },
  { key: 'homologacao', label: 'Homologação / certificação', tipo: 'text', placeholder: 'INMETRO / Contran', ordem: 8 },
  campoMarcas(9, false),
  campoGarantia(10),
  campoObservacoes(11)
];

const CAMPOS_ENGATE: CampoFichaTecnica[] = [
  {
    key: 'tipoEngate',
    label: 'Tipo de engate',
    tipo: 'select',
    opcoes: ['Engate fixo', 'Engate removível', 'Engate escamoteável', 'Rabicho', 'Bola de engate', 'Suporte de estepe'],
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  { key: 'capacidadeTracao', label: 'Capacidade de tração', tipo: 'text', placeholder: '1500 kg', obrigatorio: true, ordem: 2, destaqueNoCard: true },
  { key: 'capacidadeVertical', label: 'Carga vertical no engate', tipo: 'text', placeholder: '75 kg', ordem: 3 },
  { key: 'diametroBola', label: 'Diâmetro da bola', tipo: 'select', opcoes: ['50 mm', '2 polegadas', '1 7/8 polegada'], permiteValorLivre: true, ordem: 4 },
  { key: 'homologacao', label: 'Homologação Contran / INMETRO', tipo: 'text', placeholder: 'Homologado Contran 197/06', obrigatorio: true, ordem: 5 },
  { key: 'chicoteEletrico', label: 'Acompanha chicote elétrico', tipo: 'boolean', ordem: 6 },
  campoMarcas(7),
  campoModelos(8),
  campoAnos(9),
  campoGarantia(10),
  campoObservacoes(11)
];

const CAMPOS_CAPOTA: CampoFichaTecnica[] = [
  {
    key: 'tipoCapota',
    label: 'Tipo de capota',
    tipo: 'select',
    opcoes: ['Marítima', 'Marítima com santantônio', 'Rígida (fibra)', 'Rígida tri-fold', 'Retrátil', 'Furgão / campteira'],
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  { key: 'material', label: 'Material', tipo: 'select', opcoes: ['Lona PVC', 'Fibra de vidro', 'Alumínio', 'ABS', 'Aço'], permiteValorLivre: true, obrigatorio: true, ordem: 2 },
  { key: 'cor', label: 'Cor', tipo: 'text', placeholder: 'Preto texturizado', ordem: 3 },
  { key: 'compativelSantantonio', label: 'Compatível com santantônio', tipo: 'boolean', ordem: 4 },
  { key: 'travamento', label: 'Sistema de travamento', tipo: 'text', placeholder: 'Trava com chave nas laterais', ordem: 5 },
  campoMarcas(6),
  campoModelos(7),
  campoAnos(8),
  campoGarantia(9),
  campoObservacoes(10)
];

const CAMPOS_FIXACAO: CampoFichaTecnica[] = [
  {
    key: 'tipoFixacao',
    label: 'Tipo de item',
    tipo: 'select',
    opcoes: ['Porca de roda', 'Parafuso de roda', 'Porca antifurto', 'Prisioneiro', 'Espaçador', 'Adaptador de furação', 'Kit completo'],
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  { key: 'rosca', label: 'Rosca', tipo: 'select', opcoes: ['M12x1.25', 'M12x1.5', 'M12x1.75', 'M14x1.5', 'M14x2.0', '1/2" UNF', '9/16" UNF'], permiteValorLivre: true, obrigatorio: true, ordem: 2, destaqueNoCard: true },
  { key: 'medidaChave', label: 'Medida da chave', tipo: 'text', placeholder: '21 mm', ordem: 3 },
  { key: 'assento', label: 'Tipo de assento', tipo: 'select', opcoes: ['Cônico 60°', 'Esférico / bola', 'Plano com arruela'], ordem: 4 },
  { key: 'comprimento', label: 'Comprimento', tipo: 'text', placeholder: '45 mm', ordem: 5 },
  { key: 'pecasPorEmbalagem', label: 'Peças por embalagem', tipo: 'number', obrigatorio: true, ordem: 6 },
  campoFuracao(7, false),
  campoMarcas(8, false),
  campoGarantia(9, false),
  campoObservacoes(10)
];

const CAMPOS_LUBRIFICANTES: CampoFichaTecnica[] = [
  {
    key: 'tipoFluido',
    label: 'Tipo de fluido',
    tipo: 'select',
    opcoes: ['Óleo de motor', 'Óleo de câmbio', 'Óleo de diferencial', 'Fluido de freio', 'Fluido de arrefecimento', 'Graxa', 'Aditivo', 'Combustível'],
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  { key: 'viscosidade', label: 'Viscosidade / especificação', tipo: 'text', placeholder: '15W40 API CK-4', obrigatorio: true, ordem: 2, destaqueNoCard: true },
  { key: 'volume', label: 'Volume da embalagem', tipo: 'text', placeholder: '1 litro', obrigatorio: true, ordem: 3 },
  { key: 'base', label: 'Base', tipo: 'select', opcoes: ['Mineral', 'Semissintético', 'Sintético'], ordem: 4 },
  { key: 'fabricante', label: 'Fabricante', tipo: 'text', ordem: 5 },
  { key: 'validade', label: 'Validade', tipo: 'text', placeholder: '36 meses a partir da fabricação', ordem: 6 },
  campoObservacoes(7)
];

const CAMPOS_CONSUMO: CampoFichaTecnica[] = [
  { key: 'aplicacao', label: 'Aplicação / finalidade', tipo: 'text', obrigatorio: true, ordem: 1, destaqueNoCard: true },
  { key: 'material', label: 'Material', tipo: 'text', ordem: 2 },
  { key: 'medidas', label: 'Medidas', tipo: 'text', ordem: 3 },
  { key: 'pecasPorEmbalagem', label: 'Peças por embalagem', tipo: 'number', ordem: 4 },
  { key: 'usoInterno', label: 'Uso interno (não vender no site)', tipo: 'boolean', ajuda: 'Marque para itens de consumo da oficina que não devem ser vendidos.', ordem: 5 },
  campoObservacoes(6)
];

const CAMPOS_USADOS: CampoFichaTecnica[] = [
  {
    key: 'estadoConservacao',
    label: 'Estado de conservação',
    tipo: 'select',
    opcoes: ['Seminovo — excelente', 'Bom estado', 'Estado regular', 'Com avarias estéticas', 'Para reforma'],
    obrigatorio: true,
    ordem: 1,
    destaqueNoCard: true,
    filtravel: true
  },
  { key: 'percentualVidaUtil', label: 'Vida útil restante', tipo: 'text', placeholder: '70% de banda', obrigatorio: true, ordem: 2, destaqueNoCard: true },
  { key: 'procedencia', label: 'Procedência', tipo: 'select', opcoes: ['Recebido em troca', 'Retirado de veículo zero km', 'Mostruário', 'Reforma própria'], ordem: 3 },
  { key: 'avarias', label: 'Avarias declaradas', tipo: 'textarea', placeholder: 'Descreva riscos, amassados ou reparos. Transparência evita disputa pós-venda.', obrigatorio: true, ordem: 4 },
  { key: 'aro', label: 'Aro', tipo: 'select', opcoes: AROS_DISPONIVEIS, permiteValorLivre: true, ordem: 5, filtravel: true },
  campoFuracao(6, false),
  { key: 'medidaPneu', label: 'Medida (se pneu)', tipo: 'text', ordem: 7 },
  campoMarcas(8, false),
  campoModelos(9),
  campoGarantia(10),
  campoObservacoes(11)
];

const CAMPOS_OUTROS: CampoFichaTecnica[] = [
  { key: 'aplicacao', label: 'Aplicação / finalidade', tipo: 'text', obrigatorio: true, ordem: 1, destaqueNoCard: true },
  { key: 'especificacao', label: 'Especificação técnica', tipo: 'textarea', ordem: 2 },
  { key: 'medidas', label: 'Medidas', tipo: 'text', ordem: 3 },
  campoMarcas(4, false),
  campoModelos(5),
  campoGarantia(6, false),
  campoObservacoes(7)
];

/** Campos por grupo — todo produto herda o schema do grupo da sua categoria. */
export const CAMPOS_POR_GRUPO: Record<GrupoCategoria, CampoFichaTecnica[]> = {
  rodas: CAMPOS_RODAS,
  pneus: CAMPOS_PNEUS,
  'kits-lift': CAMPOS_KITS_LIFT,
  acessorios: CAMPOS_ACESSORIOS,
  pecas: CAMPOS_PECAS,
  iluminacao: CAMPOS_ILUMINACAO,
  engate: CAMPOS_ENGATE,
  capota: CAMPOS_CAPOTA,
  fixacao: CAMPOS_FIXACAO,
  lubrificantes: CAMPOS_LUBRIFICANTES,
  consumo: CAMPOS_CONSUMO,
  usados: CAMPOS_USADOS,
  outros: CAMPOS_OUTROS
};

export const ROTULO_GRUPO: Record<GrupoCategoria, string> = {
  rodas: 'Rodas & Calotas',
  pneus: 'Pneus & Câmeras',
  'kits-lift': 'Kits de Lift & Alargadores',
  acessorios: 'Acessórios 4x4',
  pecas: 'Peças',
  iluminacao: 'Iluminação',
  engate: 'Engates & Reboque',
  capota: 'Capotas',
  fixacao: 'Porcas & Parafusos',
  lubrificantes: 'Combustíveis & Lubrificantes',
  consumo: 'Material de Consumo',
  usados: 'Usados & Seminovos',
  outros: 'Outras Mercadorias'
};

// ---------------------------------------------------------------------------
// TipoProduto_Descricao (ERP) → grupo do site
// ---------------------------------------------------------------------------

interface RegraGrupo {
  padrao: RegExp;
  grupo: GrupoCategoria;
  ordem: number;
  visivelNoSite: boolean;
}

/**
 * Avaliadas em ordem — a primeira que casar vence.
 * Regras de "usado" vêm antes das genéricas para não classificar roda usada como roda nova.
 */
const REGRAS_GRUPO: RegraGrupo[] = [
  { padrao: /usad|recebid|seminov/i, grupo: 'usados', ordem: 90, visivelNoSite: true },
  // Antes de "roda" de propósito: "ACESSORIOS PDV RODAS" é acessório, não roda.
  { padrao: /acessori|acessór|compressor/i, grupo: 'acessorios', ordem: 40, visivelNoSite: true },
  { padrao: /pneu|camera|câmera/i, grupo: 'pneus', ordem: 10, visivelNoSite: true },
  { padrao: /roda|calota/i, grupo: 'rodas', ordem: 20, visivelNoSite: true },
  { padrao: /alargador|kit\s*trans|lift|calc|calç/i, grupo: 'kits-lift', ordem: 30, visivelNoSite: true },
  { padrao: /ilumina|farol|led/i, grupo: 'iluminacao', ordem: 50, visivelNoSite: true },
  { padrao: /engate|reboque/i, grupo: 'engate', ordem: 60, visivelNoSite: true },
  { padrao: /capota|maritima|marítima/i, grupo: 'capota', ordem: 55, visivelNoSite: true },
  { padrao: /porca|parafuso|prisioneiro/i, grupo: 'fixacao', ordem: 70, visivelNoSite: true },
  { padrao: /combustivel|combustível|lubrific|oleo|óleo|graxa/i, grupo: 'lubrificantes', ordem: 80, visivelNoSite: false },
  { padrao: /consumo/i, grupo: 'consumo', ordem: 95, visivelNoSite: false },
  { padrao: /pec|peç/i, grupo: 'pecas', ordem: 45, visivelNoSite: true }
];

export function classificarTipoProduto(tipoProduto: string): {
  grupo: GrupoCategoria;
  ordem: number;
  visivelNoSite: boolean;
} {
  const valor = (tipoProduto || '').trim();
  for (const regra of REGRAS_GRUPO) {
    if (regra.padrao.test(valor)) {
      return { grupo: regra.grupo, ordem: regra.ordem, visivelNoSite: regra.visivelNoSite };
    }
  }
  return { grupo: 'outros', ordem: 100, visivelNoSite: true };
}

/**
 * Monta o documento de categoria a partir de um TipoProduto_Descricao da planilha.
 * Chamado pela importação sempre que aparece um tipo ainda não cadastrado.
 */
export function construirCategoria(tipoProduto: string): CategoriaCatalogo {
  const { grupo, ordem, visivelNoSite } = classificarTipoProduto(tipoProduto);
  const agora = new Date().toISOString();
  return {
    slug: slugify(tipoProduto),
    nomeOriginal: tipoProduto,
    nomeExibicao: humanizar(tipoProduto),
    grupo,
    descricao: `Categoria gerada a partir do tipo de produto "${tipoProduto}" da planilha do ERP.`,
    ordem,
    visivelNoSite,
    campos: CAMPOS_POR_GRUPO[grupo],
    criadoEm: agora,
    atualizadoEm: agora
  };
}

// ---------------------------------------------------------------------------
// Unidades
// ---------------------------------------------------------------------------

export const UNIDADES: Record<string, { singular: string; plural: string; descricao: string }> = {
  UN: { singular: 'unidade', plural: 'unidades', descricao: 'Vendido por unidade' },
  PR: { singular: 'par', plural: 'pares', descricao: 'Vendido em par (2 peças)' },
  JG: { singular: 'jogo', plural: 'jogos', descricao: 'Vendido em jogo completo' },
  KT: { singular: 'kit', plural: 'kits', descricao: 'Vendido em kit' },
  PC: { singular: 'peça', plural: 'peças', descricao: 'Vendido por peça' },
  CJ: { singular: 'conjunto', plural: 'conjuntos', descricao: 'Vendido em conjunto' },
  LT: { singular: 'litro', plural: 'litros', descricao: 'Vendido por litro' },
  MT: { singular: 'metro', plural: 'metros', descricao: 'Vendido por metro' },
  CX: { singular: 'caixa', plural: 'caixas', descricao: 'Vendido em caixa fechada' },
  PT: { singular: 'pacote', plural: 'pacotes', descricao: 'Vendido em pacote' },
  SR: { singular: 'serviço', plural: 'serviços', descricao: 'Serviço prestado' }
};

export function rotularUnidade(sigla: string, quantidade = 1): string {
  const info = UNIDADES[(sigla || '').toUpperCase().trim()];
  if (!info) return (sigla || 'UN').toUpperCase();
  return quantidade === 1 ? info.singular : info.plural;
}

export function descreverUnidade(sigla: string): string {
  const info = UNIDADES[(sigla || '').toUpperCase().trim()];
  return info ? info.descricao : `Unidade "${sigla}"`;
}

/** Percentual de preenchimento da ficha técnica, considerando só campos obrigatórios. */
export function calcularCompletudeFicha(
  campos: CampoFichaTecnica[],
  ficha: Record<string, unknown>
): number {
  const obrigatorios = campos.filter((c) => c.obrigatorio);
  if (obrigatorios.length === 0) return 100;
  const preenchidos = obrigatorios.filter((c) => {
    const valor = ficha?.[c.key];
    if (Array.isArray(valor)) return valor.length > 0;
    if (typeof valor === 'boolean') return true;
    if (typeof valor === 'number') return Number.isFinite(valor);
    return typeof valor === 'string' && valor.trim().length > 0;
  });
  return Math.round((preenchidos.length / obrigatorios.length) * 100);
}
