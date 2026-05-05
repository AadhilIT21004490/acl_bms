import type { Metadata } from 'next';
import ProfileForm from '@/components/ProfileForm';

export const metadata: Metadata = {
  title: 'Profile',
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your display name and profile picture.
        </p>
      </div>

      <div className="glass-card p-6 lg:p-8">
        <ProfileForm />
      </div>
    </div>
  );
}
