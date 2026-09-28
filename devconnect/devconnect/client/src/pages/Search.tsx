import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api';

export default function Search() {
  const [f, setF] = useState({ q: '', skill: '', location: '' });
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ ...f, page: String(page) }).toString();
  const q = useQuery({
    queryKey: ['search', qs],
    queryFn: () => api(`/users?${qs}`),
    placeholderData: keepPreviousData,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setPage(1);
  };

  const clearFilters = () => {
    setF({ q: '', skill: '', location: '' });
    setPage(1);
  };

  const hasFilters = Boolean(f.q || f.skill || f.location);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/60 border-blue-500/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Discover Developers & Engineers
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Find collaborators, mentor peers, and expand your engineering circle by skills and location.
          </p>
        </div>
        {hasFilters && (
          <button className="btn-ghost text-xs self-start sm:self-auto" onClick={clearFilters}>
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4 bg-slate-900/90 border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Search by Name / Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            <input
              className="input pl-8 text-xs"
              placeholder="e.g. Sarah or @sarahdev"
              value={f.q}
              onChange={set('q')}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Filter by Skill
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">⚡</span>
            <input
              className="input pl-8 text-xs"
              placeholder="e.g. TypeScript, React, Rust"
              value={f.skill}
              onChange={set('skill')}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Filter by Location
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">📍</span>
            <input
              className="input pl-8 text-xs"
              placeholder="e.g. Berlin, Remote, Tokyo"
              value={f.location}
              onChange={set('location')}
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {q.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-48 bg-slate-900/40" />
          ))}
        </div>
      ) : (q.data?.items ?? []).length ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing {q.data?.items?.length ?? 0} of {q.data?.total ?? 0} developers
            </span>
            <span>
              Page {page} of {q.data?.pages || 1}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(q.data?.items ?? []).map((u: any) => (
              <Link
                key={u.id}
                to={`/u/${u.username}`}
                className="card card-hover flex flex-col justify-between p-5 bg-slate-900/80 border-slate-800/80 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        u.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4f46e5&color=fff`
                      }
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700 group-hover:ring-indigo-500 transition-all shrink-0"
                      alt=""
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                        {u.name}
                      </h3>
                      <p className="text-xs text-indigo-400 font-mono">@{u.username}</p>
                      {u.location && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>📍</span>
                          <span className="truncate">{u.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {u.bio && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {u.bio}
                    </p>
                  )}
                </div>

                {/* Skills Preview */}
                <div className="pt-3 border-t border-slate-800/80 mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {(u.skills ?? []).length ? (
                      (u.skills ?? []).slice(0, 4).map((s: any) => (
                        <span key={s.name} className="badge badge-brand text-[10px]">
                          {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No skills listed yet</span>
                    )}
                    {(u.skills ?? []).length > 4 && (
                      <span className="badge badge-slate text-[10px]">
                        +{u.skills.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform font-semibold inline-flex items-center gap-1">
                      View Profile →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {(q.data?.pages || 1) > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                className="btn-ghost text-xs py-1.5 px-3"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-400 font-semibold">
                Page {page} of {q.data?.pages || 1}
              </span>
              <button
                className="btn-ghost text-xs py-1.5 px-3"
                disabled={page >= (q.data?.pages || 1)}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card py-16 text-center text-slate-500 text-sm space-y-2">
          <p className="text-3xl">🔍</p>
          <p className="font-semibold text-slate-300">No developers matched your filters.</p>
          <p className="text-xs text-slate-500">
            Try adjusting your search terms or clearing the filter fields.
          </p>
          <button className="btn text-xs mt-3 inline-flex" onClick={clearFilters}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

