'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Dumbbell, LineChart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const baseBottomNavItems = [
  { href: '/dashboard/plan', label: 'Training', icon: Dumbbell },
  { href: '/dashboard/workout', label: 'Workout', icon: Dumbbell },
  { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const teamNavItem = { href: '/dashboard/soldiers', label: 'Team', icon: Users };

export function BottomNav() {
  const pathname = usePathname();
  const [isNative, setIsNative] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: userAccount } = useDoc(userAccountRef);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // Only show on native platforms
  if (!isNative) {
    return null;
  }

  // Build nav items based on user role
  const bottomNavItems = [...baseBottomNavItems];

  // Insert Team nav item for Supervisors, Commanders, and Admins only
  if (userAccount?.accountType === 'Supervisor' || userAccount?.accountType === 'Commander' || userAccount?.accountType === 'Admin') {
    bottomNavItems.splice(1, 0, teamNavItem); // Insert at position 1 (after Home)
  }

  const handleNavClick = () => {
    haptics.light();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 shrink-0 touch-none border-t border-border/50 bg-card/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
                          (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-auto',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn(
                'h-5 w-5',
                isActive && 'fill-primary'
              )} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
