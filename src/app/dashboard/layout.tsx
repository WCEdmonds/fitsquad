'use client';
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, ShieldCheck, Sword, Menu, Dumbbell } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { BottomNav } from '@/components/bottom-nav';
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
import { cn } from '@/lib/utils';
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary';
import { Capacitor } from '@capacitor/core';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNative, setIsNative] = React.useState(false);

  React.useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

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

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  }
  
  return (
      <div className={cn(
        "w-full",
        isNative ? "h-screen flex flex-col fixed inset-0" : "flex min-h-screen flex-col"
      )}>
        <header className={cn(
          "flex items-center gap-4 border-b bg-background px-4 md:px-6 z-50 shrink-0",
          isNative ? "h-14 pt-[env(safe-area-inset-top)]" : "sticky top-0 h-20"
        )}>
           {!isNative && (
             <Link
                href="/dashboard"
                className={cn("flex items-center gap-2 font-semibold", isNative ? "text-base" : "text-lg")}
              >
                <Dumbbell className={cn(isNative ? "h-6 w-6" : "h-7 w-7")} />
                <span className="">FitSquad</span>
            </Link>
           )}
          <div className="hidden md:flex ml-8">
            <DashboardNav />
          </div>
          {!isNative && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden ml-auto"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                 <nav className="grid gap-6 text-lg font-medium">
                   <Link
                      href="/dashboard"
                      onClick={handleLinkClick}
                      className="flex items-center gap-2 font-semibold text-lg mb-4"
                    >
                      <Dumbbell className="h-7 w-7" />
                      <span className="">FitSquad</span>
                  </Link>
                  <DashboardNav isMobile={true} onLinkClick={handleLinkClick} />
                 </nav>
              </SheetContent>
            </Sheet>
          )}
          {!isNative && (
            <div className={cn("flex items-center gap-4 md:gap-2 lg:gap-4", "md:ml-auto")}>
              <div className="flex-1 sm:flex-initial">
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
            </div>
          )}
        </header>
        <main className={cn(
          "md:gap-8 md:p-8",
          isNative ? "flex-1 overflow-y-auto gap-3 p-3" : "flex flex-1 flex-col gap-4 p-4"
        )}>
          <DashboardErrorBoundary>
            {children}
          </DashboardErrorBoundary>
        </main>
        {!isNative && (
          <footer className="py-4 px-6 text-center text-xs text-muted-foreground shrink-0">
              © {new Date().getFullYear()} FitSquad by Quandary Development
          </footer>
        )}
        <BottomNav />
      </div>
  );
}
