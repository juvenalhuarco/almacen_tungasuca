import { Router } from 'express';
import { Category, Supplier, UnitOfMeasure, WorkFront } from '../../database/entities';
import { CatalogService } from './catalog.service';
import { createCatalogRouter } from './catalog.controller';
import { RUC_PATTERN } from '../../common/utils/validator';

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Mantenimiento]
 *     summary: Listar categorías de materiales
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: active, schema: { type: boolean } }
 *       - { in: query, name: all, schema: { type: boolean }, description: Devuelve todos los registros sin paginar }
 *       - { $ref: '#/components/parameters/Page' }
 *       - { $ref: '#/components/parameters/Limit' }
 *     responses:
 *       200: { description: Lista paginada }
 *   post:
 *     tags: [Mantenimiento]
 *     summary: Crear categoría (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Agregados }
 *               description: { type: string }
 *     responses:
 *       201: { description: Categoría creada }
 *       409: { $ref: '#/components/responses/Conflict' }
 * /categories/{id}:
 *   get:
 *     tags: [Mantenimiento]
 *     summary: Obtener categoría
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { description: Categoría }
 *   put:
 *     tags: [Mantenimiento]
 *     summary: Actualizar categoría (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { description: Categoría actualizada }
 * /categories/{id}/status:
 *   patch:
 *     tags: [Mantenimiento]
 *     summary: Activar o desactivar categoría (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { active: { type: boolean } } }
 *     responses:
 *       200: { description: Estado actualizado }
 */
const categoriesService = new CatalogService<Category>({
  entity: Category,
  table: 'categorias',
  label: 'Categoría',
  searchable: ['name', 'description'],
  unique: [{ property: 'name', message: 'Ya existe una categoría con ese nombre' }],
  orderBy: 'name',
});

export const categoriesRouter = createCatalogRouter(
  categoriesService,
  'Categoría',
  (v, partial) => {
    const name = v.string('name', { required: !partial, maxLength: 80 });
    const description = v.string('description', { maxLength: 200 });
    return {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined || !partial ? { description: description ?? null } : {}),
    };
  },
);

/**
 * @openapi
 * /units:
 *   get:
 *     tags: [Mantenimiento]
 *     summary: Listar unidades de medida
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: active, schema: { type: boolean } }
 *       - { in: query, name: all, schema: { type: boolean } }
 *     responses:
 *       200: { description: Lista paginada }
 *   post:
 *     tags: [Mantenimiento]
 *     summary: Crear unidad de medida (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, abbreviation]
 *             properties:
 *               name: { type: string, example: Kilogramo }
 *               abbreviation: { type: string, example: kg }
 *     responses:
 *       201: { description: Unidad creada }
 * /units/{id}:
 *   put:
 *     tags: [Mantenimiento]
 *     summary: Actualizar unidad de medida (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { description: Unidad actualizada }
 * /units/{id}/status:
 *   patch:
 *     tags: [Mantenimiento]
 *     summary: Activar o desactivar unidad (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { description: Estado actualizado }
 */
const unitsService = new CatalogService<UnitOfMeasure>({
  entity: UnitOfMeasure,
  table: 'unidades_medida',
  label: 'Unidad de medida',
  searchable: ['name', 'abbreviation'],
  unique: [
    { property: 'name', message: 'Ya existe una unidad con ese nombre' },
    { property: 'abbreviation', message: 'Ya existe una unidad con esa abreviatura' },
  ],
  orderBy: 'name',
});

export const unitsRouter = createCatalogRouter(unitsService, 'Unidad de medida', (v, partial) => {
  const name = v.string('name', { required: !partial, maxLength: 50 });
  const abbreviation = v.string('abbreviation', { required: !partial, maxLength: 10 });
  return {
    ...(name !== undefined ? { name } : {}),
    ...(abbreviation !== undefined ? { abbreviation } : {}),
  };
});

