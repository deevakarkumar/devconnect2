import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import type { Server } from 'socket.io';

export const prisma = new PrismaClient();
export const isProd = process.env.NODE_ENV === 'production';
export const ok = (res: Response, data: unknown, message = 'OK', code = 200) => res.status(code).json({ success: true, data, message });
export const fail = (res: Response, message: string, code = 400) => res.status(code).json({ success: false, data: null, message });
export const setAuthCookie = (res: Response, id: string) =>
  res.cookie('token', jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' }), { httpOnly: true, sameSite: isProd ? 'none' : 'lax', secure: isProd, maxAge: 7 * 864e5 });

export interface AuthReq extends Request { userId: string }
export const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;
    if (!token) return fail(res, 'Unauthorized', 401);
    (req as AuthReq).userId = (jwt.verify(token, process.env.JWT_SECRET!) as { id: string }).id;
    return next();
  } catch {
    return fail(res, 'Unauthorized', 401);
  }
};
export const wrap = (fn: (req: AuthReq, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req as AuthReq, res)).catch(next);

let io: Server | undefined;
export const setIO = (s: Server) => { io = s; };
export async function notify(userId: string, type: string, message: string) {
  const n = await prisma.notification.create({ data: { userId, type, message } });
  io?.to(`user:${userId}`).emit('notification', n);
}
export const publicUser = { id: true, username: true, name: true, bio: true, location: true, avatarUrl: true } as const;
export async function connectedIds(userId: string): Promise<string[]> {
  const rows = await prisma.connection.findMany({
    where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { receiverId: userId }] },
    select: { requesterId: true, receiverId: true },
  });
  return [...new Set<string>(rows.map((r: { requesterId: string; receiverId: string }) => (r.requesterId === userId ? r.receiverId : r.requesterId)))];
}
