import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, API } from '../api';

type FormState = {
  email: string;
  password: string;
  name: string;
  username: string;
};

const initialForm: FormState = { email: '', password: '', name: '', username: '' };

function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();

  const updateField = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setErr('');

    try {
      const payload = mode === 'register'
        ? form
        : { email: form.email, password: form.password };

      await api(`/auth/${mode}`, { body: payload });
      await qc.invalidateQueries({ queryKey: ['me'] });
      await qc.refetchQueries({ queryKey: ['me'] });
      nav('/dashboard', { replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Tagline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white font-extrabold text-2xl shadow-xl shadow-indigo-500/30 mb-4 transform hover:scale-105 transition-transform">
            &lt;/&gt;
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            DevConnect
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            The developer portfolio & networking platform
          </p>
        </div>

        {/* Main Card */}
        <div className="card border-slate-800/90 shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' ? 'Sign in to your account' : 'Create developer profile'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Join developers sharing projects, articles, and skill endorsements'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Alex Rivera"
                    value={form.name}
                    onChange={updateField('name')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
                  <input
                    className="input font-mono"
                    placeholder="e.g. alexrivera (letters, numbers, _)"
                    value={form.username}
                    onChange={updateField('username')}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="dev@example.com"
                value={form.email}
                onChange={updateField('email')}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                className="input"
                type="password"
                placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                value={form.password}
                onChange={updateField('password')}
                required
              />
            </div>

            {err && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{err}</span>
              </div>
            )}

            <button type="submit" className="btn w-full py-2.5 text-sm" disabled={busy}>
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing…</span>
                </>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-3 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  Or continue with
                </span>
              </div>
            </div>

            {/* GitHub OAuth Button */}
            <a
              className="btn-secondary w-full py-2.5 text-xs text-center justify-center flex items-center gap-2.5"
              href={`${API}/api/auth/github`}
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub OAuth</span>
            </a>

            <div className="pt-2 text-center text-xs text-slate-400">
              {mode === 'login' ? (
                <>
                  Don't have an account yet?{' '}
                  <Link className="text-indigo-400 font-semibold hover:underline" to="/register">
                    Create account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link className="text-indigo-400 font-semibold hover:underline" to="/login">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
          <div className="p-2 rounded-xl border border-slate-900 bg-slate-950/40">
            <span className="block text-sm mb-1">🚀</span>
            <span>Showcase Projects</span>
          </div>
          <div className="p-2 rounded-xl border border-slate-900 bg-slate-950/40">
            <span className="block text-sm mb-1">⭐</span>
            <span>Skill Endorsements</span>
          </div>
          <div className="p-2 rounded-xl border border-slate-900 bg-slate-950/40">
            <span className="block text-sm mb-1">📝</span>
            <span>Markdown Blogs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;

