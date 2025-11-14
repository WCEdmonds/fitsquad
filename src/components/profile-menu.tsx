'use client';

import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, ShieldCheck, Sword } from 'lucide-react';
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { doc } from 'firebase/firestore';
import Link from 'next/link';

export function ProfileMenu() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [fallback, setFallback] = React.useState('');

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: userAccount } = useDoc<{firstName: string, lastName: string, accountType: string}>(userAccountRef);

  React.useEffect(() => {
    if (userAccount || user) {
      const firstInitial = userAccount?.firstName?.charAt(0) ?? '';
      const lastInitial = userAccount?.lastName?.charAt(0) ?? '';
      const emailInitial = user?.email?.charAt(0) ?? '';
      setFallback((firstInitial + lastInitial).toUpperCase() || emailInitial.toUpperCase());
    }
  }, [user, userAccount]);

  const handleLogout = () => {
    auth.signOut();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar>
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{userAccount?.firstName} {userAccount?.lastName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/teams/create">
            <Sword className="mr-2 h-4 w-4" />
            Create New Team
          </Link>
        </DropdownMenuItem>
        {userAccount?.accountType === 'Commander' && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/manage-teams">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Manage Teams
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
