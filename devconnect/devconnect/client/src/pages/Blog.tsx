import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { api } from '../api';

export function Blog() {
  const q = useQuery({ queryKey: ['posts'], queryFn: () => api<any[]>('/posts') });

  return (
    <div className="space-y-6">
      {/* Blog Header Banner */}
      <div className="card bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/60 border-purple-500/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Technical Blog & Engineering Notes
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deep dives, architecture patterns, and lessons learned from the community.
          </p>
        </div>
        <Link to="/blog/new" className="btn text-xs py-2 shrink-0">
          <span>✍️ Write Article</span>
        </Link>
      </div>

      {/* Posts List */}
      {q.isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 bg-slate-900/40" />
          ))}
        </div>
      ) : (q.data ?? []).length ? (
        <div className="space-y-4">
          {(q.data ?? []).map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.id}`}
              className="card card-hover block p-5 bg-slate-900/80 border-slate-800/80 group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <img
                  src={
                    p.author?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(p.author?.name || 'Author')}&background=4f46e5&color=fff`
                  }
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700"
                  alt=""
                />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-400 transition-colors">
                  {p.author?.name ?? 'Unknown author'}
                </span>
                <span className="text-slate-500 text-xs">·</span>
                <span className="text-[11px] text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                {p.title}
              </h2>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span>👁️</span> {p.views ?? 0} views
                </span>
                <span className="text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold">
                  Read article →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center text-slate-500 text-sm space-y-3">
          <p className="text-3xl">📝</p>
          <p className="font-semibold text-slate-300">No blog posts published yet.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Share your knowledge, tutorials, or engineering thoughts with your network.
          </p>
          <Link to="/blog/new" className="btn text-xs inline-flex mt-2">
            Write your first post
          </Link>
        </div>
      )}
    </div>
  );
}

export function Post() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['post', id], queryFn: () => api(`/posts/${id}`) });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api('/auth/me') });

  if (q.isLoading) {
    return (
      <div className="card p-8 animate-pulse space-y-4">
        <div className="h-8 bg-slate-800 rounded-lg w-3/4" />
        <div className="h-4 bg-slate-800/60 rounded w-1/4" />
        <div className="space-y-2 pt-4">
          <div className="h-4 bg-slate-800/40 rounded w-full" />
          <div className="h-4 bg-slate-800/40 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (q.error) {
    return (
      <div className="card border-rose-900/40 bg-rose-950/20 text-rose-300 p-8 text-center space-y-3">
        <p className="font-bold text-lg">Article not found</p>
        <p className="text-xs text-rose-400">{(q.error as Error).message}</p>
        <Link to="/blog" className="btn text-xs">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  const p = q.data ?? {
    id: '',
    title: 'Post not found',
    content: '',
    views: 0,
    author: { id: '', username: '', name: 'Unknown' },
    createdAt: new Date().toISOString(),
  };

  const isAuthor = me.data?.id === p.author?.id;

  return (
    <article className="card p-6 sm:p-10 space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <Link to="/blog" className="btn-ghost text-xs py-1.5 px-3">
          ← Back to Articles
        </Link>

        {isAuthor && (
          <div className="flex gap-2">
            <Link to={`/blog/${p.id}/edit`} className="btn-secondary text-xs py-1.5 px-3">
              ✏️ Edit
            </Link>
            <button
              className="btn-danger text-xs py-1.5 px-3"
              onClick={async () => {
                if (confirm('Are you sure you want to delete this article?')) {
                  await api(`/posts/${p.id}`, { method: 'DELETE' });
                  qc.invalidateQueries({ queryKey: ['posts'] });
                  nav('/blog');
                }
              }}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {/* Title & Metadata Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {p.title}
        </h1>

        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          <Link
            to={`/u/${p.author?.username ?? ''}`}
            className="flex items-center gap-2 text-indigo-400 font-semibold hover:underline"
          >
            <img
              src={
                p.author?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(p.author?.name || 'Author')}&background=4f46e5&color=fff`
              }
              className="w-5 h-5 rounded-full object-cover"
              alt=""
            />
            <span>{p.author?.name ?? 'Unknown author'}</span>
          </Link>
          <span>·</span>
          <span>
            Published on{' '}
            {new Date(p.createdAt).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span>·</span>
          <span className="badge badge-brand text-[10px]">👁️ {p.views ?? 0} views</span>
        </div>
      </div>

      {/* Markdown Body */}
      <div className="prose prose-invert prose-indigo max-w-none pt-4 border-t border-slate-800/80 leading-relaxed text-slate-200 text-sm sm:text-base space-y-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-slate-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:font-mono [&_code]:text-indigo-300 [&_code]:bg-slate-950 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-slate-800 [&_pre]:overflow-x-auto">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{p.content}</ReactMarkdown>
      </div>
    </article>
  );
}

export function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const ex = useQuery({ queryKey: ['post', id], queryFn: () => api(`/posts/${id}`), enabled: !!id });

  const [t, setT] = useState<string | null>(null);
  const [c, setC] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const title = t ?? ex.data?.title ?? '';
  const content = c ?? ex.data?.content ?? '';

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      setErr('Title and article content are required.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const r = await api(id ? `/posts/${id}` : '/posts', {
        method: id ? 'PUT' : 'POST',
        body: { title, content },
      });
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['post', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      nav(`/blog/${id || r.id}`);
    } catch (e: any) {
      setErr(e.message || 'Failed to save post');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-white">
            {id ? 'Edit Technical Article' : 'Compose Technical Article'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full Markdown support with live syntax-highlighted preview.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs" onClick={() => nav('/blog')}>
            Cancel
          </button>
          <button className="btn text-xs py-2 px-4" onClick={save} disabled={busy}>
            {busy ? 'Publishing…' : id ? 'Update Post' : 'Publish Post'}
          </button>
        </div>
      </div>

      {err && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          ⚠️ {err}
        </div>
      )}

      {/* Editor & Preview Split View */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Editor Side */}
        <div className="space-y-3 flex flex-col">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Article Title</label>
            <input
              className="input font-semibold text-base"
              placeholder="e.g. Scaling PostgreSQL with Prisma & Connection Pooling"
              value={title}
              onChange={(e) => setT(e.target.value)}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Markdown Content
              </label>
              <span className="text-[11px] text-slate-500 font-mono">supports ```js/ts/sql</span>
            </div>
            <textarea
              className="input h-[450px] font-mono text-xs leading-relaxed resize-none flex-1"
              placeholder={`# Your Title Here\n\nWrite your thoughts, architecture patterns, or tutorials in Markdown...\n\n\`\`\`typescript\nconst greeting = "Hello DevConnect";\n\`\`\``}
              value={content}
              onChange={(e) => setC(e.target.value)}
            />
          </div>
        </div>

        {/* Live Preview Side */}
        <div className="card flex flex-col h-[525px] overflow-hidden bg-slate-950/70 border-slate-800/80">
          <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Live Preview
            </span>
            <span className="badge badge-brand text-[10px]">Formatted</span>
          </div>
          <div className="flex-1 overflow-y-auto pt-4 pr-1 text-slate-200 text-sm space-y-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_p]:text-slate-300 [&_code]:font-mono [&_code]:text-indigo-300 [&_code]:bg-slate-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-slate-800 [&_pre]:overflow-x-auto">
            {content ? (
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
            ) : (
              <div className="py-20 text-center text-slate-500 italic text-xs">
                Write some markdown on the left to see the rendered preview here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

