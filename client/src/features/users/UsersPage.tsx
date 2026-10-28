import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Pencil, Plus, Search, UserCheck, UserX } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  PageHeader,
  Pagination,
  Select,
  Table,
  type Column,
} from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getErrorMessage } from '@/shared/api/http';
import { formatDateTime, roleLabel } from '@/shared/utils/format';
import { useAuth } from '@/app/providers/AuthContext';
import type { Role, User } from '@/shared/types';
import { usersApi, type UserFilters } from './users.api';
import { UserFormModal } from './UserFormModal';
import { ResetPasswordModal } from './ResetPasswordModal';

export function UsersPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [toggling, setToggling] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetcher = useCallback((params: UserFilters) => usersApi.list(params), []);
  const query = usePagedQuery<User, UserFilters>(fetcher, {
    initialFilters: { search: '', roleId: '', active: '' },
  });
  const { setFilters } = query;

  useEffect(() => {
    usersApi
      .roles()
      .then(setRoles)
      .catch(() => toast.error('No se pudieron cargar los roles'));
  }, [toast]);

  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setFormOpen(true);
  };

  const confirmToggle = async () => {
    if (!toggling) return;
    setToggleLoading(true);
    try {
      await usersApi.setActive(toggling.id, !toggling.active);
      toast.success(toggling.active ? 'Usuario desactivado' : 'Usuario activado');
      setToggling(null);
      void query.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggleLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'username',
      header: 'Usuario',
      render: (user) => (
        <div>
          <p className="font-semibold text-slate-900">{user.username}</p>
          <p className="text-xs text-slate-500">DNI {user.dni}</p>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nombre completo',
      render: (user) => (
        <div>
          <p className="font-medium text-slate-900">{user.fullName}</p>
          <p className="text-xs text-slate-500">{user.email ?? 'Sin correo'}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <Badge tone={user.role === 'ADMINISTRADOR' ? 'info' : 'neutral'}>
          {roleLabel(user.role)}
        </Badge>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (user) => user.phone ?? '—',
    },
    {
      key: 'lastLogin',
      header: 'Último acceso',
      render: (user) => <span className="text-slate-600">{formatDateTime(user.lastLoginAt)}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (user) => (
        <Badge tone={user.active ? 'success' : 'danger'}>
          {user.active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      className: 'text-right',
      render: (user) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(user)}
            className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setResetting(user)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            title="Restablecer contraseña"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setToggling(user)}
            disabled={user.id === currentUser?.id}
            className={
              user.active
                ? 'rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40'
                : 'rounded-lg p-2 text-emerald-600 hover:bg-emerald-50'
            }
            title={user.active ? 'Desactivar' : 'Activar'}
          >
            {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Administración de usuarios"
        description="Gestione las cuentas con acceso al sistema y sus roles."
        actions={
          <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
            Registrar usuario
          </Button>
        }
      />

      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-4">
        <Input
          name="search"
          placeholder="Buscar por usuario, DNI, nombre o correo..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="md:col-span-2"
        />
        <Select
          name="roleId"
          value={String(query.filters.roleId ?? '')}
          onChange={(event) =>
            setFilters({ roleId: event.target.value ? Number(event.target.value) : '' })
          }
          placeholder="Todos los roles"
          options={roles.map((role) => ({ value: role.id, label: roleLabel(role.name) }))}
        />
        <Select
          name="active"
          value={query.filters.active === '' ? '' : String(query.filters.active)}
          onChange={(event) =>
            setFilters({ active: event.target.value === '' ? '' : event.target.value === 'true' })
          }
          placeholder="Todos los estados"
          options={[
            { value: 'true', label: 'Activos' },
            { value: 'false', label: 'Inactivos' },
          ]}
        />
      </div>

      <div className="card overflow-hidden">
        {query.error && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {query.error}
          </div>
        )}
        <Table
          columns={columns}
          rows={query.rows}
          rowKey={(user) => user.id}
          loading={query.loading}
        />
        <Pagination
          page={query.meta.page}
          totalPages={query.meta.totalPages}
          total={query.meta.total}
          limit={query.meta.limit}
          onChange={query.setPage}
        />
      </div>

      <UserFormModal
        open={formOpen}
        user={editing}
        roles={roles}
        onClose={() => setFormOpen(false)}
        onSaved={() => void query.reload()}
      />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.active ? 'Desactivar usuario' : 'Activar usuario'}
        message={
          toggling?.active
            ? `${toggling.fullName} perderá el acceso al sistema hasta que vuelva a activarse.`
            : `${toggling?.fullName} recuperará el acceso al sistema.`
        }
        confirmLabel={toggling?.active ? 'Desactivar' : 'Activar'}
        variant={toggling?.active ? 'danger' : 'primary'}
        loading={toggleLoading}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </>
  );
}
