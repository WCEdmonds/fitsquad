'use client';

import { redirect } from 'next/navigation';
import { useUser } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
