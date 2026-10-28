import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Demasiados intentos de inicio de sesión. Inténtelo nuevamente en unos minutos.',
  },
});
