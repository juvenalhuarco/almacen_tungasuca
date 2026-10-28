import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUnitsOfMeasure1761500000004 implements MigrationInterface {
  name = 'CreateUnitsOfMeasure1761500000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE unidades_medida (
        id          SERIAL PRIMARY KEY,
        nombre      VARCHAR(50) NOT NULL UNIQUE,
        abreviatura VARCHAR(10) NOT NULL UNIQUE,
        activo      BOOLEAN     NOT NULL DEFAULT TRUE,
        creado_en   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS unidades_medida`);
  }
}
