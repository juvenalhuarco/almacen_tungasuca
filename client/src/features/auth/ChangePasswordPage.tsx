import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { Button, Input, PageHeader } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';
import { authApi } from './auth.api';
import { roleLabel, formatDateTime } from '@/shared/utils/format';

export function ChangePasswordPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation: Record<string, string> = {};
    if (!form.currentPassword) validation.currentPassword = 'Ingrese su contraseña actual';
    if (form.newPassword.length < 8) validation.newPassword = 'Debe tener al menos 8 caracteres';
    if (form.newPassword !== form.confirmPassword)
      validation.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      toast.success('Contraseña actualizada correctamente');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Mi cuenta" description="Datos de su usuario y cambio de contraseña." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Datos del usuario
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Nombre completo</dt>
              <dd className="font-medium text-slate-900">{user?.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Usuario</dt>
              <dd className="font-medium text-slate-900">{user?.username}</dd>
            </div>
            <div>
              <dt className="text-slate-500">DNI</dt>
              <dd className="font-medium text-slate-900">{user?.dni}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Correo electrónico</dt>
              <dd className="font-medium text-slate-900">{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Rol</dt>
              <dd className="font-medium text-slate-900">{roleLabel(user?.role ?? '')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Último acceso</dt>
              <dd className="font-medium text-slate-900">{formatDateTime(user?.lastLoginAt)}</dd>
            </div>
          </dl>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 lg:col-span-2" noValidate>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contraseña actual"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={update('currentPassword')}
              error={errors.currentPassword}
              required
              className="sm:col-span-2"
            />
            <Input
              label="Nueva contraseña"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={update('newPassword')}
              error={errors.newPassword}
              hint="Mínimo 8 caracteres"
              required
            />
            <Input
              label="Confirmar nueva contraseña"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              error={errors.confirmPassword}
              required
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={loading}>
              Guardar nueva contraseña
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
