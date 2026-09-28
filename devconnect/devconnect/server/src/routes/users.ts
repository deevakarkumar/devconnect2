import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import { prisma, ok, fail, wrap, auth, publicUser, connectedIds } from '../lib';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (_q, f, cb) => /^image\/(png|jpe?g|webp)$/.test(f.mimetype) ? cb(null, true) : cb(new Error('Only png/jpg/webp images allowed')) });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

// Search & discovery (paginated)
r.get('/', auth, wrap(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), take = 12;
  const q = String(req.query.q || ''), skill = String(req.query.skill || ''), location = String(req.query.location || '');
  const where = { AND: [
    q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { username: { contains: q, mode: 'insensitive' as const } }] } : {},
    skill ? { skills: { some: { name: { equals: skill, mode: 'insensitive' as const } } } } : {},
    location ? { location: { contains: location, mode: 'insensitive' as const } } : {} ] };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: { ...publicUser, skills: { select: { name: true } } }, skip: (page - 1) * take, take }),
    prisma.user.count({ where }) ]);
  ok(res, { items, total, page, pages: Math.ceil(total / take) });
}));

r.put('/me', auth, wrap(async (req, res) => {
  const p = z.object({ name: z.string().min(1).optional(), bio: z.string().max(500).nullish(), location: z.string().max(100).nullish() }).safeParse(req.body);
  if (!p.success) return fail(res, p.error.issues[0].message);
  ok(res, await prisma.user.update({ where: { id: req.userId }, data: p.data, select: publicUser }));
}));
r.post('/me/avatar', auth, upload.single('image'), wrap(async (req, res) => {
  const f = req.file; if (!f) return fail(res, 'Image (png/jpg/webp, max 2MB) required');
  const url: string = await new Promise((ok_, ko) => cloudinary.uploader.upload_stream({ folder: 'devconnect', transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }] }, (e, r_) => e || !r_ ? ko(e) : ok_(r_.secure_url)).end(f.buffer));
  ok(res, await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl: url }, select: publicUser }));
}));

// Skills
r.post('/me/skills', auth, wrap(async (req, res) => {
  const name = String(req.body.name || '').trim(); if (!name) return fail(res, 'Name required');
  ok(res, await prisma.skill.upsert({ where: { userId_name: { userId: req.userId, name } }, update: {}, create: { name, userId: req.userId } }), 'Added', 201);
}));
r.delete('/me/skills/:id', auth, wrap(async (req, res) => { await prisma.skill.deleteMany({ where: { id: req.params.id, userId: req.userId } }); ok(res, null, 'Removed'); }));

// Projects
const proj = z.object({ title: z.string().min(1), description: z.string().min(1), techStack: z.array(z.string()).default([]), liveUrl: z.string().url().nullish().or(z.literal('')), repoUrl: z.string().url().nullish().or(z.literal('')) });
r.post('/me/projects', auth, wrap(async (req, res) => {
  const p = proj.safeParse(req.body); if (!p.success) return fail(res, p.error.issues[0].message);
  ok(res, await prisma.project.create({ data: { ...p.data, liveUrl: p.data.liveUrl || null, repoUrl: p.data.repoUrl || null, userId: req.userId } }), 'Created', 201);
}));
r.put('/me/projects/:id', auth, wrap(async (req, res) => {
  const p = proj.safeParse(req.body); if (!p.success) return fail(res, p.error.issues[0].message);
  const n = await prisma.project.updateMany({ where: { id: req.params.id, userId: req.userId }, data: { ...p.data, liveUrl: p.data.liveUrl || null, repoUrl: p.data.repoUrl || null } });
  n.count ? ok(res, null, 'Updated') : fail(res, 'Not found', 404);
}));
r.delete('/me/projects/:id', auth, wrap(async (req, res) => { await prisma.project.deleteMany({ where: { id: req.params.id, userId: req.userId } }); ok(res, null, 'Deleted'); }));

// Public profile (+ connection state, mutuals, endorsement counts)
r.get('/:username', auth, wrap(async (req, res) => {
  const u = await prisma.user.findUnique({ where: { username: req.params.username }, select: { ...publicUser, projects: true,
    skills: { select: { id: true, name: true, _count: { select: { endorsements: true } }, endorsements: { where: { endorserId: req.userId }, select: { id: true } } } } } });
  if (!u) return fail(res, 'Not found', 404);
  const [mine, theirs, conn] = await Promise.all([connectedIds(req.userId), connectedIds(u.id),
    prisma.connection.findFirst({ where: { OR: [{ requesterId: req.userId, receiverId: u.id }, { requesterId: u.id, receiverId: req.userId }] } })]);
  ok(res, { ...u, isMe: u.id === req.userId, connection: conn, mutualConnections: mine.filter(i => theirs.includes(i)).length });
}));
export default r;
