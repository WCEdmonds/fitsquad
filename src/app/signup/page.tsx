'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, initiateEmailSignUp } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
} from 'firebase/firestore';
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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [gender, setGender] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

      // Create the account document in Firestore
      const accountData = {
        id: user.uid,
        email: user.email,
        firstName,
        lastName,
        accountType: accountType,
        teamId: null, // User will create or join a team later
        gender,
      };

      const accountRef = doc(firestore, 'accounts', user.uid);
      // Wait for the Firestore document to be created before navigating
      await setDoc(accountRef, accountData, { merge: true });

      // Navigate to dashboard
      router.push('/dashboard');
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
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required value={lastName} onChange={e => setLastName(e.target.value)} />
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
                    <Select onValueChange={setGender} value={gender}>
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
                    <Select onValueChange={setAccountType} value={accountType}>
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
            <Link href="/login" className="font-semibold text-primary hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}
