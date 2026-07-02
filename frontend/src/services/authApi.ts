const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'auth_user_id';

export interface AuthResponse {
  id: number;
  token: string;
}

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}): Promise<AuthResponse> {
  return request<AuthResponse>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function saveAuthSession(auth: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_ID_KEY, String(auth.id));
}

/** @deprecated Use saveAuthSession */
export function saveAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUserId(): number | null {
  const id = localStorage.getItem(USER_ID_KEY);
  if (!id) return null;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export function getAuthRole(): string | null {
  const token = getAuthToken();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export async function fetchUserProfile(userId: number): Promise<PublicUser> {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError('Unauthorized', 401);
  }

  return request<PublicUser>(`/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
