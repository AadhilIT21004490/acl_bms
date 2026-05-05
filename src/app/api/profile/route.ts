import type { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth, getUserId } from '@/lib/auth-helper';
import { z } from 'zod';

const profileSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters.').trim().optional(),
  image: z.string().url('Image must be a valid URL.').optional().or(z.literal('')),
});

// ─── GET /api/profile ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const user = await User.findById(getUserId(session))
      .select('-password')
      .lean();

    if (!user) {
      return Response.json({ error: 'User not found.' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ─── PATCH /api/profile ───────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body   = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    const user = await User.findByIdAndUpdate(
      getUserId(session),
      { $set: parsed.data },
      { new: true, select: '-password' }
    ).lean();

    if (!user) {
      return Response.json({ error: 'User not found.' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
