'use client';

import { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

const AUTH_SEEN_KEY = 'fitsquad-auth-screen-seen';
const ONBOARDING_KEY = 'fitsquad-onboarding-completed';

export function AuthScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    // Don't show if loading user state
    if (isUserLoading) return;

    // Don't show if user is already logged in
    if (user) {
      // If logged in and on home page, redirect to dashboard
      if (native && pathname === '/') {
        router.push('/dashboard');
      }
      return;
    }

    // Only show on native platforms, after onboarding, and not already seen
    // Also don't show if already on auth pages or dashboard
    if (native && !pathname.includes('/login') && !pathname.includes('/signup') && !pathname.includes('/dashboard')) {
      const onboardingComplete = localStorage.getItem(ONBOARDING_KEY);
      const authSeen = localStorage.getItem(AUTH_SEEN_KEY);

      if (onboardingComplete && !authSeen) {
        setIsVisible(true);
        setTimeout(() => setFadeIn(true), 100);
      } else if (pathname === '/' && !onboardingComplete) {
        // If on home page and haven't completed onboarding, wait for onboarding
        return;
      } else if (pathname === '/' && onboardingComplete && authSeen) {
        // If on home page, onboarding complete, and auth seen, redirect to login
        router.push('/login');
      }
    }
  }, [pathname, user, isUserLoading, router]);

  const handleCreateAccount = () => {
    haptics.medium();
    localStorage.setItem(AUTH_SEEN_KEY, 'true');
    setFadeIn(false);
    setTimeout(() => {
      setIsVisible(false);
      router.push('/signup');
    }, 300);
  };

  const handleLogin = () => {
    haptics.medium();
    localStorage.setItem(AUTH_SEEN_KEY, 'true');
    setFadeIn(false);
    setTimeout(() => {
      setIsVisible(false);
      router.push('/login');
    }, 300);
  };

  if (!isVisible || !isNative) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-between p-8 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
        <div
          className={cn(
            'transition-all duration-500 ease-out w-full',
            fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Logo */}
          <div className="mb-12 flex justify-center">
            <div className="rounded-full bg-primary p-8">
              <Dumbbell className="h-20 w-20 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-center mb-4 text-foreground">
            FitSquad
          </h1>

          {/* Subtitle */}
          <p className="text-base text-center text-muted-foreground leading-relaxed mb-12">
            Intelligent fitness planning for military units
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="w-full max-w-md space-y-4">
        <Button
          onClick={handleCreateAccount}
          size="lg"
          className="w-full h-14 text-base rounded-xl"
        >
          Create Account
        </Button>

        <Button
          onClick={handleLogin}
          variant="outline"
          size="lg"
          className="w-full h-14 text-base rounded-xl"
        >
          Log In
        </Button>
      </div>
    </div>
  );
}
