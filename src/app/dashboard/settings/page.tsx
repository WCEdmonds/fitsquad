'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings, Trash2 } from 'lucide-react';
import { ProfileForm } from '@/components/profile-form';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const userAccountRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'accounts', user.uid);
    }, [firestore, user]);

    const { data: userAccount, isLoading } = useDoc(userAccountRef);

    const handleDeleteAccount = async () => {
      if (!user || !firestore) return;

      setIsDeleting(true);
      try {
        // Delete user document from Firestore
        await deleteDoc(doc(firestore, 'accounts', user.uid));

        // Delete user from Firebase Auth
        await user.delete();

        toast({
          title: 'Account Deleted',
          description: 'Your account has been permanently deleted.',
        });

        // Redirect to login
        router.push('/login');
      } catch (error: any) {
        console.error('Error deleting account:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete account. Please try again.',
          variant: 'destructive',
        });
        setIsDeleting(false);
      }
    };

  return (
    <div className="pb-24 md:pb-4 space-y-6">
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

    <Card className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and all your data including:
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>Your profile information</li>
                  <li>Your fitness data and scores</li>
                  <li>Your team memberships</li>
                  <li>All associated records</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete My Account'}
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
    </div>
  );
}
