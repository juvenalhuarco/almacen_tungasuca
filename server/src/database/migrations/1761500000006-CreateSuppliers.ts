import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuppliers1761500000006 implements MigrationInterface {
  name = 'CreateSuppliers1761500000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE proveedores (
        id             SERIAL PRIMARY KEY,
        ruc            VARCHAR(11)  NOT NULL UNIQUE,
        razon_social   VARCHAR(150) NOT NULL,
        contacto       VARCHAR(100),
        telefono       VARCHAR(20),
        email          VARCHAR(150),
        direccion      VARCHAR(200),
        activo         BOOLEAN      NOT NULL DEFAULT TRUE,
        creado_en      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_proveedores_ruc CHECK (ruc ~ '^[0-9]{11}$')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS proveedores`);
  }
}
