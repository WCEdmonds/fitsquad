'use client';
import { Suspense } from 'react';
import { JoinTeamForm } from '@/components/join-team-form';

export default function JoinTeamPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinTeamForm />
    </Suspense>
  );
}
