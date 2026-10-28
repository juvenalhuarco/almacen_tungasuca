import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStockAlerts1761500000010 implements MigrationInterface {
  name = 'CreateStockAlerts1761500000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE alertas_stock (
        id               SERIAL PRIMARY KEY,
        material_id      INT           NOT NULL REFERENCES materiales(id),
        tipo             VARCHAR(15)   NOT NULL,
        stock_al_generar NUMERIC(12,3) NOT NULL,
        stock_minimo     NUMERIC(12,3) NOT NULL,
        estado           VARCHAR(12)   NOT NULL DEFAULT 'PENDIENTE',
        generada_en      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atendida_en      TIMESTAMPTZ,
        atendida_por_id  INT           REFERENCES usuarios(id),
        resuelta_en      TIMESTAMPTZ,
        notificada_email BOOLEAN       NOT NULL DEFAULT FALSE,
        CONSTRAINT chk_alertas_tipo   CHECK (tipo IN ('STOCK_MINIMO', 'AGOTADO')),
        CONSTRAINT chk_alertas_estado CHECK (estado IN ('PENDIENTE', 'ATENDIDA', 'RESUELTA'))
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_alertas_material ON alertas_stock(material_id)`);
    await queryRunner.query(`CREATE INDEX idx_alertas_estado ON alertas_stock(estado)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_alertas_abierta_material ON alertas_stock(material_id)
      WHERE estado IN ('PENDIENTE', 'ATENDIDA')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS alertas_stock`);
  }
}
