import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { RoleName } from '../../database/entities/role.entity';

export interface AccessTokenPayload {
  sub: number;
  username: string;
  name: string;
  role: RoleName;
}

export interface RefreshTokenPayload {
  sub: number;
  remember: boolean;
}

type Expires = SignOptions['expiresIn'];

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires as Expires,
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const expiresIn = payload.remember ? env.jwt.refreshExpiresRemember : env.jwt.refreshExpires;
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: expiresIn as Expires });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwt.accessSecret) as jwt.JwtPayload;
  return {
    sub: Number(decoded.sub),
    username: String(decoded.username),
    name: String(decoded.name),
    role: decoded.role as RoleName,
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.jwt.refreshSecret) as jwt.JwtPayload;
  return { sub: Number(decoded.sub), remember: Boolean(decoded.remember) };
}

export function expiresToMs(expression: string): number {
  const match = /^(\d+)([smhd])$/.exec(expression.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}
