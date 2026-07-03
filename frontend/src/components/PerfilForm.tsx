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
import { deleteUser } from '../services/usersApi';
import { AuthCard } from './AuthCard';

const ROLE_LABELS: Record<string, string> = {
  user: 'Usuário',
  admin: 'Administrador',
};

export function PerfilForm() {
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { // Carrega o perfil do usuário logado
    const userId = getAuthUserId();
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }

    const profileUserId = userId;
    let cancelled = false;

    async function loadProfile(): Promise<void> { // Carrega o perfil do usuário logado
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

  const handleLogout = () => { // Sai da conta
    clearAuthSession();
    toast.info('Você saiu da conta.');
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => { // Exclui a conta
    if (!user) return;

    const confirmed = window.confirm(
      'Excluir sua conta? Seus dados serão ocultados (soft delete) e você não poderá mais entrar.',
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteUser(user.id);
      clearAuthSession();
      toast.success('Conta excluída com sucesso.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Não foi possível excluir a conta.');
      }
    } finally {
      setIsDeleting(false);
    }
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
          disabled={isDeleting}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:opacity-60"
        >
          Sair
        </button>
        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={isDeleting}
          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-60"
        >
          {isDeleting ? 'Excluindo conta...' : 'Excluir minha conta'}
        </button>
        <p className="text-center text-xs text-slate-500">
          <Link to="/reativar" className="font-medium text-teal-600 hover:underline">
            Reativar conta excluída
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
