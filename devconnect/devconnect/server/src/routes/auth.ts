import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma, ok, fail, wrap, setAuthCookie, auth, publicUser } from '../lib';

const r = Router();
const reg = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1), username: z.string().regex(/^[a-z0-9_]{3,20}$/i) });

r.post('/register', wrap(async (req, res) => {
  const p = reg.safeParse(req.body); if (!p.success) return fail(res, p.error.issues[0].message);
  if (await prisma.user.findFirst({ where: { OR: [{ email: p.data.email }, { username: p.data.username }] } })) return fail(res, 'Email or username taken', 409);
  const u = await prisma.user.create({ data: { email: p.data.email, name: p.data.name, username: p.data.username, passwordHash: await bcrypt.hash(p.data.password, 10) } });
  setAuthCookie(res, u.id); ok(res, { id: u.id }, 'Registered', 201);
}));
r.post('/login', wrap(async (req, res) => {
  const u = await prisma.user.findUnique({ where: { email: String(req.body.email) } });
  if (!u?.passwordHash || !(await bcrypt.compare(String(req.body.password), u.passwordHash))) return fail(res, 'Invalid credentials', 401);
  setAuthCookie(res, u.id); ok(res, { id: u.id }, 'Logged in');
}));
r.post('/logout', (_q, res) => { res.clearCookie('token'); ok(res, null, 'Logged out'); });
r.get('/me', auth, wrap(async (req, res) => ok(res, await prisma.user.findUnique({ where: { id: req.userId }, select: { ...publicUser, email: true } }))));

r.get('/github', (_q, res) => res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=read:user%20user:email&redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL!)}`));
r.get('/github/callback', wrap(async (req, res) => {
  const tk = await (await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code: req.query.code }) })).json() as { access_token?: string };
  if (!tk.access_token) return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
  const h = { Authorization: `Bearer ${tk.access_token}`, 'User-Agent': 'devconnect' };
  const gh = await (await fetch('https://api.github.com/user', { headers: h })).json() as { id: number; login: string; name?: string; avatar_url: string; bio?: string; location?: string; email?: string };
  const emails = await (await fetch('https://api.github.com/user/emails', { headers: h })).json() as { email: string; primary: boolean }[];
  const email = gh.email || emails.find(e => e.primary)?.email || `${gh.login}@users.noreply.github.com`;
  let u = await prisma.user.findFirst({ where: { OR: [{ githubId: String(gh.id) }, { email }] } });
  u = u ? await prisma.user.update({ where: { id: u.id }, data: { githubId: String(gh.id) } })
        : await prisma.user.create({ data: { githubId: String(gh.id), email, username: gh.login.toLowerCase(), name: gh.name || gh.login, avatarUrl: gh.avatar_url, bio: gh.bio, location: gh.location } });
  setAuthCookie(res, u.id); res.redirect(`${process.env.CLIENT_URL}/dashboard`);
}));
export default r;
