import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkFronts1761500000007 implements MigrationInterface {
  name = 'CreateWorkFronts1761500000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE frentes_obra (
        id             SERIAL PRIMARY KEY,
        codigo         VARCHAR(20)  NOT NULL UNIQUE,
        nombre         VARCHAR(150) NOT NULL,
        ubicacion      VARCHAR(200),
        residente      VARCHAR(100),
        activo         BOOLEAN      NOT NULL DEFAULT TRUE,
        creado_en      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS frentes_obra`);
  }
}
