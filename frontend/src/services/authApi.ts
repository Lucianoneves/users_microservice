const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AuthResponse {
  id: number;
  token: string;
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

export function saveAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}
