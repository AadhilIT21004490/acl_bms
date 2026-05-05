import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/cloudinary/sign
 * Accepts the exact params the Upload Widget wants to sign,
 * sorts them alphabetically, and returns a SHA-1 HMAC signature.
 * The API secret never leaves the server.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  if (!apiSecret) {
    return Response.json(
      { error: 'Cloudinary API secret is not configured on the server.' },
      { status: 500 }
    );
  }

  // The widget sends us the exact parameters it wants included in the signature
  const paramsToSign: Record<string, string> = await request.json();

  // Cloudinary signature: sort keys alphabetically, join as key=value pairs, append secret
  // Reference: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
  const stringToSign =
    Object.keys(paramsToSign)
      .sort()
      .filter((key) => paramsToSign[key] !== '' && paramsToSign[key] !== undefined)
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&') + apiSecret;

  const signature = createHash('sha1').update(stringToSign).digest('hex');

  return Response.json({ signature });
}
