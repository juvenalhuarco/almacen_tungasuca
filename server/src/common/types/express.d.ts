import { RoleName } from '../../database/entities/role.entity';

export interface AuthenticatedUser {
  id: number;
  username: string;
  fullName: string;
  role: RoleName;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
