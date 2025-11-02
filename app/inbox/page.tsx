import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { UnifiedInbox } from '@/components/inbox/unified-inbox';
import { Navbar } from '@/components/layout/navbar';

export default async function InboxPage() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session) {
      redirect('/login');
    }

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <UnifiedInbox userId={session.user.id} />
      </div>
    </div>
  );
  } catch (error) {
    console.error('Auth error:', error);
    redirect('/login');
  }
}

