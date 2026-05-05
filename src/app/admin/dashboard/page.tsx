import type { Metadata } from 'next';
import DashboardClient from '@/components/DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard',
};

// ISR: revalidate every 60 seconds so public-facing data stays fresh
export const revalidate = 60;

export default function DashboardPage() {
  return <DashboardClient />;
}
