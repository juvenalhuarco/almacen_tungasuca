import nodemailer, { Transporter } from 'nodemailer';
import { env, isSmtpEnabled } from '../../config/env';
import { AppDataSource } from '../../config/data-source';
import { StockAlert, StockAlertType } from '../../database/entities';
import { logger } from '../../common/utils/logger';

export class AlertNotifier {
  private transporter: Transporter | null = null;
  private pending = new Set<Promise<void>>();

  private getTransporter(): Transporter | null {
    if (!isSmtpEnabled()) return null;
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
      });
    }
    return this.transporter;
  }

  notifyCreated(alerts: StockAlert[]): void {
    if (alerts.length === 0) return;
    const task: Promise<void> = this.send(alerts)
      .then(() => undefined)
      .catch((error) => logger.error('No se pudo enviar la notificación de alertas', error))
      .finally(() => this.pending.delete(task));
    this.pending.add(task);
  }

  async waitForPending(): Promise<void> {
    await Promise.all(this.pending);
  }

  async send(alerts: StockAlert[]): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      logger.warn(
        `Alertas generadas sin envío de correo (SMTP no configurado): ${alerts
          .map((alert) => alert.material?.code ?? alert.materialId)
          .join(', ')}`,
      );
      return false;
    }

    const rows = alerts
      .map(
        (alert) => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0">${alert.material.code}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0">${alert.material.name}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;color:#b91c1c;font-weight:bold">${alert.stockAtGeneration} ${alert.material.unit?.abbreviation ?? ''}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${alert.minimumStock} ${alert.material.unit?.abbreviation ?? ''}</td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0">${alert.type === StockAlertType.OUT_OF_STOCK ? 'AGOTADO' : 'STOCK MÍNIMO'}</td>
          </tr>`,
      )
      .join('');

    const subject =
      alerts.length === 1
        ? `[Almacén] Alerta de stock mínimo: ${alerts[0].material.code} - ${alerts[0].material.name}`
        : `[Almacén] ${alerts.length} materiales alcanzaron el stock mínimo`;

    await transporter.sendMail({
      from: env.smtp.from,
      to: env.smtp.recipients,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a">
          <h2 style="color:#1d4ed8">${env.company.name} - Sistema de control de inventarios</h2>
          <p>Los siguientes materiales alcanzaron o quedaron por debajo de su nivel mínimo de existencias y requieren reposición:</p>
          <table style="border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Código</th>
                <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Material</th>
                <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">Stock actual</th>
                <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">Stock mínimo</th>
                <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Estado</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#64748b;font-size:12px;margin-top:16px">Mensaje generado automáticamente por el sistema de almacén.</p>
        </div>`,
    });

    await AppDataSource.getRepository(StockAlert).update(
      alerts.map((alert) => alert.id),
      { emailSent: true },
    );
    logger.info(
      `Correo de alerta enviado a ${env.smtp.recipients.join(', ')} (${alerts.length} alerta(s))`,
    );
    return true;
  }
}

export const alertNotifier = new AlertNotifier();
