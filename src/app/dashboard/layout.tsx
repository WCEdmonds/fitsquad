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
import { initializeDemoData, checkDemoDataExists } from '@/lib/init-demo-data';
import { isDemoAccount } from '@/lib/demo-data';

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

  // Initialize demo data for App Store review account
  React.useEffect(() => {
    if (!user || !firestore || !isDemoAccount(user.email || '')) return;

    const initDemo = async () => {
      try {
        const exists = await checkDemoDataExists(firestore, user.uid);
        if (!exists) {
          console.log('Initializing demo data for review account...');
          const result = await initializeDemoData(firestore, user.uid, user.email || '');
          if (result.success) {
            console.log('✅ Demo data initialized:', result.data);
          } else {
            console.error('❌ Failed to initialize demo data:', result.error);
          }
        }
      } catch (error) {
        console.error('Error during demo data initialization:', error);
      }
    };

    initDemo();
  }, [user, firestore]);

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
        {!isNative && (
          <header className="sticky top-0 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-4 md:px-6 z-50 shrink-0 shadow-sm">
             <Link
                href="/dashboard"
                className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
              >
                <Dumbbell className="h-7 w-7 text-primary" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">FitSquad</span>
            </Link>
            <div className="hidden md:flex ml-8">
              <DashboardNav />
            </div>
            <Button asChild className="hidden md:flex ml-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-md">
              <Link href="/dashboard/workout">
                <Dumbbell className="mr-2 h-4 w-4" />
                Quick Workout
              </Link>
            </Button>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
                 <nav className="grid gap-6 text-lg font-medium h-full">
                   <Link
                      href="/dashboard"
                      onClick={handleLinkClick}
                      className="flex items-center gap-2 font-semibold text-lg mb-4"
                    >
                      <Dumbbell className="h-7 w-7" />
                      <span className="">FitSquad</span>
                  </Link>
                  <div className="flex-1">
                    <DashboardNav isMobile={true} onLinkClick={handleLinkClick} />
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-md" size="lg" onClick={handleLinkClick}>
                    <Link href="/dashboard/workout">
                      <Dumbbell className="mr-2 h-5 w-5" />
                      Quick Workout
                    </Link>
                  </Button>
                  <div className="border-t pt-4 mt-auto space-y-2">
                    <p className="text-sm font-medium text-muted-foreground px-2">{userAccount?.firstName} {userAccount?.lastName}</p>
                    <Link href="/dashboard/settings" onClick={handleLinkClick} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link href="/teams/create" onClick={handleLinkClick} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted">
                      <Sword className="h-4 w-4" />
                      Create New Team
                    </Link>
                    {userAccount?.accountType === 'Commander' && (
                      <Link href="/dashboard/manage-teams" onClick={handleLinkClick} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted">
                        <ShieldCheck className="h-4 w-4" />
                        Manage Teams
                      </Link>
                    )}
                    <button onClick={() => { handleLogout(); handleLinkClick(); }} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted text-red-600 w-full">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                 </nav>
              </SheetContent>
            </Sheet>
            <div className="hidden md:flex items-center gap-2 md:gap-4 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full shrink-0">
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
          </header>
        )}
        <main
          className={cn(
            "md:gap-8 md:p-8",
            isNative ? "flex-1 overflow-y-auto gap-3 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]" : "flex flex-1 flex-col gap-4 p-4"
          )}
          style={isNative ? {
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          } : undefined}
        >
          <DashboardErrorBoundary>
            {children}
          </DashboardErrorBoundary>
        </main>
        {!isNative && (
          <footer className="py-6 px-6 text-center text-xs text-muted-foreground shrink-0 border-t bg-background/50">
              © {new Date().getFullYear()} FitSquad by Quandary Development
          </footer>
        )}
        <BottomNav />
      </div>
  );
}
