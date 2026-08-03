import { Request, Response } from 'express';
import { SplitFeeRequestSchema } from '../schemas/checkoutSchema.js';
import { splitFeeService } from '../services/splitFeeService.js';

export const handleCalculateSplitFee = async (req: Request, res: Response): Promise<void> => {
  try {
    // Sanitização e validação de payload Zod
    const validatedBody = SplitFeeRequestSchema.parse(req.body);

    const calculationResult = await splitFeeService.calculateOrderSplit(validatedBody);

    res.status(200).json({
      status: 'success',
      message: 'Cálculo de Split-Fee financeiro processado com sucesso pelo servidor.',
      data: calculationResult,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_CHECKOUT_PAYLOAD',
        message: 'Estrutura dos itens do pedido ou regras de split inválidas.',
        details: error.errors,
      });
      return;
    }

    res.status(400).json({
      status: 'error',
      code: 'SPLIT_FEE_CALCULATION_FAILED',
      message: error.message || 'Falha ao calcular divisão financeira do pedido.',
    });
  }
};
