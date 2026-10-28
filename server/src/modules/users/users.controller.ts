import { Request, Response } from 'express';
import { usersService } from './users.service';
import {
  Validator,
  DNI_PATTERN,
  USERNAME_PATTERN,
  PASSWORD_MIN_LENGTH,
} from '../../common/utils/validator';
import {
  parsePagination,
  parseBoolean,
  parseInteger,
  parseString,
} from '../../common/utils/pagination';
import { getClientIp } from '../../common/utils/request';
import { NotFoundError } from '../../common/errors/app-error';

function parseId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Usuario');
  return id;
}

function actor(req: Request) {
  return { id: req.user!.id, ip: getClientIp(req) };
}

export class UsersController {
  async list(req: Request, res: Response): Promise<void> {
    const result = await usersService.list(
      {
        search: parseString(req.query.search),
        roleId: parseInteger(req.query.roleId),
        active: parseBoolean(req.query.active),
      },
      parsePagination(req.query),
    );
    res.json(result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    res.json(await usersService.getById(parseId(req)));
  }

  async create(req: Request, res: Response): Promise<void> {
    const v = new Validator({
      ...(req.body ?? {}),
      username: String(req.body?.username ?? '').toLowerCase(),
    });
    const username = v.string('username', {
      required: true,
      pattern: USERNAME_PATTERN,
      patternMessage:
        'Use de 3 a 30 caracteres: letras minúsculas, números, punto, guion o guion bajo',
    });
    const dni = v.string('dni', {
      required: true,
      pattern: DNI_PATTERN,
      patternMessage: 'El DNI debe tener 8 dígitos',
    });
    const firstName = v.string('firstName', { required: true, maxLength: 100 });
    const lastName = v.string('lastName', { required: true, maxLength: 100 });
    const email = v.string('email', { email: true, maxLength: 150 });
    const phone = v.string('phone', { maxLength: 20 });
    const password = v.string('password', { required: true, minLength: PASSWORD_MIN_LENGTH });
    const roleId = v.number('roleId', { required: true, integer: true, min: 1 });
    v.throwIfInvalid();

    const user = await usersService.create(
      {
        username: username!,
        dni: dni!,
        firstName: firstName!,
        lastName: lastName!,
        email,
        phone,
        password: password!,
        roleId: roleId!,
      },
      actor(req),
    );
    res.status(201).json(user);
  }

  async update(req: Request, res: Response): Promise<void> {
    const v = new Validator(req.body ?? {});
    const dni = v.string('dni', {
      pattern: DNI_PATTERN,
      patternMessage: 'El DNI debe tener 8 dígitos',
    });
    const firstName = v.string('firstName', { maxLength: 100 });
    const lastName = v.string('lastName', { maxLength: 100 });
    const email = v.string('email', { email: true, maxLength: 150 });
    const phone = v.string('phone', { maxLength: 20 });
    const roleId = v.number('roleId', { integer: true, min: 1 });
    v.throwIfInvalid();

    const body = req.body ?? {};
    const user = await usersService.update(
      parseId(req),
      {
        dni,
        firstName,
        lastName,
        email: 'email' in body ? (email ?? null) : undefined,
        phone: 'phone' in body ? (phone ?? null) : undefined,
        roleId,
      },
      actor(req),
    );
    res.json(user);
  }

  async setActive(req: Request, res: Response): Promise<void> {
    const v = new Validator(req.body ?? {});
    const active = v.boolean('active', { required: true });
    v.throwIfInvalid();

    res.json(await usersService.setActive(parseId(req), active!, actor(req)));
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const v = new Validator(req.body ?? {});
    const newPassword = v.string('newPassword', { required: true, minLength: PASSWORD_MIN_LENGTH });
    v.throwIfInvalid();

    await usersService.resetPassword(parseId(req), newPassword!, actor(req));
    res.json({ message: 'Contraseña restablecida correctamente' });
  }
}

export const usersController = new UsersController();
