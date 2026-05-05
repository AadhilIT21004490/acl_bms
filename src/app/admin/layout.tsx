import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminSidebar from '@/components/AdminSidebar';

export const metadata: Metadata = {
  title: {
    template: '%s | Admin',
    default: 'Dashboard | Admin',
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 relative z-0">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <AdminSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto relative">
        {/* Top padding on mobile to clear the hamburger button */}
        <div className="p-4 pt-16 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
