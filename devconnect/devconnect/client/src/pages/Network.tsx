import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export default function Network() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['connections'], queryFn: () => api('/connections') });

  const m = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: Error) => alert(e.message),
  });

  if (q.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="card h-48 bg-slate-900/40" />
        <div className="card h-64 bg-slate-900/40" />
      </div>
    );
  }

  if (q.error) {
    return (
      <div className="card border-rose-900/40 bg-rose-950/20 text-rose-300 p-6 text-center">
        <p className="font-semibold">Unable to load connections</p>
        <p className="text-xs text-rose-400 mt-1">{(q.error as Error).message}</p>
      </div>
    );
  }

  const { connections = [], incoming = [], outgoing = [] } = q.data ?? {};

  return (
    <div className="space-y-6">
      {/* Network Header Banner */}
      <div className="card bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border-indigo-500/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Developer Network & Connections
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Connect with peers, endorse their verified skills, and view their latest technical blogs.
          </p>
        </div>
        <Link to="/search" className="btn text-xs py-2 shrink-0">
          <span>🔍 Find More Peers</span>
        </Link>
      </div>

      {/* Connection Requests (Incoming & Outgoing) */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-white">Pending Requests</h2>
            {incoming.length > 0 && (
              <span className="badge badge-brand text-[10px]">
                {incoming.length} incoming
              </span>
            )}
          </div>
          {outgoing.length > 0 && (
            <span className="text-xs text-slate-400">
              {outgoing.length} outgoing request{outgoing.length === 1 ? '' : 's'} waiting
            </span>
          )}
        </div>

        {incoming.length ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {incoming.map((c: any) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-3"
              >
                <Link
                  to={`/u/${c.requester?.username ?? ''}`}
                  className="flex items-center gap-3 group min-w-0"
                >
                  <img
                    src={
                      c.requester?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(c.requester?.name || 'Dev')}&background=4f46e5&color=fff`
                    }
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 group-hover:ring-indigo-500 transition-all shrink-0"
                    alt=""
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors truncate">
                      {c.requester?.name ?? 'User'}
                    </p>
                    <p className="text-[11px] text-indigo-400 font-mono">
                      @{c.requester?.username}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="btn text-xs py-1 px-3"
                    onClick={() =>
                      m.mutate(() =>
                        api(`/connections/${c.id}`, { method: 'PATCH', body: { action: 'accept' } })
                      )
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="btn-ghost text-xs py-1 px-2.5 text-slate-400 hover:text-rose-400"
                    onClick={() =>
                      m.mutate(() =>
                        api(`/connections/${c.id}`, { method: 'PATCH', body: { action: 'reject' } })
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs">
            No incoming connection requests at this time.
          </div>
        )}
      </section>

      {/* Established Connections */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-white">Your Connections</h2>
            <span className="badge badge-slate text-[10px]">
              {connections.length} total
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Connected peers can endorse each other's skills
          </span>
        </div>

        {connections.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((c: any) => (
              <div
                key={c.id}
                className="card card-hover flex flex-col justify-between p-4 bg-slate-950/40 border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      c.user?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'Dev')}&background=4f46e5&color=fff`
                    }
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/u/${c.user?.username ?? ''}`}
                      className="font-bold text-sm text-white hover:text-indigo-400 transition-colors block truncate"
                    >
                      {c.user?.name ?? 'User'}
                    </Link>
                    <p className="text-xs text-indigo-400 font-mono">@{c.user?.username}</p>
                    {c.user?.location && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        📍 {c.user.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-900 mt-3">
                  <Link
                    to={`/u/${c.user?.username ?? ''}`}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    View & Endorse →
                  </Link>

                  <button
                    className="btn-ghost text-[11px] py-1 px-2 text-slate-500 hover:text-rose-400 hover:border-rose-900/40"
                    onClick={() => {
                      if (confirm(`Remove connection with ${c.user?.name}?`)) {
                        m.mutate(() => api(`/connections/${c.id}`, { method: 'DELETE' }));
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs space-y-3">
            <p className="text-3xl">👥</p>
            <p className="font-semibold text-slate-300">You haven't connected with any developers yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Connecting allows you to endorse each other's skills and see activity updates on your dashboard.
            </p>
            <Link to="/search" className="btn text-xs inline-flex mt-2">
              Discover developers to connect
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

