import 'dotenv/config';

export const port = Number(process.env.PORT || 4000);
export const accessSecret = process.env.JWT_ACCESS_SECRET || 'local-access-secret-change-me';
export const refreshSecret = process.env.JWT_REFRESH_SECRET || 'local-refresh-secret-change-me';
if (process.env.NODE_ENV === 'production' && (accessSecret === 'local-access-secret-change-me' || refreshSecret === 'local-refresh-secret-change-me')) {
  throw new Error('JWT secrets must be set via env in production');
}
export const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const mongodbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pillsync';
export const ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://127.0.0.1:8001';
export const ocrInternalToken = process.env.OCR_INTERNAL_TOKEN || 'local-ocr-token';
