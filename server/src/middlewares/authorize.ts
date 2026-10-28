import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../common/errors/app-error';
import { RoleName } from '../database/entities/role.entity';

export function authorize(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}

export const adminOnly = authorize(RoleName.ADMIN);
