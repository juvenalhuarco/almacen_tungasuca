import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../common/errors/app-error';
import { verifyAccessToken } from '../modules/auth/token.service';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acceso no proporcionado');
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username,
      fullName: payload.name,
      role: payload.role,
    };
    next();
  } catch {
    throw new UnauthorizedError('Token de acceso inválido o expirado');
  }
}
