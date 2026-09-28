# DevConnect — Shared (TypeScript Contracts & Types)

This package contains shared TypeScript interfaces and models consumed by both the frontend client and backend server to guarantee end-to-end type safety.

## 📦 Exported Types

- `ApiResponse<T>`: Standard envelope `{ success: boolean, data: T, message: string }`
- `User`: Public user profile representation
- `Skill`: Skill entity with endorsement count
- `Project`: Project showcase item with tech stack array and links
- `BlogPost`: Technical article model with views and author relationship
- `ConnectionStatus`: `'PENDING' | 'ACCEPTED' | 'REJECTED'`
- `Notification`: Real-time notification entity
