import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { dbClient } from '../services/dbClient.js';
import { ProductWriteSchema } from '../schemas/productSchema.js';
import { Product } from '../types/index.js';

const sendZodError = (res: Response, error: ZodError): void => {
  res.status(400).json({
    status: 'error',
    code: 'INVALID_PRODUCT_PAYLOAD',
    message: 'Dados do produto inválidos.',
    details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
  });
};

/** Lista o catálogo completo, incluindo itens desativados (visão do painel). */
export const listAllProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await dbClient.listProducts();
    res.status(200).json({ status: 'success', data: products, meta: { count: products.length } });
  } catch (error) {
    console.error('❌ Falha ao listar produtos:', error);
    res.status(500).json({ status: 'error', code: 'LIST_FAILED', message: 'Falha ao listar produtos.' });
  }
};

/**
 * Cria ou atualiza um produto pelo SKU.
 *
 * rating e reviewsCount não vêm do cliente: são preservados do que já está
 * gravado (ou zerados na criação), senão o painel poderia forjar a reputação
 * do produto.
 */
export const upsertProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const input = ProductWriteSchema.parse(req.body);
    const existing = await dbClient.findBySku(input.sku);

    const product: Product = {
      ...input,
      id: existing?.id ?? input.sku,
      inStock: input.stockQuantity > 0,
      rating: existing?.rating ?? 0,
      reviewsCount: existing?.reviewsCount ?? 0
    };

    const record = await dbClient.saveProduct(product);
    res.status(existing ? 200 : 201).json({
      status: 'success',
      action: existing ? 'UPDATED' : 'CREATED',
      data: record
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendZodError(res, error);
      return;
    }
    console.error('❌ Falha ao gravar produto:', error);
    res.status(500).json({ status: 'error', code: 'SAVE_FAILED', message: 'Falha ao gravar o produto.' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sku } = req.params;
    const removed = await dbClient.deleteBySku(sku);

    if (!removed) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: `SKU "${sku}" não encontrado.` });
      return;
    }

    res.status(200).json({ status: 'success', data: { sku } });
  } catch (error) {
    console.error('❌ Falha ao remover produto:', error);
    res.status(500).json({ status: 'error', code: 'DELETE_FAILED', message: 'Falha ao remover o produto.' });
  }
};
