import { dbClient } from './dbClient.js';
import { SplitFeeRequest } from '../schemas/checkoutSchema.js';

export interface SplitFeeItemResult {
  sku: string;
  name: string;
  unitPrice: number; // Em Reais
  quantity: number;
  totalPriceCents: number;
}

export interface SplitFeeCalculationResult {
  items: SplitFeeItemResult[];
  financialBreakdown: {
    grossTotalCents: number;
    grossTotalReais: number;
    gatewayFeeCents: number;
    gatewayFeeReais: number;
    partnerCommissionCents: number;
    partnerCommissionReais: number;
    storeNetCents: number;
    storeNetReais: number;
  };
  splitRulesApplied: {
    gatewayFeePercentage: number;
    partnerCommissionPercentage: number;
  };
}

export class SplitFeeService {
  /**
   * Executa o cálculo autoritativo de Split-Fee no servidor
   * Impede adulteração de valores financeiros pelo cliente (Front-End)
   */
  public async calculateOrderSplit(requestData: SplitFeeRequest): Promise<SplitFeeCalculationResult> {
    const processedItems: SplitFeeItemResult[] = [];
    let grossTotalCents = 0;

    // Busca os preços autoritativos direto do banco de dados (ignorando qualquer valor enviado do front-end)
    for (const item of requestData.items) {
      const product = await dbClient.findBySku(item.sku);

      if (!product) {
        throw new Error(`Produto não encontrado para o SKU informado: '${item.sku}'`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `Estoque insuficiente para o produto '${product.name}' (SKU: ${product.sku}). Disponível: ${product.stockQuantity}, Solicitado: ${item.quantity}`
        );
      }

      // Cálculo em centavos para eliminar erros de precisão decimal de ponto flutuante
      const unitPriceCents = Math.round(product.price * 100);
      const itemTotalCents = unitPriceCents * item.quantity;
      grossTotalCents += itemTotalCents;

      processedItems.push({
        sku: product.sku,
        name: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        totalPriceCents: itemTotalCents,
      });
    }

    // Cálculo das frações do split-fee
    const gatewayFeeCents = Math.round((grossTotalCents * requestData.gatewayFeePercentage) / 100);
    const partnerCommissionCents = Math.round(
      (grossTotalCents * requestData.partnerCommissionPercentage) / 100
    );

    // Saldo líquido remanescente para a loja Paris Dakar Rodas
    const storeNetCents = grossTotalCents - gatewayFeeCents - partnerCommissionCents;

    return {
      items: processedItems,
      financialBreakdown: {
        grossTotalCents,
        grossTotalReais: grossTotalCents / 100,
        gatewayFeeCents,
        gatewayFeeReais: gatewayFeeCents / 100,
        partnerCommissionCents,
        partnerCommissionReais: partnerCommissionCents / 100,
        storeNetCents,
        storeNetReais: storeNetCents / 100,
      },
      splitRulesApplied: {
        gatewayFeePercentage: requestData.gatewayFeePercentage,
        partnerCommissionPercentage: requestData.partnerCommissionPercentage,
      },
    };
  }
}

export const splitFeeService = new SplitFeeService();
