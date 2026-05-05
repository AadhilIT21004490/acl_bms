import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';
// import { Newspaper } from 'lucide-react';
import Image from 'next/image';
import logo from '../../../public/Logo BW.png';

export const metadata: Metadata = {
  title: 'Sign In | News Management',
  description: 'Sign in to the News Management admin panel.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-600/30">
            {/* <Newspaper className="w-7 h-7 text-white" /> */}
            <Image
              src={logo}
              alt="ACL Academy"
              width={85}
              height={85}
              className="w-10 h-10"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">News Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your admin account</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
