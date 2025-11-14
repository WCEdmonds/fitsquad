'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TeamInvitation } from '@/lib/types';

export default function InvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const teamId = searchParams.get('teamId') as string;
  const invitationId = searchParams.get('invitationId') as string;
  const action = searchParams.get('action') as 'accept' | 'decline' | null;

  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepted' | 'declined' | 'expired' | 'error'>('loading');

  // Load invitation details
  useEffect(() => {
    if (!firestore || !teamId || !invitationId) {
      setStatus('error');
      setLoading(false);
      return;
    }

    const loadInvitation = async () => {
      try {
        const invitationRef = doc(
          firestore,
          'teams',
          teamId,
          'invitations',
          invitationId
        );
        const invitationSnap = await getDoc(invitationRef);

        if (!invitationSnap.exists()) {
          setStatus('error');
          setLoading(false);
          return;
        }

        const invitationData = invitationSnap.data() as TeamInvitation;
        setInvitation(invitationData);
        setStatus('ready');
        setLoading(false);
      } catch (error) {
        console.error('Error loading invitation:', error);
        setStatus('error');
        setLoading(false);
      }
    };

    loadInvitation();
  }, [firestore, teamId, invitationId]);

  // Handle auto-accept from URL parameter
  useEffect(() => {
    if (action === 'accept' && invitation && !processing) {
      handleAccept();
    } else if (action === 'decline' && invitation && !processing) {
      handleDecline();
    }
  }, [action, invitation, processing]);

  const handleAccept = async () => {
    if (!user || !firestore || !invitation) return;

    setProcessing(true);
    try {
      // Verify the invitation hasn't expired
      const expiresAt = new Date(invitation.expiresAt);
      if (new Date() > expiresAt) {
        toast({
          title: 'Invitation Expired',
          description: 'This invitation has expired. Please ask for a new one.',
          variant: 'destructive',
        });
        setStatus('expired');
        setProcessing(false);
        return;
      }

      // Use batch to update both invitation and add soldier to team
      const batch = writeBatch(firestore);

      // Update invitation status
      const invitationRef = doc(
        firestore,
        'teams',
        teamId,
        'invitations',
        invitationId
      );
      batch.update(invitationRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      });

      // Add soldier to team members
      const memberRef = doc(
        firestore,
        'teams',
        teamId,
        'members',
        user.uid
      );
      batch.set(memberRef, {
        uid: user.uid,
        email: user.email,
        role: 'Soldier',
      });

      // Update soldier's account with team ID
      const accountRef = doc(firestore, 'accounts', user.uid);
      batch.update(accountRef, {
        teamId: teamId,
      });

      await batch.commit();

      setStatus('accepted');
      toast({
        title: 'Welcome to the Team!',
        description: `You've been added to "${invitation.teamName}". Redirecting to dashboard...`,
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept invitation. Please try again.',
        variant: 'destructive',
      });
      setStatus('error');
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!firestore || !invitation) return;

    setProcessing(true);
    try {
      const invitationRef = doc(
        firestore,
        'teams',
        teamId,
        'invitations',
        invitationId
      );
      await updateDoc(invitationRef, {
        status: 'declined',
        declinedAt: new Date().toISOString(),
      });

      setStatus('declined');
      toast({
        title: 'Invitation Declined',
        description: 'You have declined this team invitation.',
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline invitation. Please try again.',
        variant: 'destructive',
      });
      setStatus('error');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <h2 className="text-2xl font-bold text-center">Invitation Accepted!</h2>
            <p className="text-muted-foreground text-center">
              Welcome to {invitation?.teamName}! You're being redirected to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'declined') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <XCircle className="h-16 w-16 text-red-600" />
            <h2 className="text-2xl font-bold text-center">Invitation Declined</h2>
            <p className="text-muted-foreground text-center">
              You have declined the invitation. You can request a new one from the team leader.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-16 w-16 text-yellow-600" />
            <h2 className="text-2xl font-bold text-center">Invitation Expired</h2>
            <p className="text-muted-foreground text-center">
              This invitation has expired. Please ask the team leader to send you a new invitation.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-16 w-16 text-red-600" />
            <h2 className="text-2xl font-bold text-center">Error</h2>
            <p className="text-muted-foreground text-center">
              We couldn't process your invitation. Please contact your team leader for assistance.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready state - show invitation details with accept/decline buttons
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏋️</span> Team Invitation
          </CardTitle>
          <CardDescription>
            You've been invited to join a team on FitSquad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team</p>
                  <p className="text-lg font-semibold">{invitation.teamName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invited by</p>
                  <p className="text-base">A team member</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ⏰ This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleAccept}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Invitation
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={handleDecline}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline Invitation
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
