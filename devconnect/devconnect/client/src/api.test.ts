import { describe, it, expect, vi } from 'vitest';
import { api } from './api';
describe('api', () => {
  it('unwraps success envelope', async () => { globalThis.fetch = vi.fn().mockResolvedValue({ json: async () => ({ success: true, data: { a: 1 }, message: 'ok' }) }) as any; expect(await api('/x')).toEqual({ a: 1 }); });
  it('throws message on failure', async () => { globalThis.fetch = vi.fn().mockResolvedValue({ json: async () => ({ success: false, data: null, message: 'nope' }) }) as any; await expect(api('/x')).rejects.toThrow('nope'); });
});
