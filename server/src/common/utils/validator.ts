import { ValidationError } from '../errors/app-error';

type Rules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  min?: number;
  max?: number;
  integer?: boolean;
  oneOf?: readonly string[];
  email?: boolean;
};

export class Validator {
  private readonly errors: Record<string, string> = {};

  constructor(private readonly body: Record<string, any>) {}

  string(field: string, rules: Rules = {}): string | undefined {
    const raw = this.body[field];
    if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
      if (rules.required) this.errors[field] = 'Este campo es obligatorio';
      return undefined;
    }
    if (typeof raw !== 'string') {
      this.errors[field] = 'Debe ser un texto';
      return undefined;
    }
    const value = raw.trim();
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      this.errors[field] = `Debe tener al menos ${rules.minLength} caracteres`;
    } else if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      this.errors[field] = `Debe tener como máximo ${rules.maxLength} caracteres`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      this.errors[field] = rules.patternMessage ?? 'El formato no es válido';
    } else if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.errors[field] = 'Debe ser un correo electrónico válido';
    } else if (rules.oneOf && !rules.oneOf.includes(value)) {
      this.errors[field] = `Debe ser uno de: ${rules.oneOf.join(', ')}`;
    }
    return value;
  }

  number(field: string, rules: Rules = {}): number | undefined {
    const raw = this.body[field];
    if (raw === undefined || raw === null || raw === '') {
      if (rules.required) this.errors[field] = 'Este campo es obligatorio';
      return undefined;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      this.errors[field] = 'Debe ser un número';
      return undefined;
    }
    if (rules.integer && !Number.isInteger(value)) {
      this.errors[field] = 'Debe ser un número entero';
    } else if (rules.min !== undefined && value < rules.min) {
      this.errors[field] = `Debe ser mayor o igual a ${rules.min}`;
    } else if (rules.max !== undefined && value > rules.max) {
      this.errors[field] = `Debe ser menor o igual a ${rules.max}`;
    }
    return value;
  }

  boolean(field: string, rules: Rules = {}): boolean | undefined {
    const raw = this.body[field];
    if (raw === undefined || raw === null) {
      if (rules.required) this.errors[field] = 'Este campo es obligatorio';
      return undefined;
    }
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    this.errors[field] = 'Debe ser verdadero o falso';
    return undefined;
  }

  date(field: string, rules: Rules = {}): Date | undefined {
    const raw = this.body[field];
    if (raw === undefined || raw === null || raw === '') {
      if (rules.required) this.errors[field] = 'Este campo es obligatorio';
      return undefined;
    }
    const value = new Date(raw);
    if (Number.isNaN(value.getTime())) {
      this.errors[field] = 'Debe ser una fecha válida';
      return undefined;
    }
    return value;
  }

  array<T = any>(field: string, rules: Rules & { minItems?: number } = {}): T[] | undefined {
    const raw = this.body[field];
    if (raw === undefined || raw === null) {
      if (rules.required) this.errors[field] = 'Este campo es obligatorio';
      return undefined;
    }
    if (!Array.isArray(raw)) {
      this.errors[field] = 'Debe ser una lista';
      return undefined;
    }
    if (rules.minItems !== undefined && raw.length < rules.minItems) {
      this.errors[field] = `Debe contener al menos ${rules.minItems} elemento(s)`;
    }
    return raw as T[];
  }

  addError(field: string, message: string): void {
    this.errors[field] = message;
  }

  get hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  throwIfInvalid(): void {
    if (this.hasErrors) throw new ValidationError(this.errors);
  }
}

export const DNI_PATTERN = /^[0-9]{8}$/;
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
export const RUC_PATTERN = /^[0-9]{11}$/;
export const PASSWORD_MIN_LENGTH = 8;
