import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaterials1761500000005 implements MigrationInterface {
  name = 'CreateMaterials1761500000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE materiales (
        id                 SERIAL PRIMARY KEY,
        codigo             VARCHAR(20)   NOT NULL UNIQUE,
        nombre             VARCHAR(150)  NOT NULL,
        descripcion        VARCHAR(300),
        categoria_id       INT           NOT NULL REFERENCES categorias(id),
        unidad_medida_id   INT           NOT NULL REFERENCES unidades_medida(id),
        stock_actual       NUMERIC(12,3) NOT NULL DEFAULT 0,
        stock_minimo       NUMERIC(12,3) NOT NULL DEFAULT 0,
        precio_referencial NUMERIC(12,2) NOT NULL DEFAULT 0,
        ubicacion          VARCHAR(100),
        activo             BOOLEAN       NOT NULL DEFAULT TRUE,
        creado_en          TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_materiales_stock_actual CHECK (stock_actual >= 0),
        CONSTRAINT chk_materiales_stock_minimo CHECK (stock_minimo >= 0),
        CONSTRAINT chk_materiales_precio CHECK (precio_referencial >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_materiales_categoria ON materiales(categoria_id)`);
    await queryRunner.query(`CREATE INDEX idx_materiales_nombre ON materiales(LOWER(nombre))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS materiales`);
  }
}
