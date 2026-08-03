import { onRequest } from 'firebase-functions/v2/https';
import app from './app.js';

/**
 * Cloud Function HTTPS Handler
 * Exporta a aplicação Express completa para rodar de forma serverless no Firebase Hosting e Cloud Functions.
 */
export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    cors: true,
  },
  app
);
