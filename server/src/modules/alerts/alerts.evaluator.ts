import { EntityManager, In } from 'typeorm';
import { Material, StockAlert, StockAlertStatus, StockAlertType } from '../../database/entities';

export interface AlertEvaluation {
  created: StockAlert[];
  resolved: StockAlert[];
}

export async function evaluateMaterialAlert(
  manager: EntityManager,
  material: Material,
  evaluation: AlertEvaluation,
): Promise<void> {
  const repo = manager.getRepository(StockAlert);
  const open = await repo.findOne({
    where: {
      materialId: material.id,
      status: In([StockAlertStatus.PENDING, StockAlertStatus.ATTENDED]),
    },
  });

  const belowMinimum = material.currentStock <= material.minimumStock;

  if (belowMinimum) {
    const type = material.currentStock <= 0 ? StockAlertType.OUT_OF_STOCK : StockAlertType.MINIMUM;
    if (!open) {
      const alert = await repo.save(
        repo.create({
          materialId: material.id,
          type,
          stockAtGeneration: material.currentStock,
          minimumStock: material.minimumStock,
          status: StockAlertStatus.PENDING,
          generatedAt: new Date(),
          emailSent: false,
        }),
      );
      alert.material = material;
      evaluation.created.push(alert);
    } else if (open.type !== type) {
      await repo.update(open.id, { type, stockAtGeneration: material.currentStock });
    }
    return;
  }

  if (open) {
    await repo.update(open.id, { status: StockAlertStatus.RESOLVED, resolvedAt: new Date() });
    open.status = StockAlertStatus.RESOLVED;
    evaluation.resolved.push(open);
  }
}
