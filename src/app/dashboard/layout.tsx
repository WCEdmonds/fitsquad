'use client';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: userAccount } = useDoc<{firstName: string, lastName: string}>(userAccountRef);

  const handleLogout = () => {
    auth.signOut();
    router.push('/login');
  };
  
  return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-20 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
          <DashboardNav />
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
              {/* Optional Search Bar */}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={user?.photoURL ?? 'https://picsum.photos/seed/user/100/100'} alt="Commander" data-ai-hint="person portrait" />
                    <AvatarFallback>{userAccount?.lastName?.charAt(0) ?? user?.email?.charAt(0)}</AvatarFallback>
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
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </div>
  );
}
