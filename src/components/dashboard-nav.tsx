"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Bot, Dumbbell, Archive, Settings, LineChart } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/soldiers', label: 'Soldiers', icon: Users },
  { href: '/dashboard/planner', label: 'Fitness Planner', icon: Bot },
  { href: '/dashboard/saved-plans', label: 'Saved Plans', icon: Archive },
  { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full items-center w-full">
       <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg mr-8">
          <Dumbbell className="h-7 w-7" />
          <span className="">FitSquad</span>
        </Link>
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-8 md:text-base whitespace-nowrap">
        {navItems.map((item) => (
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
