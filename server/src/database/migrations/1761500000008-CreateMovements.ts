import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMovements1761500000008 implements MigrationInterface {
  name = 'CreateMovements1761500000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE movimientos (
        id                    SERIAL PRIMARY KEY,
        codigo                VARCHAR(20)   NOT NULL UNIQUE,
        tipo                  VARCHAR(10)   NOT NULL,
        fecha                 TIMESTAMPTZ   NOT NULL,
        numero_documento      VARCHAR(50),
        proveedor_id          INT           REFERENCES proveedores(id),
        frente_obra_id        INT           REFERENCES frentes_obra(id),
        solicitante           VARCHAR(150),
        usuario_id            INT           NOT NULL REFERENCES usuarios(id),
        observaciones         VARCHAR(500),
        estado                VARCHAR(12)   NOT NULL DEFAULT 'REGISTRADO',
        motivo_anulacion      VARCHAR(300),
        anulado_por_id        INT           REFERENCES usuarios(id),
        anulado_en            TIMESTAMPTZ,
        duracion_registro_seg INT,
        total                 NUMERIC(14,2) NOT NULL DEFAULT 0,
        anula_movimiento_id   INT           REFERENCES movimientos(id),
        creado_en             TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_movimientos_tipo     CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
        CONSTRAINT chk_movimientos_estado   CHECK (estado IN ('REGISTRADO', 'ANULADO')),
        CONSTRAINT chk_movimientos_duracion CHECK (duracion_registro_seg IS NULL OR duracion_registro_seg >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_movimientos_fecha ON movimientos(fecha DESC)`);
    await queryRunner.query(`CREATE INDEX idx_movimientos_tipo ON movimientos(tipo)`);
    await queryRunner.query(`CREATE INDEX idx_movimientos_usuario ON movimientos(usuario_id)`);
    await queryRunner.query(`CREATE INDEX idx_movimientos_frente ON movimientos(frente_obra_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS movimientos`);
  }
}
