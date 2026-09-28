import request from 'supertest';
import { app } from './app';
describe('API', () => {
  it('health returns consistent envelope', async () => { const r = await request(app).get('/api/health'); expect(r.body).toEqual({ success: true, data: null, message: 'ok' }); });
  it('protects routes', async () => { const r = await request(app).get('/api/users'); expect(r.status).toBe(401); expect(r.body.success).toBe(false); });
});
