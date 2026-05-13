'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Incorrect password. Try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--gf-purple-900)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'var(--gf-ink-soft)',
          boxShadow: 'var(--gf-glow-purple)',
        }}
      >
        {/* Logo / wordmark */}
        <div className="mb-8 text-center">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--gf-purple-300)' }}
          >
            Goldfizh
          </span>
          <h1
            className="text-2xl font-light leading-tight"
            style={{ color: 'var(--gf-white)', letterSpacing: '-0.03em' }}
          >
            Recruitment Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--gf-slate-500)' }}>
            Teylingereind
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--gf-slate-400)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoFocus
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--gf-purple-900)',
                border: '1px solid var(--gf-slate-700)',
                color: 'var(--gf-white)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--gf-purple-600)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--gf-slate-700)';
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: '#F87171' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all"
            style={{
              background: loading ? 'var(--gf-purple-700)' : 'var(--gf-purple-600)',
              color: 'var(--gf-white)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
