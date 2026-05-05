'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Script from 'next/script';
import { openCloudinaryWidget } from '@/lib/cloudinary';
import { useSession } from 'next-auth/react';

export default function ProfileForm() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [name,  setName]  = useState(session?.user?.name  ?? '');
  const [image, setImage] = useState(session?.user?.image ?? '');
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');
  const [cloudinaryReady, setCloudinaryReady] = useState(false);

  const handleImageUpload = async () => {
    try {
      setUploading(true);
      setError('');
      const url = await openCloudinaryWidget();
      setImage(url);
    } catch (err: any) {
      setError(err?.message ?? 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), image }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Update failed.');
      }

      // Refresh the session token so the sidebar updates
      await update({ name, image });
      router.refresh();
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Script
        src="https://widget.cloudinary.com/v2.0/global/all.js"
        onReady={() => setCloudinaryReady(true)}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        {/* Success / Error */}
        {success && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div
            onClick={handleImageUpload}
            className="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer group flex-shrink-0 border-2 border-slate-700 hover:border-indigo-500 transition-all"
          >
            {image ? (
              <>
                <img src={image} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <ImageIcon className="w-5 h-5 text-white" />
                  }
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-indigo-600/20 flex flex-col items-center justify-center gap-1">
                {uploading
                  ? <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  : <User className="w-6 h-6 text-indigo-400" />
                }
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Profile Picture</p>
            <p className="text-xs text-slate-500 mt-0.5">Click the avatar to upload a new photo via Cloudinary</p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="block text-sm font-medium text-slate-300">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Email <span className="text-slate-600 font-normal">(cannot be changed)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            <input
              type="email"
              value={session?.user?.email ?? ''}
              readOnly
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-500 cursor-not-allowed text-sm"
            />
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </>
  );
}
