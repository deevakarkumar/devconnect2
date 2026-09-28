import { useEffect } from 'react';
import { Routes, Route, Navigate, Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { api, API } from './api';
import { useUI } from './store';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Network from './pages/Network';
import { Blog, Post, Editor } from './pages/Blog';

const Spinner = () => (
  <div className="min-h-screen grid place-items-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-slate-400 text-sm font-medium animate-pulse">Loading DevConnect…</p>
    </div>
  </div>
);

function Shell() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { menuOpen, toggleMenu, toasts, pushToast, clearToasts } = useUI();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api('/auth/me'), retry: false });
  const notes = useQuery({ queryKey: ['notes'], queryFn: () => api<any[]>('/notifications'), enabled: !!me.data });

  useEffect(() => {
    if (!me.data) return;
    const s = io(API || undefined, { withCredentials: true });
    s.on('notification', (n) => {
      pushToast(n);
      qc.invalidateQueries({ queryKey: ['notes'] });
      qc.invalidateQueries({ queryKey: ['connections'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    });
    return () => {
      s.close();
    };
  }, [me.data?.id]);

  if (me.isLoading) return <Spinner />;
  if (!me.data) return <Navigate to="/login" replace />;

  const unread = notes.data?.filter((n) => !n.read).length || 0;
  const navLinks: { to: string; label: string; icon: string }[] = [
    { to: '/dashboard', label: 'Dashboard', icon: '⚡' },
    { to: '/search', label: 'Discover', icon: '🔍' },
    { to: '/network', label: 'Network', icon: '👥' },
    { to: '/blog', label: 'Blog', icon: '✍️' },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-10 flex flex-col">
      {/* Modern Glass Navbar */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                &lt;/&gt;
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                DevConnect
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <span className="text-sm opacity-80">{icon}</span>
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right Action Icons & User */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                className="w-9 h-9 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all relative"
                aria-label="Notifications"
                onClick={() => {
                  toggleMenu();
                  if (!menuOpen && unread > 0) {
                    api('/notifications/read', { method: 'POST', body: {} }).then(() => {
                      qc.invalidateQueries({ queryKey: ['notes'] });
                    });
                  }
                }}
              >
                <span className="text-base">🔔</span>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center shadow-lg shadow-rose-500/50 animate-pulse">
                    {unread}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
                    <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                      <span>Notifications</span>
                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          {unread} new
                        </span>
                      )}
                    </span>
                    <button
                      className="text-xs text-slate-400 hover:text-indigo-400 transition"
                      onClick={() => {
                        api('/notifications/read', { method: 'POST', body: {} }).then(() => {
                          qc.invalidateQueries({ queryKey: ['notes'] });
                        });
                      }}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {notes.data?.length ? (
                      notes.data.slice(0, 12).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            !n.read
                              ? 'bg-indigo-950/30 border-indigo-500/30 text-slate-200'
                              : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="leading-snug">{n.message}</p>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Username Pill */}
            <Link
              to={`/u/${me.data.username}`}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all group"
            >
              <img
                src={me.data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(me.data.name)}&background=4f46e5&color=fff`}
                className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-700 group-hover:ring-indigo-500 transition-all"
                alt=""
              />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white hidden sm:inline">
                @{me.data.username}
              </span>
            </Link>

            {/* Logout Button */}
            <button
              className="btn-ghost text-xs py-1.5 px-3"
              onClick={async () => {
                await api('/auth/logout', { method: 'POST', body: {} });
                qc.clear();
                nav('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 flex justify-around py-2.5 px-2 z-40">
        {navLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-medium transition-all ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Real-time Toasts (Top-Right Floating) */}
      <div className="fixed top-16 right-4 space-y-2 z-50 pointer-events-none">
        {toasts.slice(0, 3).map((t) => (
          <div
            key={t.id}
            onClick={clearToasts}
            className="pointer-events-auto bg-slate-900/95 border border-indigo-500/40 text-slate-100 text-xs rounded-xl p-3 shadow-2xl shadow-indigo-500/10 flex items-center gap-3 backdrop-blur-xl animate-in slide-in-from-right-5 cursor-pointer max-w-sm"
          >
            <span className="text-lg">⚡</span>
            <div>
              <p className="font-semibold text-indigo-400">DevConnect Alert</p>
              <p className="text-slate-300">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Shell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/network" element={<Network />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/new" element={<Editor />} />
        <Route path="/blog/:id/edit" element={<Editor />} />
        <Route path="/blog/:id" element={<Post />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

