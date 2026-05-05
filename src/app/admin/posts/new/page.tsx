import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PostForm from '@/components/PostForm';

export const metadata: Metadata = {
  title: 'New Post',
};

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Create New Post</h1>
        <p className="text-sm text-slate-500 mt-1">
          Write and publish your news article with rich media support.
        </p>
      </div>

      <div className="glass-card p-6 lg:p-8">
        <PostForm mode="create" />
      </div>
    </div>
  );
}
