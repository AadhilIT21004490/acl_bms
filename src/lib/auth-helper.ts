import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Returns the current session, or null if the user is not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Returns the session and throws a 401 Response if not authenticated.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

/**
 * Extracts the MongoDB user ID from the session.
 */
export function getUserId(session: Session): string {
  return (session.user as any).id as string;
}
