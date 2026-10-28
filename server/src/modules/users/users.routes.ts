import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middlewares/authenticate';
import { adminOnly } from '../../middlewares/authorize';

const router = Router();

router.use(authenticate, adminOnly);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuarios (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: Busca por usuario, DNI, nombres, apellidos o correo }
 *       - { in: query, name: roleId, schema: { type: integer } }
 *       - { in: query, name: active, schema: { type: boolean } }
 *       - { $ref: '#/components/parameters/Page' }
 *       - { $ref: '#/components/parameters/Limit' }
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios
 *   post:
 *     tags: [Usuarios]
 *     summary: Registrar un nuevo usuario (solo Administrador)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Usuario creado
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', usersController.list);
router.post('/', usersController.create);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener un usuario por id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/Id' }
 *     responses:
 *       200:
 *         description: Usuario
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Usuarios]
 *     summary: Actualizar datos de un usuario
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/Id' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dni: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, nullable: true }
 *               phone: { type: string, nullable: true }
 *               roleId: { type: integer }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.get('/:id', usersController.getById);
router.put('/:id', usersController.update);

/**
 * @openapi
 * /users/{id}/status:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Activar o desactivar un usuario
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/Id' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [active]
 *             properties:
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         $ref: '#/components/responses/BusinessRule'
 */
router.patch('/:id/status', usersController.setActive);

/**
 * @openapi
 * /users/{id}/reset-password:
 *   put:
 *     tags: [Usuarios]
 *     summary: Restablecer la contraseña de un usuario
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/Id' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 */
router.put('/:id/reset-password', usersController.resetPassword);

export default router;
