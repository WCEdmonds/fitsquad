'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { ProfileForm } from '@/components/profile-form';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userAccountRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'accounts', user.uid);
    }, [firestore, user]);

    const { data: userAccount, isLoading } = useDoc(userAccountRef);

  return (
    <div className="pb-24 md:pb-4">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Settings />
            Profile Settings
        </CardTitle>
        <CardDescription>
          Update your personal information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )}
        {!isLoading && userAccount && user && (
            <ProfileForm 
                userId={user.uid}
                defaultValues={{
                    firstName: userAccount.firstName,
                    lastName: userAccount.lastName,
                    accountType: userAccount.accountType,
                    gender: userAccount.gender,
                }}
            />
        )}
      </CardContent>
    </Card>
    </div>
  );
}
