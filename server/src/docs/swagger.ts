import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API - Sistema de Control de Inventarios',
      version: '1.0.0',
      description:
        'API REST del sistema web para el control de inventarios con alertas automáticas por niveles mínimos de existencias. Consorcio Tungasuca.',
    },
    servers: [{ url: '/api', description: 'Servidor actual' }],
    tags: [
      { name: 'Autenticación', description: 'Inicio y cierre de sesión' },
      { name: 'Usuarios', description: 'Gestión de usuarios y roles' },
      { name: 'Mantenimiento', description: 'Categorías, unidades, proveedores y frentes de obra' },
      { name: 'Materiales', description: 'Catálogo de materiales e insumos' },
      { name: 'Movimientos', description: 'Entradas, salidas y ajustes de almacén' },
      { name: 'Alertas', description: 'Alertas automáticas por stock mínimo' },
      { name: 'Reportes', description: 'Reportes de existencias y movimientos' },
      { name: 'Dashboard', description: 'Indicadores y resumen general' },
      { name: 'Bitácora', description: 'Auditoría de operaciones' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      parameters: {
        Id: { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        Page: { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        Limit: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 20, maximum: 100 },
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string' },
            details: { type: 'object', additionalProperties: true },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string', example: 'admin' },
            dni: { type: 'string', example: '12345678' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['ADMINISTRADOR', 'ALMACENERO'] },
            active: { type: 'boolean' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        UserInput: {
          type: 'object',
          required: ['username', 'dni', 'firstName', 'lastName', 'password', 'roleId'],
          properties: {
            username: { type: 'string', example: 'jhuarco' },
            dni: { type: 'string', example: '12345678' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            password: { type: 'string', minLength: 8 },
            roleId: { type: 'integer' },
          },
        },
        Material: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string', example: 'MAT-001' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            category: {
              type: 'object',
              properties: { id: { type: 'integer' }, name: { type: 'string' } },
            },
            unit: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                abbreviation: { type: 'string' },
              },
            },
            currentStock: { type: 'number' },
            minimumStock: { type: 'number' },
            referencePrice: { type: 'number' },
            location: { type: 'string', nullable: true },
            active: { type: 'boolean' },
            stockStatus: { type: 'string', enum: ['OPTIMO', 'CRITICO', 'AGOTADO'] },
          },
        },
        MaterialInput: {
          type: 'object',
          required: ['name', 'categoryId', 'unitId', 'minimumStock'],
          properties: {
            code: { type: 'string', description: 'Opcional; si se omite se genera MAT-###' },
            name: { type: 'string' },
            description: { type: 'string' },
            categoryId: { type: 'integer' },
            unitId: { type: 'integer' },
            minimumStock: { type: 'number' },
            initialStock: { type: 'number', description: 'Solo al crear: stock de apertura' },
            referencePrice: { type: 'number' },
            location: { type: 'string' },
          },
        },
        MovementInput: {
          type: 'object',
          required: ['type', 'lines'],
          properties: {
            type: { type: 'string', enum: ['ENTRADA', 'SALIDA', 'AJUSTE'] },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Por defecto, la fecha actual',
            },
            documentNumber: { type: 'string', example: 'GUIA-4401' },
            supplierId: { type: 'integer', description: 'Solo entradas' },
            workFrontId: { type: 'integer', description: 'Obligatorio en salidas' },
            requester: { type: 'string', description: 'Persona que retira el material' },
            notes: { type: 'string', description: 'Obligatorio en ajustes (motivo)' },
            registrationSeconds: {
              type: 'integer',
              description: 'Segundos que tomó el registro (KPI TPA)',
            },
            lines: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['materialId'],
                properties: {
                  materialId: { type: 'integer' },
                  quantity: { type: 'number', description: 'Entradas y salidas' },
                  unitPrice: { type: 'number' },
                  countedStock: {
                    type: 'number',
                    description: 'Solo ajustes: stock físico contado',
                  },
                },
              },
            },
          },
        },
        SessionResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'No autenticado o credenciales inválidas',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        Forbidden: {
          description: 'Sin permisos para la operación',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        Conflict: {
          description: 'Conflicto con datos existentes',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        BusinessRule: {
          description: 'Regla de negocio no cumplida',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        ValidationError: {
          description: 'Datos de entrada inválidos',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
      },
    },
  },
  // El buscador de archivos necesita barras "/" incluso en Windows.
  apis: [path.join(__dirname, '..', 'modules', '**', '*.routes.{ts,js}').replace(/\\/g, '/')],
});
