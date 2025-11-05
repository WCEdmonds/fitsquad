'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AddSoldierDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddSoldier: (email: string, teamCode?: string) => Promise<void>;
  isAdmin?: boolean;
}

export function AddSoldierDialog({ isOpen, onOpenChange, onAddSoldier, isAdmin = false }: AddSoldierDialogProps) {
  const [email, setEmail] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Email is required', variant: 'destructive' });
      return;
    }
    if (isAdmin && !teamCode) {
        toast({ title: 'Team Code is required for Admin assignment', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    await onAddSoldier(email, isAdmin ? teamCode : undefined);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Soldier to Team</DialogTitle>
            <DialogDescription>
              Enter the email address of the soldier you want to add. They must have a FitSquad account.
              {isAdmin && " As an Admin, you must also provide the 8-digit code for the destination team."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Soldier's Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="soldier@example.com"
                required
              />
            </div>
            {isAdmin && (
                <div className="space-y-2">
                    <Label htmlFor="team-code">Destination Team Code</Label>
                    <Input
                        id="team-code"
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value)}
                        placeholder="e.g., 12345678"
                        required
                    />
                </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add to Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
