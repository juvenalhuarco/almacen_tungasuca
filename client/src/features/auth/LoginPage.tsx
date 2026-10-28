import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { Button, FullPageSpinner, Input } from '@/shared/components/ui';
import { getErrorMessage, getFieldErrors } from '@/shared/api/http';

export function LoginPage() {
  const { login, isAuthenticated, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (initializing) return <FullPageSpinner message="Restaurando sesión..." />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = 'Ingrese su nombre de usuario';
    if (!password) errors.password = 'Ingrese su contraseña';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password, remember });
      navigate(from, { replace: true });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'No se pudo iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-100 to-brand-100 p-4">
      <div className="card grid w-full max-w-4xl overflow-hidden md:grid-cols-2">
        <div className="hidden flex-col items-center justify-center gap-6 bg-white p-10 md:flex">
          <img
            src="/logo.png"
            alt="Consorcio Tungasuca"
            className="w-64 max-w-full object-contain"
          />
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Sistema web de control de inventarios
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Alertas automáticas por niveles mínimos de existencias
            </p>
          </div>
        </div>

        <div className="bg-brand-600 p-8 text-white sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1">
              <img
                src="/logo.png"
                alt="Consorcio Tungasuca"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-100">
              Consorcio Tungasuca
            </span>
          </div>

          <h1 className="text-2xl font-bold leading-tight">Bienvenido al sistema de Almacén</h1>
          <p className="mt-2 text-sm text-brand-100">
            Ingrese sus credenciales para acceder al control de inventarios.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-semibold">
                Usuario
              </label>
              <Input
                id="username"
                name="username"
                maxLength={30}
                autoComplete="username"
                autoCapitalize="none"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                leftIcon={<UserRound className="h-4 w-4" />}
                error={fieldErrors.username}
                className="[&_p]:text-amber-200"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold">
                Contraseña
              </label>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                leftIcon={<LockKeyhole className="h-4 w-4" />}
                error={fieldErrors.password}
                className="[&_p]:text-amber-200"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    className="rounded p-1 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Recuérdame en este dispositivo
            </label>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full bg-white text-brand-700 hover:bg-brand-50 focus-visible:ring-white"
            >
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-brand-200">
            Consorcio Tungasuca · Cusco {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
