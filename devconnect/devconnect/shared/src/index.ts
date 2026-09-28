export interface ApiResponse<T> { success: boolean; data: T; message: string }
export interface User { id: string; email: string; username: string; name: string; bio?: string | null; location?: string | null; avatarUrl?: string | null }
export interface Skill { id: string; name: string; _count?: { endorsements: number } }
export interface Project { id: string; title: string; description: string; techStack: string[]; liveUrl?: string | null; repoUrl?: string | null }
export interface BlogPost { id: string; title: string; content: string; views: number; createdAt: string; author?: User }
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export interface Notification { id: string; type: string; message: string; read: boolean; createdAt: string }
