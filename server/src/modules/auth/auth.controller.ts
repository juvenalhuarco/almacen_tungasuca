import { CookieOptions, Request, Response } from 'express';
import { authService } from './auth.service';
import { Validator, PASSWORD_MIN_LENGTH } from '../../common/utils/validator';
import { getClientIp } from '../../common/utils/request';
import { env } from '../../config/env';

export const REFRESH_COOKIE = 'refresh_token';

function refreshCookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const validator = new Validator(req.body ?? {});
    const username = validator.string('username', { required: true, maxLength: 30 });
    const password = validator.string('password', { required: true });
    const remember = validator.boolean('remember') ?? false;
    validator.throwIfInvalid();

    const result = await authService.login(username!, password!, remember, getClientIp(req));

    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(result.refreshMaxAge));
    res.json({ accessToken: result.accessToken, user: result.user });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const result = await authService.refresh(token);

    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(result.refreshMaxAge));
    res.json({ accessToken: result.accessToken, user: result.user });
  }

  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.user?.id, getClientIp(req));
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    res.status(204).send();
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.me(req.user!.id);
    res.json(user);
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const validator = new Validator(req.body ?? {});
    const currentPassword = validator.string('currentPassword', { required: true });
    const newPassword = validator.string('newPassword', {
      required: true,
      minLength: PASSWORD_MIN_LENGTH,
    });
    validator.throwIfInvalid();

    await authService.changePassword(
      req.user!.id,
      currentPassword!,
      newPassword!,
      getClientIp(req),
    );
    res.json({ message: 'Contraseña actualizada correctamente' });
  }
}

export const authController = new AuthController();
