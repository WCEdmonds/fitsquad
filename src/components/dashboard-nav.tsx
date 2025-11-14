"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Bot, Dumbbell, Settings, LineChart, ShieldCheck, Activity, CalendarDays, Edit } from 'lucide-react';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/plan', label: 'Plan', icon: CalendarDays },
  { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
];

const supervisorCommanderAdminNavItems = [
  { href: '/dashboard/soldiers', label: 'Soldiers', icon: Users },
  { href: '/dashboard/plan-editor', label: 'Plan Builder', icon: Edit },
];

const commanderNavItems = [
  { href: '/dashboard/manage-teams', label: 'Manage Teams', icon: ShieldCheck },
]

interface DashboardNavProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function DashboardNav({ isMobile = false, onLinkClick }: DashboardNavProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: userAccount } = useDoc(userAccountRef);

  const navClasses = isMobile
    ? 'grid gap-6 text-lg font-medium'
    : 'flex items-center gap-6 text-sm font-medium';

  const allNavItems = [...navItems];

  // Add Soldiers and Plan Builder for Supervisor/Commander/Admin only
  if (userAccount?.accountType === 'Supervisor' || userAccount?.accountType === 'Commander' || userAccount?.accountType === 'Admin') {
    allNavItems.push(...supervisorCommanderAdminNavItems);
  }

  // Add Manage Teams for Commander
  if (userAccount?.accountType === 'Commander') {
    allNavItems.push(...commanderNavItems);
  }

  const handleNavClick = () => {
    haptics.light();
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <nav className={cn(navClasses)}>
      {allNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={cn(
              'transition-colors hover:text-foreground',
               pathname === item.href ? 'text-foreground' : 'text-muted-foreground',
               isMobile && 'text-xl'
            )}
          >
            {item.label}
          </Link>
      ))}
    </nav>
  );
}