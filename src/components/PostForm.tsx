'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ImageIcon, X, Tag, Loader2, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { openCloudinaryWidget } from '@/lib/cloudinary';

const QuillEditor = dynamic(() => import('@/components/QuillEditor'), { ssr: false });

interface PostFormProps {
  initialData?: {
    _id?: string;
    title?: string;
    description?: string;
    mainImage?: string;
    tags?: string[];
    status?: 'Draft' | 'Published' | 'Trash';
  };
  mode?: 'create' | 'edit';
}

export default function PostForm({ initialData, mode = 'create' }: PostFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [mainImage, setMainImage] = useState(initialData?.mainImage ?? '');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [postStatus, setPostStatus] = useState<'Draft' | 'Published'>(
    (initialData?.status === 'Trash' ? 'Draft' : initialData?.status) ?? 'Draft'
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cloudinaryReady, setCloudinaryReady] = useState(false);

  const handleImageUpload = async () => {
    if (!cloudinaryReady) {
      setError('Cloudinary widget is still loading, please wait a moment.');
      return;
    }
    try {
      setUploading(true);
      setError('');
      const url = await openCloudinaryWidget();
      setMainImage(url);
    } catch (err: any) {
      setError(err?.message ?? 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent, saveStatus: 'Draft' | 'Published') => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Title is required.'); return; }
    if (!description || description === '<p><br></p>') { setError('Description is required.'); return; }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description,
        mainImage,
        tags,
        status: saveStatus,
      };

      const isEdit = mode === 'edit' && initialData?._id;
      const res = await fetch(
        isEdit ? `/api/posts/${initialData!._id}` : '/api/posts',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Something went wrong.');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      {/* Load Cloudinary Upload Widget script */}
      <Script
        src="https://widget.cloudinary.com/v2.0/global/all.js"
        onReady={() => setCloudinaryReady(true)}
      />

      <form onSubmit={(e) => handleSubmit(e, postStatus)} className="space-y-8">

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="post-title" className="block text-sm font-medium text-slate-300">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Cover Image</label>
          <div
            onClick={handleImageUpload}
            className={`relative cursor-pointer group rounded-xl border-2 border-dashed transition-all overflow-hidden
              ${mainImage ? 'border-indigo-500/50' : 'border-slate-700 hover:border-indigo-500/60'}
              ${uploading ? 'opacity-70 pointer-events-none' : ''}
            `}
            style={{ minHeight: '200px' }}
          >
            {mainImage ? (
              <>
                <img
                  src={mainImage}
                  alt="Cover preview"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-medium text-sm">Click to change image</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMainImage(''); }}
                  className="absolute top-3 right-3 p-1.5 bg-red-500/90 rounded-lg text-white hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 gap-3 text-slate-500 group-hover:text-indigo-400 transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <ImageIcon className="w-10 h-10" />
                )}
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload cover image'}
                </p>
                <p className="text-xs text-slate-600">Auto-resized to 1200×630 for optimal display</p>
              </div>
            )}
          </div>
        </div>

        {/* Description (Quill) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Content <span className="text-red-400">*</span>
          </label>
          <QuillEditor value={description} onChange={setDescription} />
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">Tags</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <Tag className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag and press Enter..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              />
            </div>
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-indigo-400 hover:text-red-400 transition-colors ml-0.5"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status Toggle + Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
          {/* Status selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Status:</span>
            <div className="flex rounded-xl overflow-hidden border border-slate-700">
              {(['Draft', 'Published'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPostStatus(s)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    postStatus === s
                      ? s === 'Published'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={(e) => { setPostStatus(postStatus); }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : mode === 'edit' ? 'Update Post' : `Save as ${postStatus}`}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
