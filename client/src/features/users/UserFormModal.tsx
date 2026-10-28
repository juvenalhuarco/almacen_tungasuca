import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';
import type { Role, User } from '@/shared/types';
import { roleLabel } from '@/shared/utils/format';
import { usersApi } from './users.api';

interface UserFormModalProps {
  open: boolean;
  user: User | null;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  username: string;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
}

const EMPTY: FormState = {
  username: '',
  dni: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  roleId: '',
};

export function UserFormModal({ open, user, roles, onClose, onSaved }: UserFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isEdit = user !== null;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (user) {
      const role = roles.find((r) => r.name === user.role);
      setForm({
        username: user.username,
        dni: user.dni,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email ?? '',
        phone: user.phone ?? '',
        password: '',
        roleId: role ? String(role.id) : '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, user, roles]);

  const update = (field: keyof FormState) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!isEdit && !/^[a-z0-9._-]{3,30}$/.test(form.username)) {
      next.username = 'De 3 a 30 caracteres: minúsculas, números, punto, guion o guion bajo';
    }
    if (!/^\d{8}$/.test(form.dni)) next.dni = 'El DNI debe tener 8 dígitos';
    if (!form.firstName.trim()) next.firstName = 'Ingrese los nombres';
    if (!form.lastName.trim()) next.lastName = 'Ingrese los apellidos';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = 'Correo no válido';
    if (!isEdit && form.password.length < 8) next.password = 'Mínimo 8 caracteres';
    if (!form.roleId) next.roleId = 'Seleccione un rol';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await usersApi.update(user.id, {
          dni: form.dni,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          roleId: Number(form.roleId),
        });
        toast.success('Usuario actualizado correctamente');
      } else {
        await usersApi.create({
          username: form.username,
          dni: form.dni,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          password: form.password,
          roleId: Number(form.roleId),
        });
        toast.success('Usuario registrado correctamente');
      }
      onSaved();
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
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar usuario' : 'Registrar nuevo usuario'}
      description={
        isEdit
          ? 'Actualice los datos del usuario. El nombre de usuario no puede modificarse.'
          : 'Complete los datos para dar acceso al sistema.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" loading={loading}>
            {isEdit ? 'Guardar cambios' : 'Registrar usuario'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input
          label="Nombre de usuario"
          name="username"
          maxLength={30}
          autoCapitalize="none"
          value={form.username}
          onChange={(event) =>
            setForm((current) => ({ ...current, username: event.target.value.toLowerCase() }))
          }
          error={errors.username}
          disabled={isEdit}
          hint={isEdit ? undefined : 'Se usará para iniciar sesión'}
          required
        />
        <Input
          label="DNI"
          name="dni"
          inputMode="numeric"
          maxLength={8}
          value={form.dni}
          onChange={(event) =>
            setForm((current) => ({ ...current, dni: event.target.value.replace(/\D/g, '') }))
          }
          error={errors.dni}
          required
        />
        <Select
          label="Rol"
          name="roleId"
          value={form.roleId}
          onChange={update('roleId')}
          error={errors.roleId}
          placeholder="Seleccione un rol"
          options={roles.map((role) => ({ value: role.id, label: roleLabel(role.name) }))}
          required
        />
        <Input
          label="Nombres"
          name="firstName"
          value={form.firstName}
          onChange={update('firstName')}
          error={errors.firstName}
          required
          className="sm:col-span-2"
        />
        <Input
          label="Apellidos"
          name="lastName"
          value={form.lastName}
          onChange={update('lastName')}
          error={errors.lastName}
          required
          className="sm:col-span-2"
        />
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />
        <Input
          label="Teléfono"
          name="phone"
          value={form.phone}
          onChange={update('phone')}
          error={errors.phone}
        />
        {!isEdit && (
          <Input
            label="Contraseña inicial"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            hint="Mínimo 8 caracteres. El usuario podrá cambiarla luego."
            required
            className="sm:col-span-2"
          />
        )}
      </form>
    </Modal>
  );
}
