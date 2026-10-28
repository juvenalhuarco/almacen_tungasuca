import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';
import type { User } from '@/shared/types';
import { usersApi } from './users.api';

interface ResetPasswordModalProps {
  user: User | null;
  onClose: () => void;
}

export function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const toast = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNewPassword('');
    setConfirm('');
    setErrors({});
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const next: Record<string, string> = {};
    if (newPassword.length < 8) next.newPassword = 'Mínimo 8 caracteres';
    if (newPassword !== confirm) next.confirm = 'Las contraseñas no coinciden';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await usersApi.resetPassword(user.id, newPassword);
      toast.success(`Contraseña de ${user.fullName} restablecida`);
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="Restablecer contraseña"
      description={user ? `Usuario: ${user.fullName} (DNI ${user.dni})` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="reset-password-form" loading={loading}>
            Restablecer
          </Button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Nueva contraseña"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={errors.newPassword}
          required
        />
        <Input
          label="Confirmar contraseña"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
          required
        />
      </form>
    </Modal>
  );
}
