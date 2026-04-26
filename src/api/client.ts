import { supabase } from '@/lib/supabase';

const FUNCTIONS_URL = import.meta.env['VITE_SUPABASE_FUNCTIONS_URL'] as string;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new ApiError(
      (body as { error?: string }).error ?? 'Erreur inconnue',
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

export async function apiFetchMultipart<T>(
  path: string,
  body: FormData,
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    method: 'POST',
    headers: authHeaders,
    body,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new ApiError(
      (data as { error?: string }).error ?? 'Erreur inconnue',
      res.status,
    );
  }

  return res.json() as Promise<T>;
}
