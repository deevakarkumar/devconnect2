import { Router } from 'express';
import { z } from 'zod';
import { prisma, ok, fail, wrap, auth, publicUser } from '../lib';

const r = Router();
const body = z.object({ title: z.string().min(1).max(200), content: z.string().min(1) });
r.get('/', auth, wrap(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const where = req.query.author ? { author: { username: String(req.query.author) } } : {};
  ok(res, await prisma.blogPost.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 10, take: 10, select: { id: true, title: true, views: true, createdAt: true, author: { select: publicUser } } }));
}));
r.get('/:id', auth, wrap(async (req, res) => {
  const p = await prisma.blogPost.update({ where: { id: req.params.id }, data: { views: { increment: 1 } }, include: { author: { select: publicUser } } }).catch(() => null);
  p ? ok(res, p) : fail(res, 'Not found', 404);
}));
r.post('/', auth, wrap(async (req, res) => {
  const p = body.safeParse(req.body); if (!p.success) return fail(res, p.error.issues[0].message);
  ok(res, await prisma.blogPost.create({ data: { ...p.data, authorId: req.userId } }), 'Created', 201);
}));
r.put('/:id', auth, wrap(async (req, res) => {
  const p = body.safeParse(req.body); if (!p.success) return fail(res, p.error.issues[0].message);
  const n = await prisma.blogPost.updateMany({ where: { id: req.params.id, authorId: req.userId }, data: p.data });
  n.count ? ok(res, null, 'Updated') : fail(res, 'Not found', 404);
}));
r.delete('/:id', auth, wrap(async (req, res) => { await prisma.blogPost.deleteMany({ where: { id: req.params.id, authorId: req.userId } }); ok(res, null, 'Deleted'); }));
export default r;
