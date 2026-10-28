import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMovementDetails1761500000009 implements MigrationInterface {
  name = 'CreateMovementDetails1761500000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE detalle_movimientos (
        id               SERIAL PRIMARY KEY,
        movimiento_id    INT           NOT NULL REFERENCES movimientos(id) ON DELETE CASCADE,
        material_id      INT           NOT NULL REFERENCES materiales(id),
        cantidad         NUMERIC(12,3) NOT NULL,
        precio_unitario  NUMERIC(12,2) NOT NULL DEFAULT 0,
        subtotal         NUMERIC(14,2) NOT NULL DEFAULT 0,
        stock_anterior   NUMERIC(12,3) NOT NULL,
        stock_resultante NUMERIC(12,3) NOT NULL,
        CONSTRAINT chk_detalle_cantidad         CHECK (cantidad > 0),
        CONSTRAINT chk_detalle_stock_resultante CHECK (stock_resultante >= 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_detalle_movimiento ON detalle_movimientos(movimiento_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_detalle_material ON detalle_movimientos(material_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS detalle_movimientos`);
  }
}
