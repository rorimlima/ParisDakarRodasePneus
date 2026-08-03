import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    export interface Request {
      user?: DecodedIdToken & {
        role?: 'admin' | 'client' | string;
      };
    }
  }
}
