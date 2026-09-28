import type { ApiResponse } from '@devconnect/shared';
export const API = import.meta.env.VITE_API_URL || '';
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const res = await fetch(`${API}/api${path}`, { method: opts.method || (opts.body || opts.form ? 'POST' : 'GET'), credentials: 'include',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined, body: opts.form ?? (opts.body ? JSON.stringify(opts.body) : undefined) });
  const json: ApiResponse<T> = await res.json().catch(() => ({ success: false, data: null as T, message: 'Network error' }));
  if (!json.success) throw new Error(json.message);
  return json.data;
}
