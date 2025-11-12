'use client';
import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUnclaimedProfile } from '@/lib/unclaimed-profiles';

interface AddMemberDialogProps {
  teamId: string;
  onMemberAdded?: () => void;
}

export function AddMemberDialog({ teamId, onMemberAdded }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [accountType, setAccountType] = useState('Soldier');
  const [isLoading, setIsLoading] = useState(false);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add team members.',
        variant: 'destructive',
      });
      return;
    }

    if (!firstName || !lastName || !gender) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createUnclaimedProfile(
        firestore,
        {
          firstName,
          lastName,
          email,
          gender: gender as 'Male' | 'Female' | 'Other',
          teamId,
          accountType: accountType as 'Soldier' | 'Supervisor',
        },
        user.uid
      );

      setClaimCode(result.claimCode);

      toast({
        title: 'Success',
        description: `${firstName} ${lastName} has been added to your team.`,
      });

      // Reset form but keep dialog open to show claim code
      setFirstName('');
      setLastName('');
      setEmail('');
      setGender('');
      setAccountType('Soldier');

      if (onMemberAdded) {
        onMemberAdded();
      }
    } catch (error: any) {
      console.error('Error creating unclaimed profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add team member. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (claimCode) {
      navigator.clipboard.writeText(claimCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({
        title: 'Copied',
        description: 'Claim code copied to clipboard.',
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setClaimCode(null);
    setCopiedCode(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setGender('');
    setAccountType('Soldier');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      } else {
        setOpen(true);
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!claimCode ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Create a profile for a team member. They can claim it later using the provided code.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select value={gender} onValueChange={setGender} required>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
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
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger id="accountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Soldier">Soldier</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Member Added Successfully</DialogTitle>
              <DialogDescription>
                Share this claim code with the team member so they can claim their profile.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <Label>Claim Code</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background p-3 rounded border text-lg font-mono tracking-wider">
                    {claimCode}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                  >
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  The team member can use this code during signup to claim their profile and
                  access their fitness data.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
