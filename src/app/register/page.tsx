'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Newspaper, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Registration failed.');
      }

      setSuccess('Admin account created! Redirecting to login…');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-600/30">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Create Admin Account</h1>
          <p className="text-sm text-slate-500 mt-1">One-time setup — only works if no admin exists</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-sm font-medium text-slate-300">Full Name</label>
              <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300">Email</label>
              <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Admin Account'}
            </button>

            <p className="text-center text-xs text-slate-600 pt-1">
              Already have an account?{' '}
              <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
