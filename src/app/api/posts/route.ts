import type { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Post from '@/models/Post';
import { requireAuth, getUserId } from '@/lib/auth-helper';
import { createPostSchema } from '@/lib/validations';

// ─── GET /api/posts ───────────────────────────────────────────────────────────
// Paginated list with search, status filter, and tag filter.
// Protected: requires admin session.
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = request.nextUrl;

    const page   = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit  = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 10)));
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';   // Draft | Published | Trash | '' (all)
    const tag    = searchParams.get('tag')    ?? '';

    // Build MongoDB query
    const query: Record<string, any> = {};

    if (status && ['Draft', 'Published', 'Trash'].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('authorId', 'name email image')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    return Response.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[GET /api/posts]', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ─── POST /api/posts ──────────────────────────────────────────────────────────
// Create a new post. date and dayOfWeek are auto-generated server-side.
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body   = await request.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    const { title, description, mainImage, tags, status } = parsed.data;

    // Auto-generate date fields server-side (timezone-safe)
    const now = new Date();
    const date      = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"

    const post = await Post.create({
      title,
      description,
      mainImage: mainImage || undefined,
      tags,
      status,
      date,
      dayOfWeek,
      authorId: getUserId(session),
    });

    return Response.json({ post }, { status: 201 });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[POST /api/posts]', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
