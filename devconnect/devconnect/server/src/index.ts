import 'dotenv/config';
import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { app } from './app';
import { setIO } from './lib';

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL, credentials: true } });
io.use((s, next) => {
  try {
    const token = /(?:^|;\s*)token=([^;]+)/.exec(s.handshake.headers.cookie || '')?.[1];
    s.data.userId = (jwt.verify(token!, process.env.JWT_SECRET!) as { id: string }).id; next();
  } catch { next(new Error('unauthorized')); }
});
io.on('connection', s => s.join(`user:${s.data.userId}`));
setIO(io);
server.listen(process.env.PORT || 4000, () => console.log('API on', process.env.PORT || 4000));
