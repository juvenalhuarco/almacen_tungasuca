# Sistema web de control de inventarios con alertas automáticas por niveles mínimos de existencias

Aplicación web desarrollada para el almacén de obra del **Consorcio Tungasuca (Cusco, 2026)**. Centraliza el catálogo de materiales, registra las entradas, salidas y ajustes de inventario con trazabilidad completa (kardex), genera alertas automáticas cuando un material alcanza su nivel mínimo y produce reportes exportables a Excel y PDF.

## Características principales

- **Autenticación** con nombre de usuario y contraseña, tokens JWT y roles **Administrador** y **Encargado de Almacén**.
- **Catálogo de materiales** con código correlativo, categoría, unidad de medida, ubicación, stock mínimo y semáforo de estado (óptimo, crítico, agotado).
- **Movimientos de almacén** (entradas, salidas y ajustes por conteo físico) registrados en una sola transacción: validación de existencias, actualización de stock, kardex con saldo anterior y resultante, evaluación de alertas y bitácora.
- **Anulación sin borrado**: el movimiento queda marcado como anulado y se genera un ajuste inverso que devuelve el stock a su valor anterior.
- **Alertas automáticas** por stock mínimo y agotado, con ciclo de vida (pendiente, atendida, resuelta), notificación por correo y revisión diaria programada.
- **Reportes** de existencias valorizado, movimientos y kardex por material, exportables a **Excel** y **PDF membretado**.
- **Dashboard** con resumen del almacén y los indicadores del proyecto calculados con datos reales: Tiempo Promedio de Atención (TPA), Exactitud del Inventario de Existencias (EIE) e Identificación Oportuna de Stock Mínimo (IOSM).
- **Mantenimiento** de categorías, unidades de medida, proveedores y frentes de obra.
- **Bitácora** de auditoría de todas las operaciones.
- **PWA** instalable en tablets y teléfonos de obra.
- **Documentación de la API** con Swagger en `/api/docs`.

## Arquitectura

Monolito modular en tres capas, comunicado internamente por una API REST:

```
almacen_tungasuca/
├── server/   API REST: Node.js + Express + TypeScript + TypeORM + PostgreSQL
│   └── src/
│       ├── config/        variables de entorno y conexión a la base de datos
│       ├── database/      entidades, migraciones y datos iniciales
│       ├── middlewares/   autenticación, autorización, manejo de errores
│       ├── modules/       un módulo por dominio: routes → controller → service → repository
│       ├── jobs/          revisión diaria de stock mínimo
│       └── docs/          definición OpenAPI
└── client/   Aplicación web: React + Vite + TypeScript + Tailwind CSS
    └── src/
        ├── app/           enrutador, layout, guardas de sesión y rol
        ├── features/      un directorio por funcionalidad (pantallas y acceso a la API)
        └── shared/        componentes de interfaz, cliente HTTP, utilidades
```

En desarrollo el cliente corre en Vite y reenvía las llamadas a `/api` hacia el servidor. En producción el servidor Express entrega la aplicación compilada y la API desde el mismo puerto.

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior

## Instalación

1. Instalar dependencias desde la raíz del proyecto:

   ```bash
   npm install
   ```

2. Crear el archivo de configuración del servidor a partir del ejemplo y completar al menos la contraseña de PostgreSQL:

   ```bash
   cp server/.env.example server/.env
   ```

3. Crear la base de datos:

   ```bash
   psql -U postgres -c "CREATE DATABASE almacen_tungasuca;"
   ```

4. Ejecutar las migraciones (una por tabla) y cargar los datos iniciales (roles, usuarios, catálogos y materiales de ejemplo):

   ```bash
   npm run migration:run
   npm run seed
   ```

   Para una demostración con historial se puede usar `npm run seed:demo` en lugar de `npm run seed`. Además de los datos iniciales registra mes y medio de entradas, salidas y ajustes a través del propio servicio de movimientos, por lo que el kardex, las alertas, la bitácora y los indicadores del panel quedan poblados con datos coherentes. Solo se ejecuta si la base no tiene movimientos.

## Ejecución

Modo desarrollo (servidor y cliente con recarga automática):

```bash
npm run dev
```

- Aplicación: http://localhost:5173
- API: http://localhost:4000/api
- Documentación: http://localhost:4000/api/docs

Modo producción:

```bash
npm run build
npm start
```

La aplicación completa queda disponible en http://localhost:4000.

### Usuarios iniciales

| Usuario   | Contraseña     | Rol                  |
| --------- | -------------- | -------------------- |
| `admin`   | `admin`        | Administrador        |
| `jhuarco` | `Almacen2026*` | Encargado de Almacén |

Ambos usuarios los crea el seed (`server/src/database/seeds/users.seed.ts`). Se recomienda cambiar las contraseñas desde _Mi cuenta_ después del primer inicio de sesión.

## Configuración

Todas las opciones se encuentran en `server/.env.example`:

