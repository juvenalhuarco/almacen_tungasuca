import { NextFunction, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../common/errors/app-error';
import { env } from '../config/env';
import { logger } from '../common/utils/logger';

interface PgError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  chk_materiales_stock_actual: 'El stock resultante no puede ser negativo',
  chk_detalle_stock_resultante: 'El stock resultante no puede ser negativo',
  chk_detalle_cantidad: 'La cantidad debe ser mayor que cero',
  uq_alertas_abierta_material: 'El material ya tiene una alerta abierta',
};

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof QueryFailedError) {
    const pgError = error.driverError as PgError;
    if (pgError.code === '23505') {
      res.status(409).json({
        code: 'CONFLICT',
        message: 'Ya existe un registro con los mismos datos únicos',
        ...(env.isProduction ? {} : { details: pgError.detail }),
      });
      return;
    }
    if (pgError.code === '23503') {
      res.status(409).json({
        code: 'CONFLICT',
        message: 'El registro está relacionado con otros datos y no puede modificarse',
        ...(env.isProduction ? {} : { details: pgError.detail }),
      });
      return;
    }
    if (pgError.code === '23514') {
      const message =
        (pgError.constraint && CONSTRAINT_MESSAGES[pgError.constraint]) ??
        'Los datos no cumplen las restricciones de integridad';
      res.status(400).json({ code: 'BUSINESS_RULE', message });
      return;
    }
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res
      .status(400)
      .json({ code: 'BAD_REQUEST', message: 'El cuerpo de la petición no es JSON válido' });
    return;
  }

  logger.error('Error no controlado', error);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Ocurrió un error inesperado en el servidor',
    ...(env.isProduction ? {} : { details: error instanceof Error ? error.message : error }),
  });
}
