import type { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name:     z.string().min(2).trim(),
  email:    z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

/**
 * POST /api/auth/register
 * One-time admin setup route — only works when no users exist in the database.
 * After the first admin is created, this endpoint returns 403.
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Block if any admin already exists
    const existing = await User.countDocuments();
    if (existing > 0) {
      return Response.json(
        { error: 'Registration is disabled. An admin account already exists.' },
        { status: 403 }
      );
    }

    const body   = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    const { name, email, password } = parsed.data;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    return Response.json(
      { message: 'Admin account created successfully.', userId: user._id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/auth/register]', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
