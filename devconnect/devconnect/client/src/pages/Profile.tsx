import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export default function Profile() {
  const { username } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['user', username], queryFn: () => api(`/users/${username}`) });

  const inv = () => {
    qc.invalidateQueries({ queryKey: ['user', username] });
    qc.invalidateQueries({ queryKey: ['me'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const [edit, setEdit] = useState(false);
  const [f, setF] = useState<any>({});
  const [skill, setSkill] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [p, setP] = useState<any>({ title: '', description: '', techStack: '', liveUrl: '', repoUrl: '' });

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: inv,
    onError: (e: Error) => alert(e.message),
  });

  if (q.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="card h-48 bg-slate-900/40" />
        <div className="card h-40 bg-slate-900/40" />
        <div className="card h-60 bg-slate-900/40" />
      </div>
    );
  }

  if (q.error) {
    return (
      <div className="card border-rose-900/40 bg-rose-950/20 text-rose-300 p-8 text-center">
        <p className="text-xl font-bold">Profile not found</p>
        <p className="text-xs text-rose-400 mt-1">{(q.error as Error).message}</p>
        <Link to="/search" className="btn text-xs mt-4 inline-flex">
          Search other developers
        </Link>
      </div>
    );
  }

  const u = q.data ?? {
    id: '',
    username: username ?? '',
    name: 'User',
    bio: '',
    location: '',
    isMe: false,
    mutualConnections: 0,
    skills: [],
    projects: [],
    connection: null,
  };

  const c = u.connection;
  const connected = c?.status === 'ACCEPTED';
  const isPending = c?.status === 'PENDING';

  const compress = (file: File) =>
    new Promise<Blob>((res) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 800 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = img.width * s;
        cv.height = img.height * s;
        cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob((b) => res(b!), 'image/jpeg', 0.85);
      };
      img.src = URL.createObjectURL(file);
    });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar image must be under 2MB.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('image', await compress(file), 'avatar.jpg');
      await api('/users/me/avatar', { form: fd });
      inv();
    } catch (err: any) {
      alert(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Hero Card */}
      <section className="card bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/30 border-slate-800 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row gap-6 items-start justify-between relative z-10">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar with Upload Hover */}
            <div className="relative group">
              <img
                src={
                  u.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4f46e5&color=fff&size=200`
                }
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-500/10"
                alt=""
              />
              {u.isMe && (
                <label className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-semibold">
                  <span>📷 {uploadingAvatar ? 'Uploading…' : 'Change'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-2 flex-1">
              {edit ? (
                <div className="space-y-3 w-full sm:min-w-[340px]">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label>
                    <input
                      className="input"
                      defaultValue={u.name}
                      onChange={(e) => setF({ ...f, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Developer Bio</label>
                    <textarea
                      className="input h-20"
                      defaultValue={u.bio || ''}
                      placeholder="Share your focus, tech stack, and what you are building…"
                      onChange={(e) => setF({ ...f, bio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                    <input
                      className="input"
                      defaultValue={u.location || ''}
                      placeholder="e.g. San Francisco, CA or Remote"
                      onChange={(e) => setF({ ...f, location: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      className="btn text-xs py-2 px-4"
                      onClick={() => {
                        act.mutate(() => api('/users/me', { method: 'PUT', body: f }));
                        setEdit(false);
                      }}
                    >
                      Save Profile
                    </button>
                    <button className="btn-ghost text-xs py-2 px-4" onClick={() => setEdit(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {u.name}
                    </h1>
                    <span className="badge badge-brand text-xs">@{u.username}</span>
                  </div>

                  <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                    {u.bio || <span className="text-slate-500 italic">No bio provided yet.</span>}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span>📍</span> {u.location || 'Remote / Unspecified'}
                    </span>
                    {!u.isMe && (
                      <span className="flex items-center gap-1.5">
                        <span>🤝</span> {u.mutualConnections} mutual connection{u.mutualConnections === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 flex items-center gap-2">
            {u.isMe ? (
              !edit && (
                <button className="btn-secondary text-xs" onClick={() => { setF({ name: u.name, bio: u.bio, location: u.location }); setEdit(true); }}>
                  <span>✏️ Edit Profile</span>
                </button>
              )
            ) : !c ? (
              <button
                className="btn text-xs"
                disabled={act.isPending}
                onClick={() => act.mutate(() => api(`/connections/${u.id}`, { method: 'POST', body: {} }))}
              >
                <span>+ Connect</span>
              </button>
            ) : connected ? (
              <div className="flex items-center gap-2">
                <span className="badge badge-brand text-xs">✓ Connected</span>
                <button
                  className="btn-danger text-xs"
                  onClick={() => act.mutate(() => api(`/connections/${c.id}`, { method: 'DELETE' }))}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <span className="badge badge-slate text-xs">
                {c.requesterId === u.id ? 'Request Received' : 'Request Pending'}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <span>⭐</span> Technical Skills
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {u.isMe
                ? 'Add your expertise. Connected peers can endorse your skills.'
                : connected
                ? 'You are connected with this developer and can endorse their skills!'
                : 'Connect with this developer to endorse their skills.'}
            </p>
          </div>
          <span className="badge badge-slate">{u.skills?.length ?? 0} skills</span>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(u.skills ?? []).map((s: any) => {
            const hasEndorsed = s.endorsements?.length > 0;
            return (
              <div
                key={s.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                  hasEndorsed
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-xs truncate">{s.name}</p>
                  <p className="text-[11px] text-slate-400">
                    ⭐ {s._count?.endorsements ?? 0} endorsement{s._count?.endorsements === 1 ? '' : 's'}
                  </p>
                </div>

                {u.isMe ? (
                  <button
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Remove skill"
                    onClick={() => act.mutate(() => api(`/users/me/skills/${s.id}`, { method: 'DELETE' }))}
                  >
                    ✕
                  </button>
                ) : (
                  connected && (
                    <button
                      className={`text-xs px-2 py-1 rounded-lg font-semibold transition-all ${
                        hasEndorsed
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                      onClick={() =>
                        act.mutate(() =>
                          api(`/endorse/${s.id}`, {
                            method: hasEndorsed ? 'DELETE' : 'POST',
                            body: hasEndorsed ? undefined : {},
                          })
                        )
                      }
                    >
                      {hasEndorsed ? '✓ Endorsed' : '+1'}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Add Skill Form (Only for own profile) */}
        {u.isMe && (
          <form
            className="flex gap-2 pt-2 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              if (!skill.trim()) return;
              act.mutate(() => api('/users/me/skills', { body: { name: skill } }));
              setSkill('');
            }}
          >
            <input
              className="input text-xs"
              placeholder="Add skill (e.g. TypeScript, React, Docker, GraphQL)"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
            <button className="btn text-xs px-4 shrink-0" type="submit">
              + Add Skill
            </button>
          </form>
        )}
      </section>

      {/* Projects Showcase Section */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <span>🚀</span> Projects & Portfolio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production apps, open source contributions, and architecture prototypes.
            </p>
          </div>
          {u.isMe && (
            <button
              className="btn text-xs py-1.5 px-3"
              onClick={() => setShowAddProject(!showAddProject)}
            >
              {showAddProject ? 'Close Form' : '+ New Project'}
            </button>
          )}
        </div>

        {/* Add Project Form Collapsible */}
        {u.isMe && showAddProject && (
          <form
            className="card bg-slate-950/70 border-indigo-500/30 p-5 space-y-3 animate-in fade-in"
            onSubmit={(e) => {
              e.preventDefault();
              act.mutate(() =>
                api('/users/me/projects', {
                  body: {
                    ...p,
                    techStack: p.techStack
                      .split(',')
                      .map((s: string) => s.trim())
                      .filter(Boolean),
                  },
                })
              );
              setP({ title: '', description: '', techStack: '', liveUrl: '', repoUrl: '' });
              setShowAddProject(false);
            }}
          >
            <h3 className="font-bold text-sm text-indigo-400">Add New Project</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="input text-xs"
                placeholder="Project title (e.g. AI Workflow Engine)"
                value={p.title}
                onChange={(e) => setP({ ...p, title: e.target.value })}
                required
              />
              <input
                className="input text-xs"
                placeholder="Tech stack (comma-separated, e.g. React, Node, PostgreSQL)"
                value={p.techStack}
                onChange={(e) => setP({ ...p, techStack: e.target.value })}
              />
            </div>
            <textarea
              className="input text-xs h-20"
              placeholder="Project description, architecture overview, and key features..."
              value={p.description}
              onChange={(e) => setP({ ...p, description: e.target.value })}
              required
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="input text-xs"
                placeholder="Live Demo URL (optional, https://...)"
                value={p.liveUrl}
                onChange={(e) => setP({ ...p, liveUrl: e.target.value })}
              />
              <input
                className="input text-xs"
                placeholder="GitHub Repo URL (optional, https://...)"
                value={p.repoUrl}
                onChange={(e) => setP({ ...p, repoUrl: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => setShowAddProject(false)}
              >
                Cancel
              </button>
              <button className="btn text-xs" type="submit">
                Save Project
              </button>
            </div>
          </form>
        )}

        {/* Projects List */}
        {(u.projects ?? []).length ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {(u.projects ?? []).map((pr: any) => (
              <div
                key={pr.id}
                className="card card-hover bg-slate-950/50 border-slate-800/80 p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-white">{pr.title}</h3>
                    {u.isMe && (
                      <button
                        className="text-slate-500 hover:text-rose-400 text-xs p-1"
                        title="Delete project"
                        onClick={() => act.mutate(() => api(`/users/me/projects/${pr.id}`, { method: 'DELETE' }))}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{pr.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-900">
                  {/* Tech Stack Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {(pr.techStack ?? []).map((t: string) => (
                      <span key={t} className="badge badge-brand text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex items-center gap-3 pt-1">
                    {pr.liveUrl && (
                      <a
                        href={pr.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <span>🔗 Live Demo</span>
                      </a>
                    )}
                    {pr.repoUrl && (
                      <a
                        href={pr.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <span>💻 Code Repo</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <p className="text-2xl">📦</p>
            <p>No projects showcased yet.</p>
            {u.isMe && (
              <button
                className="btn text-xs mt-2"
                onClick={() => setShowAddProject(true)}
              >
                Showcase your first project
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