| Grupo         | Variables                                                                                     | Descripción                                                                 |
| ------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Servidor      | `PORT`, `CLIENT_URL`, `NODE_ENV`                                                              | Puerto de la API y origen permitido en desarrollo                           |
| Base de datos | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DATABASE_URL`, `DB_SSL`           | Conexión a PostgreSQL. `DATABASE_URL` reemplaza a las variables `DB_*`      |
| Seguridad     | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_*_EXPIRES`                                    | Claves y vigencia de los tokens                                             |
| Empresa       | `COMPANY_NAME`, `COMPANY_RUC`, `COMPANY_ADDRESS`, `COMPANY_PHONE`, `COMPANY_EMAIL`            | Datos del membrete de los reportes                                          |
| Correo        | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `ALERT_EMAIL_RECIPIENTS` | Envío de alertas por correo. Si `SMTP_HOST` está vacío no se envían correos |
| Revisión      | `STOCK_CHECK_CRON`                                                                            | Hora de la revisión diaria de stock mínimo (por defecto 07:00)              |

## Pruebas

Las pruebas de integración ejercitan la API contra una base de datos real con las migraciones y el seed aplicados. Para no mezclar datos con los de trabajo se puede indicar una base de datos distinta con `DB_NAME_TEST`:

```bash
psql -U postgres -c "CREATE DATABASE almacen_tungasuca_test;"
DB_NAME=almacen_tungasuca_test npm run migration:run
DB_NAME=almacen_tungasuca_test npm run seed
DB_NAME_TEST=almacen_tungasuca_test npm test
```

Cubren autenticación, movimientos (entradas, salidas, ajustes, anulación y stock no negativo) y alertas automáticas.

## Scripts disponibles

| Comando                      | Descripción                                          |
| ---------------------------- | ---------------------------------------------------- |
| `npm run dev`                | Servidor y cliente en modo desarrollo                |
| `npm run build`              | Compila el cliente y el servidor para producción     |
| `npm start`                  | Inicia el servidor compilado                         |
| `npm run migration:run`      | Aplica las migraciones pendientes                    |
| `npm run migration:revert`   | Revierte la última migración                         |
| `npm run seed`               | Carga los datos iniciales                            |
| `npm run seed:demo`          | Carga los datos iniciales más movimientos de ejemplo |
| `npm run migration:run:prod` | Aplica las migraciones usando el código compilado    |
| `npm run seed:prod`          | Carga los datos iniciales usando el código compilado |
| `npm run seed:demo:prod`     | Igual que `seed:demo` con el código compilado        |
| `npm test`                   | Ejecuta las pruebas de integración de la API         |
| `npm run lint`               | Revisa el código con ESLint                          |
| `npm run format`             | Formatea el código con Prettier                      |

## Despliegue en la nube

El proyecto se despliega como un único servicio web: Express sirve la API y el cliente compilado. Está preparado para [Render](https://render.com) con la base de datos en [Neon](https://neon.tech), ambos con plan gratuito, aunque cualquier proveedor que ejecute Node y PostgreSQL funciona igual.

1. **Base de datos.** Crear un proyecto en Neon y copiar la cadena de conexión (`postgresql://usuario:clave@host/neondb?sslmode=require`).
2. **Repositorio.** Subir el código a GitHub. El archivo `render.yaml` describe el servicio.
3. **Servicio web.** En Render elegir _New > Blueprint_, seleccionar el repositorio y completar `DATABASE_URL` con la cadena de Neon. Las claves JWT se generan solas y el resto de variables son opcionales.
4. **Primer despliegue.** El comando de construcción compila el proyecto, aplica las migraciones y carga los datos iniciales con movimientos de ejemplo. Para desplegar sin datos de ejemplo, cambiar `seed:demo:prod` por `seed:prod` en `render.yaml`.
5. **Correo.** Opcional. Completar las variables `SMTP_*` y `ALERT_EMAIL_RECIPIENTS` con una cuenta de Brevo o una contraseña de aplicación de Gmail.

Variables mínimas en producción, para cualquier proveedor:

```
NODE_ENV=production
DATABASE_URL=postgresql://...
DB_SSL=true
JWT_ACCESS_SECRET=clave-larga-aleatoria
JWT_REFRESH_SECRET=otra-clave-larga-aleatoria
```

Comandos equivalentes en un servidor propio:

```bash
npm ci --include=dev
npm run build
npm run migration:run:prod
npm run seed:prod
npm start
```

El plan gratuito de Render suspende el servicio tras 15 minutos sin tráfico y tarda cerca de un minuto en reactivarse en la siguiente visita.

### Despliegue continuo

Render vuelve a construir y publicar el servicio automáticamente con cada push a la rama `main`. En paralelo, el flujo `.github/workflows/ci.yml` ejecuta en GitHub Actions lint, typecheck, migraciones, seed, pruebas de integración y build contra un PostgreSQL temporal, de modo que cada cambio queda verificado y visible en la pestaña _Actions_ del repositorio.

## Reglas de negocio destacadas

- El stock de un material solo cambia mediante movimientos; la ficha del material no lo edita.
- Una salida nunca puede dejar el stock en negativo (validado en el servicio y reforzado por una restricción en la base de datos).
- Cada línea de movimiento guarda el stock anterior y el resultante, lo que permite reconstruir el kardex completo.
- Un material con existencias no puede desactivarse.
- Solo el Administrador puede anular movimientos, gestionar usuarios, mantener catálogos y consultar la bitácora.
- Las alertas se generan en la misma transacción del movimiento y se cierran automáticamente cuando el stock vuelve a superar el mínimo.
