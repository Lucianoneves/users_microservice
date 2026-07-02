import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  adminUpdateUserSchema,
  type AdminUpdateUserErrors,
  type AdminUpdateUserInput,
} from '../schemas/adminUser.schema';
import { ApiError, clearAuthSession } from '../services/authApi';
import type { PublicUser } from '../services/authApi';
import { listUsers, updateUser, type ListUsersFilters, type UserRole } from '../services/usersApi';
import { AuthCard } from './AuthCard';

const ROLE_LABELS: Record<string, string> = {
  user: 'Usuário',
  admin: 'Administrador',
};

const EMPTY_FILTERS: ListUsersFilters = { role: undefined, search: '' };

export function AdminUsersPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [filters, setFilters] = useState<ListUsersFilters>(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<AdminUpdateUserInput | null>(null);
  const [editErrors, setEditErrors] = useState<AdminUpdateUserErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = useCallback(async (activeFilters: ListUsersFilters) => {
    setIsLoading(true);
    try {
      const data = await listUsers(activeFilters);
      setUsers(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAuthSession();
          toast.error('Sessão expirada. Faça login novamente.');
          navigate('/login', { replace: true });
          return;
        }
        if (err.status === 403) {
          toast.error('Acesso negado. Apenas administradores.');
          navigate('/perfil', { replace: true });
          return;
        }
      }
      toast.error('Não foi possível carregar os usuários.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadUsers(EMPTY_FILTERS);
  }, [loadUsers]);

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    void loadUsers(filters);
  };

  const handleStartEdit = (user: PublicUser) => {
    setEditingId(user.id);
    setEditValues({
      username: user.username,
      email: user.email,
      role: user.role as UserRole,
    });
    setEditErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
    setEditErrors({});
  };

  const handleSaveEdit = async (userId: number) => {
    if (!editValues) return;

    const result = adminUpdateUserSchema.safeParse(editValues);
    if (!result.success) {
      const fieldErrors: AdminUpdateUserErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AdminUpdateUserInput;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setEditErrors(fieldErrors);
      toast.error('Verifique os campos da edição.');
      return;
    }

    setEditErrors({});
    setIsSaving(true);

    try {
      await updateUser(userId, result.data);
      toast.success('Perfil atualizado com sucesso.');
      handleCancelEdit();
      await loadUsers(filters);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          toast.error('E-mail ou nome de usuário já em uso.');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Não foi possível salvar as alterações.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthCard
      title="Gestão de usuários"
      subtitle="Painel administrativo — RBAC"
      className="max-w-4xl"
      footer="GET /users e PUT /users/:id — requer role admin"
    >
      <form onSubmit={handleFilterSubmit} className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="search"
          value={filters.search ?? ''}
          placeholder="Buscar por nome de usuário..."
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          className="rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
        <select
          value={filters.role ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              role: (e.target.value || undefined) as UserRole | undefined,
            }))
          }
          className="rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
        >
          <option value="">Todos os perfis</option>
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
        >
          Filtrar
        </button>
      </form>

      {isLoading ? (
        <p className="text-center text-sm text-slate-500">Carregando usuários...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-sm text-slate-500">Nenhum usuário encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Usuário</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">E-mail</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Perfil</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((user) => {
                const isEditing = editingId === user.id;

                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-slate-700">{user.id}</td>
                    <td className="px-4 py-3">
                      {isEditing && editValues ? (
                        <input
                          value={editValues.username}
                          onChange={(e) =>
                            setEditValues((prev) =>
                              prev ? { ...prev, username: e.target.value } : prev,
                            )
                          }
                          className="w-full min-w-[8rem] rounded-lg border border-teal-200 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        <span className="text-slate-800">{user.username}</span>
                      )}
                      {isEditing && editErrors.username && (
                        <p className="mt-1 text-xs text-red-600">{editErrors.username}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing && editValues ? (
                        <input
                          type="email"
                          value={editValues.email}
                          onChange={(e) =>
                            setEditValues((prev) =>
                              prev ? { ...prev, email: e.target.value } : prev,
                            )
                          }
                          className="w-full min-w-[10rem] rounded-lg border border-teal-200 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        <span className="text-slate-800">{user.email}</span>
                      )}
                      {isEditing && editErrors.email && (
                        <p className="mt-1 text-xs text-red-600">{editErrors.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing && editValues ? (
                        <select
                          value={editValues.role}
                          onChange={(e) =>
                            setEditValues((prev) =>
                              prev
                                ? { ...prev, role: e.target.value as UserRole }
                                : prev,
                            )
                          }
                          className="rounded-lg border border-teal-200 px-2 py-1.5 text-sm"
                        >
                          <option value="user">Usuário</option>
                          <option value="admin">Administrador</option>
                        </select>
                      ) : (
                        <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => void handleSaveEdit(user.id)}
                            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                          >
                            {isSaving ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleCancelEdit}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(user)}
                          className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        <Link to="/perfil" className="font-medium text-teal-600 hover:underline">
          Voltar ao meu perfil
        </Link>
      </p>
    </AuthCard>
  );
}
