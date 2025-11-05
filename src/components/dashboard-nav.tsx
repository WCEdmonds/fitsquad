"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Bot, Dumbbell, Archive, Settings, LineChart, ShieldCheck } from 'lucide-react';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/soldiers', label: 'Soldiers', icon: Users },
  { href: '/dashboard/planner', label: 'Fitness Planner', icon: Bot },
  { href: '/dashboard/saved-plans', label: 'Saved Plans', icon: Archive },
  { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
];

const commanderNavItems = [
    { href: '/dashboard/manage-teams', label: 'Manage Teams', icon: ShieldCheck },
]

interface DashboardNavProps {
  className?: string;
  isMobile?: boolean;
}

export function DashboardNav({ className, isMobile = false }: DashboardNavProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: userAccount } = useDoc(userAccountRef);

  const navClasses = isMobile
    ? 'flex flex-col items-start gap-4 text-lg font-medium'
    : 'flex-row items-center gap-8 text-base';

  return (
    <div className={cn("flex h-full items-center w-full", className)}>
       <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg mb-4 md:mb-0 md:mr-8">
          <Dumbbell className="h-7 w-7" />
          <span className="">FitSquad</span>
        </Link>
      <nav className={cn(navClasses, "w-full")}>
        {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {item.label}
            </Link>
        ))}
         {userAccount?.accountType === 'Commander' && commanderNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {item.label}
            </Link>
        ))}
      </nav>
    </div>
  );
}
