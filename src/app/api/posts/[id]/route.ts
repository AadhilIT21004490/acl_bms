import type { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Post from '@/models/Post';
import { requireAuth } from '@/lib/auth-helper';
import { updatePostSchema } from '@/lib/validations';
import mongoose from 'mongoose';

// ─── Helper: validate ObjectId ────────────────────────────────────────────────
function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── GET /api/posts/[id] ──────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { id } = await params;
    if (!isValidId(id)) {
      return Response.json({ error: 'Invalid post ID.' }, { status: 400 });
    }

    const post = await Post.findById(id)
      .populate('authorId', 'name email image')
      .lean();

    if (!post) {
      return Response.json({ error: 'Post not found.' }, { status: 404 });
    }

    return Response.json({ post });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[GET /api/posts/[id]]', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ─── PATCH /api/posts/[id] ────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { id } = await params;
    if (!isValidId(id)) {
      return Response.json({ error: 'Invalid post ID.' }, { status: 400 });
    }

    const body   = await request.json();
    const parsed = updatePostSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    const post = await Post.findById(id);
    if (!post) {
      return Response.json({ error: 'Post not found.' }, { status: 404 });
    }

    // Apply updates
    Object.assign(post, parsed.data);

    // If re-publishing (status → Published), refresh the date
    if (parsed.data.status === 'Published' && post.status !== 'Published') {
      const now    = new Date();
      post.date    = now.toISOString().split('T')[0];
      post.dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    }

    await post.save();

    return Response.json({ post });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[PATCH /api/posts/[id]]', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ─── DELETE /api/posts/[id] ───────────────────────────────────────────────────
// Soft delete: moves post to "Trash" status.
// Hard delete: send ?hard=true (admin only, permanent).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { id }  = await params;
    const isHard  = request.nextUrl.searchParams.get('hard') === 'true';

    if (!isValidId(id)) {
      return Response.json({ error: 'Invalid post ID.' }, { status: 400 });
    }

    const post = await Post.findById(id);
    if (!post) {
      return Response.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (isHard) {
      // Permanent deletion (e.g. emptying trash)
      await Post.findByIdAndDelete(id);
      return Response.json({ message: 'Post permanently deleted.' });
    }

    // Soft delete
    post.status = 'Trash';
    await post.save();

    return Response.json({ message: 'Post moved to Trash.', post });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[DELETE /api/posts/[id]]', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
