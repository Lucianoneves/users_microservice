import { ApiError, getAuthToken, type PublicUser } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type UserRole = 'user' | 'admin';

export interface ListUsersFilters {
  role?: UserRole;
  search?: string;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  role?: UserRole;
}

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError('Unauthorized', 401);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new ApiError(data.error ?? 'Request failed', response.status);
  }

  return data as T;
}

function buildQuery(filters: ListUsersFilters): string {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listUsers(filters: ListUsersFilters = {}): Promise<PublicUser[]> {
  return authRequest<PublicUser[]>(`/users${buildQuery(filters)}`);
}

export async function updateUser(userId: number, input: UpdateUserInput): Promise<void> {
  await authRequest<{ updated: boolean }>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteUser(userId: number): Promise<void> {
  await authRequest<{ deleted: boolean }>(`/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function listDeletedUsers(): Promise<PublicUser[]> {
  return authRequest<PublicUser[]>('/users/deleted');
}

export async function restoreUser(userId: number): Promise<void> {
  await authRequest<{ restored: boolean }>(`/users/${userId}/restore`, {
    method: 'POST',
  });
}
