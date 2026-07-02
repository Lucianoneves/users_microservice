import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ApiError,
  clearAuthSession,
  fetchUserProfile,
  getAuthRole,
  getAuthUserId,
  type PublicUser,
} from '../services/authApi';
import { AuthCard } from './AuthCard';

const ROLE_LABELS: Record<string, string> = {
  user: 'Usuário',
  admin: 'Administrador',
};

export function PerfilForm() {
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = getAuthUserId();
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }

    const profileUserId = userId;
    let cancelled = false;

    async function loadProfile(): Promise<void> {
      try {
        const profile = await fetchUserProfile(profileUserId);
        if (!cancelled) setUser(profile);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearAuthSession();
          toast.error('Sessão expirada. Faça login novamente.');
          navigate('/login', { replace: true });
          return;
        }
        toast.error('Não foi possível carregar o perfil.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    clearAuthSession();
    toast.info('Você saiu da conta.');
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <AuthCard title="Meu perfil" subtitle="ACME Corp — Users Service">
        <p className="text-center text-sm text-slate-500">Carregando perfil...</p>
      </AuthCard>
    );
  }

  if (!user) {
    return (
      <AuthCard title="Meu perfil" subtitle="ACME Corp — Users Service">
        <p className="text-center text-sm text-slate-500">Perfil não encontrado.</p>
        <Link
          to="/login"
          className="mt-4 block text-center text-sm font-medium text-teal-600 hover:underline"
        >
          Voltar ao login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Meu perfil"
      subtitle="ACME Corp — Users Service"
      footer="Dados carregados via GET /users/:id com Bearer token"
    >
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">ID</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">{user.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Nome de usuário
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">{user.username}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">E-mail</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Perfil</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {ROLE_LABELS[user.role] ?? user.role}
          </dd>
        </div>
      </dl>

      <div className="mt-6 space-y-3">
        {getAuthRole() === 'admin' && (
          <Link
            to="/admin"
            className="block w-full rounded-xl bg-teal-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
          >
            Gestão de usuários
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
        >
          Sair
        </button>
        <p className="text-center text-xs text-slate-500">
          <Link to="/cadastro" className="font-medium text-teal-600 hover:underline">
            Criar outra conta
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
