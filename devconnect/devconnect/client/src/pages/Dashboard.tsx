import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export default function Dashboard() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => api('/dashboard') });
  const connectMutation = useMutation({
    mutationFn: (userId: string) => api(`/connections/${userId}`, { method: 'POST', body: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  if (q.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-28 bg-slate-900/40" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card h-64 bg-slate-900/40" />
          <div className="card h-64 bg-slate-900/40" />
        </div>
      </div>
    );
  }

  if (q.error) {
    return (
      <div className="card border-rose-900/40 bg-rose-950/20 text-rose-300 p-6 text-center">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="text-xs text-rose-400 mt-1">{(q.error as Error).message}</p>
      </div>
    );
  }

  const d = q.data ?? {
    stats: { connections: 0, posts: 0, endorsements: 0 },
    feed: [],
    trending: [],
    suggestions: [],
    topSkills: [],
  };

  const statCards = [
    { label: 'Network Connections', value: d.stats.connections, icon: '👥', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30' },
    { label: 'Published Posts', value: d.stats.posts, icon: '✍️', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
    { label: 'Skill Endorsements', value: d.stats.endorsements, icon: '⭐', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border-indigo-500/30 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Developer Feed & Insights
          </h1>
          <p className="text-slate-400 text-sm">
            Stay in sync with your peer network, showcase code, and publish technical insights.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/blog/new" className="btn text-xs py-2">
            <span>✍️ Write Post</span>
          </Link>
          <Link to="/search" className="btn-secondary text-xs py-2">
            <span>🔍 Find Devs</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`card bg-gradient-to-br ${s.color} ${s.border} flex items-center justify-between p-5`}
          >
            <div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {s.value}
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">
                {s.label}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-center text-xl shadow-inner">
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <span>⚡</span> Activity Feed
            </h2>
            <span className="text-xs text-slate-400">Network Updates</span>
          </div>

          {d.feed.length ? (
            <div className="space-y-3">
              {d.feed.map((p: any) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.id}`}
                  className="card card-hover block p-3.5 bg-slate-950/40 border-slate-800/60"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <img
                      src={p.author?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.author?.name || 'Dev')}&background=4f46e5&color=fff`}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                      alt=""
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      {p.author?.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      @{p.author?.username} · {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-indigo-300 line-clamp-1">{p.title}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs space-y-2">
              <p className="text-2xl">🌱</p>
              <p>No activity yet from your connections.</p>
              <Link to="/search" className="text-indigo-400 hover:underline inline-block">
                Discover developers to follow & connect →
              </Link>
            </div>
          )}
        </section>

        {/* Trending Posts */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <span>🔥</span> Trending Articles
            </h2>
            <Link to="/blog" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </div>

          {d.trending.length ? (
            <div className="space-y-3">
              {d.trending.map((p: any, idx: number) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.id}`}
                  className="card card-hover flex items-center justify-between p-3.5 bg-slate-950/40 border-slate-800/60 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-600 group-hover:text-indigo-400 transition-colors w-4">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        by {p.author?.name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-brand text-[10px] shrink-0">
                    👁️ {p.views ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs">
              No trending articles yet. Write the first one!
            </div>
          )}
        </section>

        {/* People You May Know */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <span>💡</span> Recommended Peers
            </h2>
            <Link to="/search" className="text-xs text-indigo-400 hover:underline">
              Explore
            </Link>
          </div>

          {d.suggestions.length ? (
            <div className="space-y-2.5">
              {d.suggestions.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60"
                >
                  <Link to={`/u/${u.username}`} className="flex items-center gap-3 group">
                    <img
                      src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4f46e5&color=fff`}
                      className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 group-hover:ring-indigo-500 transition-all"
                      alt=""
                    />
                    <div>
                      <p className="font-semibold text-xs text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-500">@{u.username}</p>
                    </div>
                  </Link>

                  <button
                    className="btn text-xs py-1 px-3"
                    disabled={connectMutation.isPending}
                    onClick={() => connectMutation.mutate(u.id)}
                  >
                    + Connect
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No new recommendations at this time.
            </div>
          )}
        </section>

        {/* Top Endorsed Skills */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <span>🏆</span> Your Top Skills
            </h2>
            <span className="text-xs text-slate-400">Peer Validated</span>
          </div>

          {d.topSkills.length ? (
            <div className="space-y-2.5">
              {d.topSkills.map((s: any) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60"
                >
                  <span className="font-semibold text-xs text-slate-200">{s.name}</span>
                  <span className="badge badge-brand">
                    ⭐ {s._count?.endorsements ?? 0} endorsements
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs space-y-2">
              <p>Add skills to your profile to get endorsed by peers!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

