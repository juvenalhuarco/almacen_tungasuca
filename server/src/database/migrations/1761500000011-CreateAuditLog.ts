import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLog1761500000011 implements MigrationInterface {
  name = 'CreateAuditLog1761500000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE bitacora (
        id         SERIAL PRIMARY KEY,
        usuario_id INT         REFERENCES usuarios(id),
        accion     VARCHAR(50) NOT NULL,
        entidad    VARCHAR(50) NOT NULL,
        entidad_id INT,
        detalle    JSONB,
        ip         VARCHAR(45),
        creado_en  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_bitacora_fecha ON bitacora(creado_en DESC)`);
    await queryRunner.query(`CREATE INDEX idx_bitacora_usuario ON bitacora(usuario_id)`);
    await queryRunner.query(`CREATE INDEX idx_bitacora_entidad ON bitacora(entidad, entidad_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS bitacora`);
  }
}
