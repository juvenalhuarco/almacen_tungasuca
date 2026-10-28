import { EntityManager } from 'typeorm';
import { Supplier } from '../entities';

const SUPPLIERS = [
  {
    ruc: '20100047218',
    businessName: 'Yura S.A.',
    contactName: 'Ventas Cusco',
    phone: '084-245600',
    email: 'ventas@yura.com.pe',
    address: 'Av. Industrial s/n, Cusco',
  },
  {
    ruc: '20100096341',
    businessName: 'Aceros Arequipa S.A.',
    contactName: 'Distribuidor autorizado',
    phone: '054-381000',
    email: 'contacto@acerosarequipa.com',
    address: 'Arequipa',
  },
  {
    ruc: '20506874556',
    businessName: 'Ferretería El Constructor E.I.R.L.',
    contactName: 'Marcos Quispe',
    phone: '984-556677',
    email: 'ventas@elconstructor.pe',
    address: 'Av. La Cultura 1250, Cusco',
  },
];

export async function seedSuppliers(manager: EntityManager): Promise<void> {
  const repo = manager.getRepository(Supplier);
  for (const item of SUPPLIERS) {
    const exists = await repo.findOne({ where: { ruc: item.ruc } });
    if (!exists) await repo.save(repo.create(item));
  }
}
