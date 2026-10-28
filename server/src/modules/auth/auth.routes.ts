import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/authenticate';
import { loginRateLimiter } from '../../middlewares/rate-limit';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión con nombre de usuario y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: "admin" }
 *               password: { type: string, example: "admin" }
 *               remember: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Sesión iniciada. Devuelve el token de acceso y el usuario.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/login', loginRateLimiter, authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Autenticación]
 *     summary: Renovar el token de acceso usando la cookie de sesión
 *     responses:
 *       200:
 *         description: Nuevo token de acceso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Autenticación]
 *     summary: Cerrar sesión y eliminar la cookie de sesión
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204:
 *         description: Sesión cerrada
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Autenticación]
 *     summary: Obtener los datos del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, authController.me);

/**
 * @openapi
 * /auth/change-password:
 *   put:
 *     tags: [Autenticación]
 *     summary: Cambiar la contraseña del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         $ref: '#/components/responses/BusinessRule'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/change-password', authenticate, authController.changePassword);

export default router;
