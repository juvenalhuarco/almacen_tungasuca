import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1761500000002 implements MigrationInterface {
  name = 'CreateUsers1761500000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id             SERIAL PRIMARY KEY,
        nombre_usuario VARCHAR(30)  NOT NULL UNIQUE,
        dni            VARCHAR(8)   NOT NULL UNIQUE,
        nombres        VARCHAR(100) NOT NULL,
        apellidos      VARCHAR(100) NOT NULL,
        email          VARCHAR(150) UNIQUE,
        telefono       VARCHAR(20),
        password_hash  VARCHAR(100) NOT NULL,
        rol_id         INT          NOT NULL REFERENCES roles(id),
        activo         BOOLEAN      NOT NULL DEFAULT TRUE,
        ultimo_acceso  TIMESTAMPTZ,
        creado_en      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_usuarios_dni CHECK (dni ~ '^[0-9]{8}$'),
        CONSTRAINT chk_usuarios_nombre_usuario CHECK (nombre_usuario ~ '^[a-z0-9._-]{3,30}$')
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_usuarios_rol ON usuarios(rol_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS usuarios`);
  }
}
