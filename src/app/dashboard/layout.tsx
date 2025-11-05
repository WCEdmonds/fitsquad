'use client';
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, ShieldCheck, Swords, Menu } from 'lucide-react';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [fallback, setFallback] = React.useState('');

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: userAccount, isLoading: isAccountLoading } = useDoc<{firstName: string, lastName: string, accountType: string}>(userAccountRef);

  React.useEffect(() => {
    if (!isUserLoading && !isAccountLoading && (userAccount || user)) {
      const firstInitial = userAccount?.firstName?.charAt(0) ?? '';
      const lastInitial = userAccount?.lastName?.charAt(0) ?? '';
      const emailInitial = user?.email?.charAt(0) ?? '';
      setFallback((firstInitial + lastInitial).toUpperCase() || emailInitial.toUpperCase());
    }
  }, [user, userAccount, isUserLoading, isAccountLoading]);


  const handleLogout = () => {
    auth.signOut();
    router.push('/login');
  };
  
  return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-20 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
          <DashboardNav className="hidden md:flex" />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <DashboardNav isMobile={true} />
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
              {/* Optional Search Bar */}
            </div>
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
                      <Swords className="mr-2 h-4 w-4" />
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
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
        <footer className="py-4 px-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} FitSquad by Quandary Development
        </footer>
      </div>
  );
}
