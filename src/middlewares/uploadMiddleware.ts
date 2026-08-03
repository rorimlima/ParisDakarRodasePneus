import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Armazenamento seguro exclusivamente em memória para evitar persistência indevida de arquivos temporários em disco
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
  'application/csv',
  'text/plain',
];

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extension = file.originalname.split('.').pop()?.toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || (extension && ['xlsx', 'xls', 'csv'].includes(extension))) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de arquivo não suportado ('${file.originalname}'). Envie apenas planilhas nos formatos .xlsx ou .csv.`
      )
    );
  }
};

export const uploadStockSpreadsheet = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite máximo de 10 MB por upload
    files: 1, // Apenas 1 arquivo por requisição
  },
  fileFilter,
}).single('file');

/**
 * Wrapper middleware para capturar e formatar erros do Multer
 */
export const handleUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  uploadStockSpreadsheet(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          status: 'error',
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo enviado excede o limite máximo permitido de 10MB.',
        });
        return;
      }
      res.status(400).json({
        status: 'error',
        code: 'UPLOAD_ERROR',
        message: `Erro no envio do arquivo: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_FILE_TYPE',
        message: err.message,
      });
      return;
    }
    next();
  });
};
