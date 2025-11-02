import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function Home() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session) {
      redirect('/login');
    }

    redirect('/inbox');
  } catch (error) {
    // NEXT_REDIRECT is expected, not an error
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as { digest?: string }).digest;
      if (digest && digest.startsWith('NEXT_REDIRECT')) {
        // This is a redirect, re-throw it
        throw error;
      }
    }
    // If auth fails, redirect to login
    console.error('Auth error:', error);
    redirect('/login');
  }
}

