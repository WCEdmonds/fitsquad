'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase, initiateEmailSignUp } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
} from 'firebase/firestore';
import { claimProfile, findUnclaimedProfile } from '@/lib/unclaimed-profiles';
import { Account } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dumbbell, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [gender, setGender] = useState('');
  const [passcode, setPasscode] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [unclaimedProfile, setUnclaimedProfile] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  // Use useFirebase instead of useAuth/useFirestore to handle initialization state
  let firebaseContext;
  try {
    firebaseContext = useFirebase();
  } catch (e) {
    // Firebase not initialized yet
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const { auth, firestore } = firebaseContext;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleCheckClaimCode = async () => {
    if (!claimCode.trim()) {
      setUnclaimedProfile(null);
      return;
    }

    setIsCheckingCode(true);
    setError(null);

    try {
      const profile = await findUnclaimedProfile(firestore, claimCode.trim().toUpperCase());
      if (profile) {
        setUnclaimedProfile(profile);
        // Pre-fill form with profile data
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setGender(profile.gender);
        setAccountType(profile.accountType);
        setError(null);
      } else {
        setUnclaimedProfile(null);
        setError('Invalid claim code. Please check and try again.');
      }
    } catch (err: any) {
      console.error('Error checking claim code:', err);
      setError('Failed to verify claim code. Please try again.');
      setUnclaimedProfile(null);
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (!accountType) {
        setError('Please select an account type.');
        return;
    }
     if (!gender) {
        setError('Please select a gender.');
        return;
    }
    if (!firstName || !lastName) {
      setError('Please enter your first and last name.');
      return;
    }

    if (accountType === 'Commander' && passcode !== 'thunder') {
      setError('Invalid Commander passcode.');
      return;
    }

    if (accountType === 'Admin' && passcode !== 'scientiaestpotestas') {
      setError('Invalid Admin passcode.');
      return;
    }

    setIsLoading(true);

    try {
      // Wait for user creation to complete
      const userCredential = await initiateEmailSignUp(auth, email, password);

      // userCredential should contain the new user
      const user = userCredential.user;

      if (!user) {
        throw new Error('Failed to create user account');
      }

      // If claiming a profile, use the claim mechanism
      if (unclaimedProfile && claimCode) {
        const claimed = await claimProfile(
          firestore,
          claimCode.trim().toUpperCase(),
          user.uid,
          user.email || email
        );

        if (!claimed) {
          throw new Error('Failed to claim profile. The claim code may have expired.');
        }

        // Profile claimed successfully - data has been migrated
        router.push(redirectUrl || '/dashboard');
        return;
      }

      // Regular signup flow (no claim code)
      const accountData = {
        id: user.uid,
        email: user.email,
        firstName,
        lastName,
        accountType: accountType,
        teamId: null, // User will create or join a team later
        gender,
        claimed: true, // Mark as claimed since it's a regular signup
      };

      const accountRef = doc(firestore, 'accounts', user.uid);
      // Wait for the Firestore document to be created before navigating
      await setDoc(accountRef, accountData, { merge: true });

      // Navigate to redirect URL if provided, otherwise go to dashboard
      router.push(redirectUrl || '/dashboard');
      // Keep isLoading true during navigation to prevent double-submission

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during sign up. Please try again.');
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg space-y-4">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Back to home
        </Link>
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-lg mb-2 w-fit">
              <Dumbbell className="size-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
            <CardDescription className="text-base">
              Join the squad and start tracking your fitness journey
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Claim Code Section */}
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label htmlFor="claimCode">
                Have a Claim Code? (Optional)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                If your supervisor created a profile for you, enter the claim code to adopt it.
              </p>
              <div className="flex gap-2">
                <Input
                  id="claimCode"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  disabled={!!unclaimedProfile}
                />
                <Button
                  type="button"
                  onClick={handleCheckClaimCode}
                  disabled={isCheckingCode || !claimCode.trim() || !!unclaimedProfile}
                  variant="outline"
                >
                  {isCheckingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                </Button>
              </div>
              {unclaimedProfile && (
                <p className="text-sm text-green-600 font-medium">
                  Profile found! Your information has been pre-filled below.
                </p>
              )}
            </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      disabled={!!unclaimedProfile}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      disabled={!!unclaimedProfile}
                    />
                </div>
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select onValueChange={setGender} value={gender} disabled={!!unclaimedProfile}>
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select onValueChange={setAccountType} value={accountType} disabled={!!unclaimedProfile}>
                        <SelectTrigger id="accountType">
                            <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Soldier">Soldier</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Commander">Commander</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {accountType === 'Commander' && (
                <div className="space-y-2">
                    <Label htmlFor="passcode">Commander Passcode</Label>
                    <Input
                        id="passcode"
                        type="password"
                        required
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                    />
                </div>
            )}

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
            <Button type="submit" className="w-full hover:opacity-90 transition-all" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm border-t pt-6">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
