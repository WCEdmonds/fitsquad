'use client';

import { useState, useEffect } from 'react';
import { Dumbbell, Users, Bot, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';

const ONBOARDING_KEY = 'fitsquad-onboarding-completed';

interface OnboardingSlide {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: Dumbbell,
    title: 'Welcome to FitSquad',
    description: 'Your intelligent fitness planner for military units',
  },
  {
    icon: Users,
    title: 'Manage Your Team',
    description: 'Track fitness progress and coordinate workouts for your entire unit',
  },
  {
    icon: Bot,
    title: 'AI-Powered Planning',
    description: 'Get personalized workout plans tailored to your unit\'s needs',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Monitor performance metrics and achieve your fitness goals',
  },
];

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    // Only show onboarding on native platforms and if not completed
    if (native) {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        setIsVisible(true);
        // Trigger fade in animation after mount
        setTimeout(() => setFadeIn(true), 100);
      }
    }
  }, []);

  const handleNext = () => {
    haptics.light();
    if (currentSlide < slides.length - 1) {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setFadeIn(true);
      }, 300);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    haptics.light();
    handleComplete();
  };

  const handleComplete = () => {
    setFadeIn(false);
    setTimeout(() => {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setIsVisible(false);
      // Navigate to login after onboarding completes
      // The AuthScreen will show or user will be directed to login page
      router.push('/login');
    }, 300);
  };

  if (!isVisible || !isNative) {
    return null;
  }

  const CurrentIcon = slides[currentSlide].icon;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-between p-8 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      {/* Skip button */}
      {!isLastSlide && (
        <div className="w-full flex justify-end">
          <button
            onClick={handleSkip}
            className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
        <div
          className={cn(
            'transition-all duration-500 ease-out',
            fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Icon */}
          <div className="mb-12 flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CurrentIcon className="h-16 w-16 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-4 text-foreground">
            {slides[currentSlide].title}
          </h1>

          {/* Description */}
          <p className="text-lg text-center text-muted-foreground leading-relaxed">
            {slides[currentSlide].description}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="w-full max-w-md space-y-8">
        {/* Pagination dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full h-14 text-base rounded-xl"
        >
          {isLastSlide ? 'Get Started' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
