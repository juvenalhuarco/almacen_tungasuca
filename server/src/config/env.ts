import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function optional(name: string, fallback = ''): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const nodeEnv = optional('NODE_ENV', 'development');

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: toNumber(optional('PORT', '4000'), 4000),
  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),

  db: {
    url: optional('DATABASE_URL'),
    host: optional('DB_HOST', 'localhost'),
    port: toNumber(optional('DB_PORT', '5432'), 5432),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', ''),
    name: optional('DB_NAME', 'almacen_tungasuca'),
    ssl: optional('DB_SSL', 'false') === 'true',
    logging: optional('DB_LOGGING', 'false') === 'true',
  },

  jwt: {
    accessSecret: optional('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    accessExpires: optional('JWT_ACCESS_EXPIRES', '15m'),
    refreshSecret: optional('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    refreshExpires: optional('JWT_REFRESH_EXPIRES', '7d'),
    refreshExpiresRemember: optional('JWT_REFRESH_EXPIRES_REMEMBER', '30d'),
  },

  company: {
    name: optional('COMPANY_NAME', 'Consorcio Tungasuca'),
    ruc: optional('COMPANY_RUC'),
    address: optional('COMPANY_ADDRESS'),
    phone: optional('COMPANY_PHONE'),
    email: optional('COMPANY_EMAIL'),
  },

  smtp: {
    host: optional('SMTP_HOST'),
    port: toNumber(optional('SMTP_PORT', '587'), 587),
    secure: optional('SMTP_SECURE', 'false') === 'true',
    user: optional('SMTP_USER'),
    password: optional('SMTP_PASSWORD'),
    from: optional('SMTP_FROM', 'Almacén Tungasuca <no-reply@tungasuca.pe>'),
    recipients: toList(optional('ALERT_EMAIL_RECIPIENTS')),
  },

  stockCheckCron: optional('STOCK_CHECK_CRON', '0 7 * * *'),
};

export const isSmtpEnabled = (): boolean => env.smtp.host !== '' && env.smtp.recipients.length > 0;
