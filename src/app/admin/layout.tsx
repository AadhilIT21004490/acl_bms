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
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <AdminSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">
        {/* Top padding on mobile to clear the hamburger button */}
        <div className="p-4 pt-16 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