/**
 * @openapi
 * /suppliers:
 *   get:
 *     tags: [Mantenimiento]
 *     summary: Listar proveedores
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: active, schema: { type: boolean } }
 *       - { in: query, name: all, schema: { type: boolean } }
 *     responses:
 *       200: { description: Lista paginada }
 *   post:
 *     tags: [Mantenimiento]
 *     summary: Crear proveedor (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ruc, businessName]
 *             properties:
 *               ruc: { type: string, example: "20100047218" }
 *               businessName: { type: string }
 *               contactName: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               address: { type: string }
 *     responses:
 *       201: { description: Proveedor creado }
 * /suppliers/{id}:
 *   put:
 *     tags: [Mantenimiento]
 *     summary: Actualizar proveedor (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { description: Proveedor actualizado }
 * /suppliers/{id}/status:
 *   patch:
 *     tags: [Mantenimiento]
 *     summary: Activar o desactivar proveedor (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { description: Estado actualizado }
 */
const suppliersService = new CatalogService<Supplier>({
  entity: Supplier,
  table: 'proveedores',
  label: 'Proveedor',
  searchable: ['ruc', 'businessName', 'contactName'],
  unique: [{ property: 'ruc', message: 'Ya existe un proveedor con ese RUC' }],
  orderBy: 'businessName',
});

export const suppliersRouter = createCatalogRouter(suppliersService, 'Proveedor', (v, partial) => {
  const ruc = v.string('ruc', {
    required: !partial,
    pattern: RUC_PATTERN,
    patternMessage: 'El RUC debe tener 11 dígitos',
  });
  const businessName = v.string('businessName', { required: !partial, maxLength: 150 });
  const contactName = v.string('contactName', { maxLength: 100 });
  const phone = v.string('phone', { maxLength: 20 });
  const email = v.string('email', { email: true, maxLength: 150 });
  const address = v.string('address', { maxLength: 200 });
  return {
    ...(ruc !== undefined ? { ruc } : {}),
    ...(businessName !== undefined ? { businessName } : {}),
    contactName: contactName ?? null,
    phone: phone ?? null,
    email: email ?? null,
    address: address ?? null,
  };
});

/**
 * @openapi
 * /work-fronts:
 *   get:
 *     tags: [Mantenimiento]
 *     summary: Listar frentes de obra
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: active, schema: { type: boolean } }
 *       - { in: query, name: all, schema: { type: boolean } }
 *     responses:
 *       200: { description: Lista paginada }
 *   post:
 *     tags: [Mantenimiento]
 *     summary: Crear frente de obra (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string, example: FR-04 }
 *               name: { type: string }
 *               location: { type: string }
 *               residentEngineer: { type: string }
 *     responses:
 *       201: { description: Frente creado }
 * /work-fronts/{id}:
 *   put:
 *     tags: [Mantenimiento]
 *     summary: Actualizar frente de obra (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { description: Frente actualizado }
 * /work-fronts/{id}/status:
 *   patch:
 *     tags: [Mantenimiento]
 *     summary: Activar o desactivar frente (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/Id' }]
 *     responses:
 *       200: { description: Estado actualizado }
 */
const workFrontsService = new CatalogService<WorkFront>({
  entity: WorkFront,
  table: 'frentes_obra',
  label: 'Frente de obra',
  searchable: ['code', 'name', 'location', 'residentEngineer'],
  unique: [{ property: 'code', message: 'Ya existe un frente de obra con ese código' }],
  orderBy: 'code',
});

export const workFrontsRouter = createCatalogRouter(
  workFrontsService,
  'Frente de obra',
  (v, partial) => {
    const code = v.string('code', { required: !partial, maxLength: 20 });
    const name = v.string('name', { required: !partial, maxLength: 150 });
    const location = v.string('location', { maxLength: 200 });
    const residentEngineer = v.string('residentEngineer', { maxLength: 100 });
    return {
      ...(code !== undefined ? { code: code.toUpperCase() } : {}),
      ...(name !== undefined ? { name } : {}),
      location: location ?? null,
      residentEngineer: residentEngineer ?? null,
    };
  },
);

const router = Router();
router.use('/categories', categoriesRouter);
router.use('/units', unitsRouter);
router.use('/suppliers', suppliersRouter);
router.use('/work-fronts', workFrontsRouter);

export default router;
