import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PostForm from '@/components/PostForm';
import connectToDatabase from '@/lib/mongodb';
import Post from '@/models/Post';

export const metadata: Metadata = {
  title: 'Edit Post',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  await connectToDatabase();
  const post = await Post.findById(id).lean<any>();

  if (!post || post.status === 'Trash') {
    notFound();
  }

  // Serialize for client component (ObjectId → string)
  const initialData = {
    _id:         post._id.toString(),
    title:       post.title,
    description: post.description,
    mainImage:   post.mainImage ?? '',
    tags:        post.tags ?? [],
    status:      post.status as 'Draft' | 'Published',
  };

  return (
    <div className="space-y-6">
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
        <h1 className="text-2xl font-bold text-slate-100">Edit Post</h1>
        <p className="text-sm text-slate-500 mt-1 truncate max-w-xl">{post.title}</p>
      </div>

      <div className="glass-card p-6 lg:p-8">
        <PostForm mode="edit" initialData={initialData} />
      </div>
    </div>
  );
}
