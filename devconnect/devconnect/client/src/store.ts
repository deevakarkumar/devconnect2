import { create } from 'zustand';
import type { Notification } from '@devconnect/shared';
interface UI { menuOpen: boolean; toggleMenu: () => void; toasts: Notification[]; pushToast: (n: Notification) => void; clearToasts: () => void }
export const useUI = create<UI>(set => ({ menuOpen: false, toggleMenu: () => set(s => ({ menuOpen: !s.menuOpen })), toasts: [], pushToast: n => set(s => ({ toasts: [n, ...s.toasts].slice(0, 5) })), clearToasts: () => set({ toasts: [] }) }));
