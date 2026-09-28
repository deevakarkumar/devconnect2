import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DevConnect database...');
  console.log('Hashing password...');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  console.log('Connecting to Prisma...');
  await prisma.$connect();
  console.log('Prisma connected! Upserting users...');
  const alex = await prisma.user.upsert({
    where: { email: 'alex@devconnect.dev' },
    update: {},
    create: {
      email: 'alex@devconnect.dev',
      username: 'alexrivera',
      name: 'Alex Rivera',
      passwordHash,
      bio: 'Full-stack distributed systems engineer. Building real-time tools, React 19 interfaces, and scalable PostgreSQL architectures.',
      location: 'San Francisco, CA',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@devconnect.dev' },
    update: {},
    create: {
      email: 'sarah@devconnect.dev',
      username: 'sarahchen',
      name: 'Sarah Chen',
      passwordHash,
      bio: 'Senior Frontend Architect & Web Performance enthusiast. Passionate about TypeScript, React internals, and design systems.',
      location: 'Seattle, WA',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    },
  });

  const marcus = await prisma.user.upsert({
    where: { email: 'marcus@devconnect.dev' },
    update: {},
    create: {
      email: 'marcus@devconnect.dev',
      username: 'marcusdev',
      name: 'Marcus Vance',
      passwordHash,
      bio: 'Cloud Native & DevOps Engineer. Kubernetes, Go microservices, and high-throughput streaming pipelines.',
      location: 'Austin, TX',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
  });

  const priya = await prisma.user.upsert({
    where: { email: 'priya@devconnect.dev' },
    update: {},
    create: {
      email: 'priya@devconnect.dev',
      username: 'priyasharma',
      name: 'Priya Sharma',
      passwordHash,
      bio: 'AI Engineer & Full Stack Developer. Fine-tuning LLMs, building semantic search engines, and craft UI interactions.',
      location: 'Bengaluru, India',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    },
  });

  // Skills
  const skillsData = [
    { userId: alex.id, name: 'TypeScript' },
    { userId: alex.id, name: 'React' },
    { userId: alex.id, name: 'Node.js' },
    { userId: alex.id, name: 'PostgreSQL' },
    { userId: alex.id, name: 'Socket.io' },

    { userId: sarah.id, name: 'TypeScript' },
    { userId: sarah.id, name: 'React' },
    { userId: sarah.id, name: 'Tailwind CSS' },
    { userId: sarah.id, name: 'Next.js' },
    { userId: sarah.id, name: 'Web Performance' },

    { userId: marcus.id, name: 'Docker' },
    { userId: marcus.id, name: 'Kubernetes' },
    { userId: marcus.id, name: 'PostgreSQL' },
    { userId: marcus.id, name: 'Go' },
    { userId: marcus.id, name: 'AWS' },

    { userId: priya.id, name: 'Python' },
    { userId: priya.id, name: 'TypeScript' },
    { userId: priya.id, name: 'React' },
    { userId: priya.id, name: 'PyTorch' },
    { userId: priya.id, name: 'FastAPI' },
  ];

  for (const s of skillsData) {
    await prisma.skill.upsert({
      where: { userId_name: { userId: s.userId, name: s.name } },
      update: {},
      create: s,
    });
  }

  // Connections
  await prisma.connection.upsert({
    where: { requesterId_receiverId: { requesterId: alex.id, receiverId: sarah.id } },
    update: { status: 'ACCEPTED' },
    create: { requesterId: alex.id, receiverId: sarah.id, status: 'ACCEPTED' },
  });

  await prisma.connection.upsert({
    where: { requesterId_receiverId: { requesterId: sarah.id, receiverId: priya.id } },
    update: { status: 'ACCEPTED' },
    create: { requesterId: sarah.id, receiverId: priya.id, status: 'ACCEPTED' },
  });

  await prisma.connection.upsert({
    where: { requesterId_receiverId: { requesterId: marcus.id, receiverId: alex.id } },
    update: { status: 'ACCEPTED' },
    create: { requesterId: marcus.id, receiverId: alex.id, status: 'ACCEPTED' },
  });

  // Endorsements
  const alexTs = await prisma.skill.findUnique({ where: { userId_name: { userId: alex.id, name: 'TypeScript' } } });
  if (alexTs) {
    await prisma.endorsement.upsert({
      where: { skillId_endorserId: { skillId: alexTs.id, endorserId: sarah.id } },
      update: {},
      create: { skillId: alexTs.id, endorserId: sarah.id },
    });
    await prisma.endorsement.upsert({
      where: { skillId_endorserId: { skillId: alexTs.id, endorserId: marcus.id } },
      update: {},
      create: { skillId: alexTs.id, endorserId: marcus.id },
    });
  }

  const sarahReact = await prisma.skill.findUnique({ where: { userId_name: { userId: sarah.id, name: 'React' } } });
  if (sarahReact) {
    await prisma.endorsement.upsert({
      where: { skillId_endorserId: { skillId: sarahReact.id, endorserId: alex.id } },
      update: {},
      create: { skillId: sarahReact.id, endorserId: alex.id },
    });
  }

  // Projects
  const existingProjects = await prisma.project.count();
  if (existingProjects === 0) {
    await prisma.project.createMany({
      data: [
        {
          userId: alex.id,
          title: 'PulseMQ — High Throughput Event Streamer',
          description: 'A lightweight distributed message broker with sub-millisecond dispatching, written in Go and Node.js with WebSocket streaming.',
          techStack: ['TypeScript', 'Node.js', 'Redis', 'WebSockets', 'Docker'],
          liveUrl: 'https://pulsemq-demo.dev',
          repoUrl: 'https://github.com/alexrivera/pulsemq',
        },
        {
          userId: alex.id,
          title: 'HyperSchema — Visual DB Modeler',
          description: 'Interactive canvas for relational database schemas with auto-generated Prisma migrations and SQL export capabilities.',
          techStack: ['React', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'],
          liveUrl: 'https://hyperschema.dev',
          repoUrl: 'https://github.com/alexrivera/hyperschema',
        },
        {
          userId: sarah.id,
          title: 'Aura UI — Headless Component Engine',
          description: 'Accessible, zero-runtime overhead component primitives with fluid animation micro-interactions and dark mode tokens.',
          techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vitest'],
          liveUrl: 'https://auraui.dev',
          repoUrl: 'https://github.com/sarahchen/aura-ui',
        },
        {
          userId: priya.id,
          title: 'Synapse — Local Embedding Search',
          description: 'In-browser vector similarity engine leveraging WebAssembly for fast semantic search across markdown documentation.',
          techStack: ['TypeScript', 'WebAssembly', 'Python', 'FastAPI'],
          liveUrl: 'https://synapse-ai.dev',
          repoUrl: 'https://github.com/priyasharma/synapse',
        },
      ],
    });
  }

  // Blog Posts
  const existingPosts = await prisma.blogPost.count();
  if (existingPosts === 0) {
    await prisma.blogPost.create({
      data: {
        authorId: alex.id,
        title: 'Mastering Full-Stack TypeScript: Monorepo Architecture with Prisma & React 19',
        content: `### Why Monorepos Win for Modern Web Apps

Sharing contracts between your client and server eliminates an entire class of synchronization bugs. In this guide, we dive into building a full-stack platform using:

1. **Shared Workspace**: Common TypeScript models and validation contracts
2. **Prisma ORM**: Type-safe database queries against PostgreSQL
3. **React Query & Zustand**: Pristine server state synchronization paired with ultra-fast local state

\`\`\`typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Consistent envelopes make client error handling effortless
export const ok = <T>(res: Response, data: T) => 
  res.status(200).json({ success: true, data, message: 'OK' });
\`\`\`

#### Real-Time Synergy with Socket.io

WebSockets are ideal for instant notification delivery when a peer sends you a connection request or endorses your verified skill.`,
        views: 142,
      },
    });

    await prisma.blogPost.create({
      data: {
        authorId: sarah.id,
        title: 'Zero to Production: Optimizing React 19 Render Cycles and Micro-Animations',
        content: `### The Evolution of Frontend Responsiveness

Modern user interfaces shouldn't just be functional — they need to feel alive and tactile. By combining subtle micro-interactions, dark glassmorphism, and hardware-accelerated transitions, user retention skyrockets.

\`\`\`css
/* Radial glow ambient lighting */
background-image: 
  radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%),
  radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.08) 0px, transparent 50%);
\`\`\`

Always compress user avatar uploads client-side via canvas before dispatching them to Cloudinary to preserve bandwidth!`,
        views: 89,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
