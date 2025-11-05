"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { BarChart3, Users, Bot, Dumbbell } from 'lucide-react';
import { Button } from './ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/dashboard/soldiers', label: 'Soldiers', icon: Users },
  { href: '/dashboard/planner', label: 'Fitness Planner', icon: Bot },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-16 items-center border-b px-4 md:px-6">
       <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Dumbbell className="h-6 w-6" />
          <span className="">FitSquad</span>
        </Link>
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 ml-6">
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
      {/* Add user menu or other items here */}
    </div>
  );
}
