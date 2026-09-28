import { Router } from 'express';
import { prisma, ok, fail, wrap, auth, publicUser, connectedIds, notify } from '../lib';

const r = Router();
r.use(auth);

// Connections
r.get('/connections', wrap(async (req, res) => {
  const rows = await prisma.connection.findMany({ where: { OR: [{ requesterId: req.userId }, { receiverId: req.userId }], status: { not: 'REJECTED' } },
    include: { requester: { select: publicUser }, receiver: { select: publicUser } } });
  ok(res, { connections: rows.filter(c => c.status === 'ACCEPTED').map(c => ({ id: c.id, user: c.requesterId === req.userId ? c.receiver : c.requester })),
    incoming: rows.filter(c => c.status === 'PENDING' && c.receiverId === req.userId), outgoing: rows.filter(c => c.status === 'PENDING' && c.requesterId === req.userId) });
}));
r.post('/connections/:userId', wrap(async (req, res) => {
  if (req.params.userId === req.userId) return fail(res, 'Cannot connect with yourself');
  if (await prisma.connection.findFirst({ where: { OR: [{ requesterId: req.userId, receiverId: req.params.userId }, { requesterId: req.params.userId, receiverId: req.userId }] } })) return fail(res, 'Already exists', 409);
  const c = await prisma.connection.create({ data: { requesterId: req.userId, receiverId: req.params.userId } });
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  await notify(req.params.userId, 'CONNECTION_REQUEST', `${me?.name} sent you a connection request`);
  ok(res, c, 'Request sent', 201);
}));
r.patch('/connections/:id', wrap(async (req, res) => {
  const c = await prisma.connection.findFirst({ where: { id: req.params.id, receiverId: req.userId, status: 'PENDING' } });
  if (!c) return fail(res, 'Not found', 404);
  const status = req.body.action === 'accept' ? 'ACCEPTED' : 'REJECTED';
  if (status === 'REJECTED') { await prisma.connection.delete({ where: { id: c.id } }); return ok(res, null, 'Rejected'); }
  await prisma.connection.update({ where: { id: c.id }, data: { status } });
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  await notify(c.requesterId, 'CONNECTION_ACCEPTED', `${me?.name} accepted your request`);
  ok(res, null, 'Accepted');
}));
r.delete('/connections/:id', wrap(async (req, res) => {
  await prisma.connection.deleteMany({ where: { id: req.params.id, OR: [{ requesterId: req.userId }, { receiverId: req.userId }] } }); ok(res, null, 'Removed');
}));

// Endorsements (connected developers only)
r.post('/endorse/:skillId', wrap(async (req, res) => {
  const s = await prisma.skill.findUnique({ where: { id: req.params.skillId } }); if (!s) return fail(res, 'Not found', 404);
  if (s.userId === req.userId) return fail(res, 'Cannot endorse yourself');
  if (!(await connectedIds(req.userId)).includes(s.userId)) return fail(res, 'You must be connected to endorse', 403);
  if (await prisma.endorsement.findUnique({ where: { skillId_endorserId: { skillId: s.id, endorserId: req.userId } } })) return fail(res, 'Already endorsed', 409);
  await prisma.endorsement.create({ data: { skillId: s.id, endorserId: req.userId } });
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  await notify(s.userId, 'ENDORSEMENT', `${me?.name} endorsed your ${s.name} skill`);
  ok(res, null, 'Endorsed', 201);
}));
r.delete('/endorse/:skillId', wrap(async (req, res) => { await prisma.endorsement.deleteMany({ where: { skillId: req.params.skillId, endorserId: req.userId } }); ok(res, null, 'Removed'); }));

// Notifications
r.get('/notifications', wrap(async (req, res) => ok(res, await prisma.notification.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 30 }))));
r.post('/notifications/read', wrap(async (req, res) => { await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } }); ok(res, null, 'Done'); }));

// Dashboard
r.get('/dashboard', wrap(async (req, res) => {
  const ids = await connectedIds(req.userId);
  const mySkills = (await prisma.skill.findMany({ where: { userId: req.userId } })).map(s => s.name);
  const [feed, trending, suggestions, posts, endorsements, topSkills] = await Promise.all([
    prisma.blogPost.findMany({ where: { authorId: { in: ids } }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, createdAt: true, author: { select: publicUser } } }),
    prisma.blogPost.findMany({ orderBy: { views: 'desc' }, take: 5, select: { id: true, title: true, views: true, author: { select: publicUser } } }),
    prisma.user.findMany({ where: { id: { notIn: [...ids, req.userId] }, ...(mySkills.length ? { skills: { some: { name: { in: mySkills } } } } : {}) }, select: publicUser, take: 5 }),
    prisma.blogPost.count({ where: { authorId: req.userId } }),
    prisma.endorsement.count({ where: { skill: { userId: req.userId } } }),
    prisma.skill.findMany({ where: { userId: req.userId }, select: { name: true, _count: { select: { endorsements: true } } }, orderBy: { endorsements: { _count: 'desc' } }, take: 3 }) ]);
  ok(res, { feed, trending, suggestions, topSkills, stats: { connections: ids.length, posts, endorsements } });
}));
export default r;
