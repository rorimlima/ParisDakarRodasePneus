import { z } from 'zod';

/**
 * Esquema de Validação Zod Rígido para Importação de Produtos (Excel/CSV)
 * Valida a tipagem exata, formatação de números e previne injeção ou valores corrompidos.
 */
export const ProductImportRowSchema = z.object({
  sku: z
    .string({ required_error: 'O código SKU é obrigatório' })
    .trim()
    .min(3, 'O SKU deve ter pelo menos 3 caracteres')
    .max(50, 'O SKU não pode ter mais de 50 caracteres')
    .regex(/^[A-Za-z0-9\-_]+$/, 'SKU contém caracteres inválidos (permitido apenas letras, números, hífen e underline)'),

  name: z
    .string({ required_error: 'O nome da roda/pneu é obrigatório' })
    .trim()
    .min(2, 'O nome deve conter pelo menos 2 caracteres')
    .max(150, 'O nome excedeu o tamanho máximo de 150 caracteres'),

  category: z
    .string({ required_error: 'A categoria é obrigatória' })
    .trim()
    .toUpperCase()
    .transform((val) => {
      if (['RODA', 'RODAS'].includes(val)) return 'RODA';
      if (['PNEU', 'PNEUS'].includes(val)) return 'PNEU';
      return 'ACESSORIO';
    }),

  brand: z
    .string({ required_error: 'A marca é obrigatória' })
    .trim()
    .min(1, 'A marca não pode estar em branco'),

  price: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/[R$\s]/g, '').trim();
        if (!cleaned) return undefined;

        // Se contiver tanto ponto quanto vírgula (ex: 3.950,00 ou 3,950.00)
        if (cleaned.includes('.') && cleaned.includes(',')) {
          if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
            // Formato PT-BR: 3.950,00 -> 3950.00
            return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
          } else {
            // Formato EN-US: 3,950.00 -> 3950.00
            return parseFloat(cleaned.replace(/,/g, ''));
          }
        }

        // Se contiver apenas vírgula (ex: 3950,00 -> 3950.00)
        if (cleaned.includes(',')) {
          return parseFloat(cleaned.replace(',', '.'));
        }

        return parseFloat(cleaned);
      }
      return val;
    },
    z.number({ invalid_type_error: 'Preço deve ser um número decimal válido' })
      .positive('Preço deve ser um valor maior que zero')
  ),

  stockQuantity: z.preprocess(
    (val) => {
      if (typeof val === 'number') return Math.floor(val);
      if (typeof val === 'string') return parseInt(val.trim(), 10);
      return val;
    },
    z.number({ invalid_type_error: 'Quantidade em estoque deve ser um número inteiro' })
      .int('Quantidade em estoque deve ser um número inteiro')
      .min(0, 'Quantidade em estoque não pode ser negativa')
  ),

  rimSize: z.preprocess(
    (val) => (val ? String(val).trim() : undefined),
    z.string().optional()
  ),

  width: z.preprocess(
    (val) => (val ? String(val).trim() : undefined),
    z.string().optional()
  ),

  aspectRatio: z.preprocess(
    (val) => (val ? String(val).trim() : undefined),
    z.string().optional()
  ),
});

export type ProductImportRow = z.infer<typeof ProductImportRowSchema>;

/**
 * Schema para busca/consulta com filtro de atualização delta (Delta Sync)
 */
export const DeltaSyncQuerySchema = z.object({
  updatedSince: z
    .string()
    .datetime({ message: 'Parâmetro updatedSince deve estar em formato ISO 8601 (Ex: 2026-08-01T00:00:00.000Z)' })
    .optional(),
  limit: z.preprocess(
    (val) => (val ? parseInt(String(val), 10) : 50),
    z.number().int().positive().max(500).default(50)
  ),
  offset: z.preprocess(
    (val) => (val ? parseInt(String(val), 10) : 0),
    z.number().int().min(0).default(0)
  ),
});

/**
 * Schema de escrita do produto completo (painel administrativo).
 *
 * Diferente de ProductImportRowSchema, que valida a linha reduzida da
 * planilha, este cobre o produto como a loja o exibe. Campos de reputação
 * (rating, reviewsCount) e o id não entram: são definidos pelo servidor,
 * senão o cliente conseguiria forjar a própria nota.
 */
export const ProductSpecsSchema = z.object({
  aro: z.string().trim().max(20).optional(),
  furacao: z.string().trim().max(30).optional(),
  offset: z.string().trim().max(30).optional(),
  tala: z.string().trim().max(20).optional(),
  acabamento: z.string().trim().max(60).optional(),
  medidaPneu: z.string().trim().max(40).optional(),
  tipoPneu: z.enum(['MT', 'AT', 'LT', 'HT']).optional(),
  indiceCarga: z.string().trim().max(20).optional(),
  alturaLift: z.string().trim().max(30).optional(),
  garantia: z.string().trim().max(40).optional(),
  peso: z.string().trim().max(20).optional()
});

export const ProductWriteSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[A-Za-z0-9\-_]+$/, 'SKU aceita apenas letras, números, hífen e underline'),
  name: z.string().trim().min(2).max(150),
  brand: z.string().trim().min(1).max(80),
  category: z.enum(['rodas', 'pneus', 'kits-lift', 'acessorios', 'combos']),
  subcategory: z.string().trim().max(80).optional(),
  price: z.number().positive('Preço deve ser maior que zero'),
  originalPrice: z.number().positive().optional(),
  b2bPrice: z.number().positive().optional(),
  isWholesaleOnly: z.boolean().optional(),
  badge: z.string().trim().max(40).optional(),
  // URLs de imagem restritas a http(s) para não aceitar javascript: nem data:
  image: z.string().trim().url('Imagem deve ser uma URL http(s) válida').startsWith('http', 'Somente URLs http(s)'),
  secondaryImages: z.array(z.string().url().startsWith('http')).max(8).optional(),
  description: z.string().trim().max(2000).default(''),
  specs: ProductSpecsSchema.default({}),
  compatibleVehicles: z.array(z.string().trim().max(120)).max(60).default([]),
  stockQuantity: z.number().int().min(0),
  isActive: z.boolean().default(true)
});

export type ProductWriteInput = z.infer<typeof ProductWriteSchema>;
