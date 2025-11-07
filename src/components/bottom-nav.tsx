'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

const bottomNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/soldiers', label: 'Team', icon: Users },
  { href: '/dashboard/planner', label: 'Plan', icon: Calendar },
  { href: '/dashboard/saved-plans', label: 'Saved', icon: Archive },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // Only show on native platforms
  if (!isNative) {
    return null;
  }

  const handleNavClick = () => {
    haptics.light();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 shrink-0 touch-none border-t border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
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
