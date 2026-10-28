import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoles1761500000001 implements MigrationInterface {
  name = 'CreateRoles1761500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE roles (
        id          SERIAL PRIMARY KEY,
        nombre      VARCHAR(30)  NOT NULL UNIQUE,
        descripcion VARCHAR(150),
        creado_en   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
  }
}
