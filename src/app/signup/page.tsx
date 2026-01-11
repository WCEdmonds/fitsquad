'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase, initiateEmailSignUp } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
} from 'firebase/firestore';
import { Account } from '@/lib/types';
import { callSendInvite, callSendVerificationEmail, callVerifyEmail } from '@/lib/cloudFunctions';
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      if (!userId) {
        throw new Error('User ID not found');
      }

      const result = await callVerifyEmail({
        userId,
        code: verificationCode,
      });

      if (result.success) {
        // Navigate to onboarding dashboard
        router.push('/dashboard/onboarding');
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const sendWelcomeEmail = async (email: string, firstName: string, isClaimed: boolean) => {
    try {
      const subject = isClaimed
        ? '🎉 Welcome to FitSquad - Profile Claimed!'
        : '🎉 Welcome to FitSquad!';

      const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .feature-list {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .feature-list li {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    .feature-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💪 Welcome to FitSquad!</h1>
  </div>
  <div class="content">
    <h2>Hey ${firstName}! 👋</h2>

    ${isClaimed
      ? '<p><strong>Great news!</strong> You\'ve successfully claimed your profile and all your fitness data has been transferred to your account.</p>'
      : '<p><strong>Thanks for joining FitSquad!</strong> We\'re excited to help you on your fitness journey.</p>'
    }

    <p>Your account is ready to go. Here's what you can do with FitSquad:</p>

    <ul class="feature-list">
      <li><strong>Track ACFT Scores:</strong> Log and monitor your Army Combat Fitness Test performance</li>
      <li><strong>Join or Create Teams:</strong> Connect with your unit and track collective progress</li>
      <li><strong>AI Workout Plans:</strong> Get personalized training plans tailored to your fitness data</li>
      <li><strong>Progress Analytics:</strong> Visualize your improvement over time with detailed charts</li>
      <li><strong>Team Management:</strong> Supervisors and commanders can manage team fitness data</li>
    </ul>

    <center>
      <a href="https://mysquad.fit/dashboard" class="button">Go to Dashboard</a>
    </center>

    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      <strong>Quick Tip:</strong> Start by logging your current ACFT scores in the Fitness Logs section. This helps our AI create better workout plans for you!
    </p>
  </div>
  <div class="footer">
    <p>Questions? Need help? Contact your unit administrator or reply to this email.</p>
    <p style="margin-top: 10px;">
      <strong>FitSquad</strong> - Track. Train. Achieve.<br>
      <a href="https://mysquad.fit" style="color: #667eea; text-decoration: none;">mysquad.fit</a>
    </p>
  </div>
</body>
</html>
      `;

      await callSendInvite({
        to: email,
        subject,
        body,
      });

      console.log('Welcome email sent successfully to:', email);
    } catch (error) {
      // Don't block signup if email fails
      console.error('Failed to send welcome email:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password validation for all users
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

    // Only Admin requires passcode now
    if (accountType === 'Admin' && passcode !== 'scientiaestpotestas') {
      setError('Invalid Admin passcode.');
      return;
    }



    setIsLoading(true);

    try {
      // All users (including commanders) use password-based signup
      const userCredential = await initiateEmailSignUp(auth, email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error('Failed to create user account');
      }

      // Generate verification code
      const code = generateVerificationCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

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
        emailVerified: false,
        verificationCode: code,
        verificationCodeExpires: expiresAt.toISOString(),
        aiGenerationsThisWeek: 0,
        aiGenerationsWeekStart: new Date().toISOString(),
      };

      const accountRef = doc(firestore, 'accounts', user.uid);
      // Wait for the Firestore document to be created before navigating
      await setDoc(accountRef, accountData, { merge: true });

      // Send verification email
      await callSendVerificationEmail({
        userId: user.uid,
        email: user.email || email,
        firstName,
        code,
      });

      // Show verification form instead of navigating
      setUserId(user.uid);
      setShowVerification(true);
      setIsLoading(false);

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during sign up. Please try again.');
      setIsLoading(false);
    }
  };


  // Show verification form if email was sent
  if (showVerification) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="w-full shadow-lg">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-lg mb-2 w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
              <CardDescription className="text-base">
                We've sent a 6-digit code to {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    required
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive font-medium">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={isVerifying || verificationCode.length !== 6}>
                  {isVerifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify Email'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Didn't receive the code? Check your spam folder or contact support.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                    <Input
                      id="firstName"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
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
            {accountType === 'Admin' && (
                <div className="space-y-2">
                    <Label htmlFor="passcode">Admin Passcode</Label>
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
