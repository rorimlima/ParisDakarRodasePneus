import { Request, Response } from 'express';
import { catalogService } from '../services/catalogService.js';

export const getCatalogProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const deltaSyncData = await catalogService.getProductsDeltaSync(req.query);

    // Validação de ETag para resposta HTTP 304 Not Modified (Economia de banda em PWA/Offline-first)
    const clientETag = req.headers['if-none-match'];
    if (clientETag && clientETag === deltaSyncData.meta.eTag) {
      res.setHeader('ETag', deltaSyncData.meta.eTag);
      res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
      res.status(304).end();
      return;
    }

    // Configuração dos cabeçalhos de resposta HTTP para suporte a cache cliente inteligente
    res.setHeader('ETag', deltaSyncData.meta.eTag);
    res.setHeader('Last-Modified', deltaSyncData.meta.serverTimestamp);
    res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');

    res.status(200).json({
      status: 'success',
      data: deltaSyncData.products,
      meta: deltaSyncData.meta,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_QUERY_PARAMS',
        message: 'Parâmetros de busca inválidos.',
        details: error.errors,
      });
      return;
    }

    console.error('❌ Erro na consulta do catálogo:', error);
    res.status(500).json({
      status: 'error',
      code: 'CATALOG_FETCH_FAILED',
      message: 'Falha ao buscar catálogo de produtos.',
    });
  }
};
