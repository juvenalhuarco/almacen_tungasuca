process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.DB_NAME = process.env.DB_NAME_TEST ?? process.env.DB_NAME ?? 'almacen_tungasuca';
