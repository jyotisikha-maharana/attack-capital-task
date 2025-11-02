import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { AnalyticsDashboard } from '@/components/analytics/dashboard';
import { Navbar } from '@/components/layout/navbar';

export default async function AnalyticsPage() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session) {
      redirect('/login');
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <AnalyticsDashboard />
      </div>
    );
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/login');
  }
}

