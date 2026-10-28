import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategories1761500000003 implements MigrationInterface {
  name = 'CreateCategories1761500000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE categorias (
        id             SERIAL PRIMARY KEY,
        nombre         VARCHAR(80)  NOT NULL UNIQUE,
        descripcion    VARCHAR(200),
        activo         BOOLEAN      NOT NULL DEFAULT TRUE,
        creado_en      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS categorias`);
  }
}
