import { z } from 'zod';

export const CheckoutItemSchema = z.object({
  sku: z.string().trim().min(1, 'SKU do item é obrigatório'),
  quantity: z.number().int().positive('Quantidade do item deve ser pelo menos 1'),
});

export const SplitFeeRequestSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'A lista de itens não pode estar vazia'),
  gatewayFeePercentage: z
    .number()
    .min(0, 'Taxa do gateway não pode ser negativa')
    .max(10, 'Taxa do gateway não pode exceder 10%')
    .default(2.5), // Ex: 2.5%
  partnerCommissionPercentage: z
    .number()
    .min(0, 'Comissão de parceiro não pode ser negativa')
    .max(50, 'Comissão de parceiro não pode exceder 50%')
    .default(5.0), // Ex: 5.0% para o vendedor/parceiro
});

export type SplitFeeRequest = z.infer<typeof SplitFeeRequestSchema>;
