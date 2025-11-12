
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Dumbbell, Target, Brain, LineChart, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

const features = [
  {
    icon: <Target className="h-10 w-10 text-primary" />,
    title: 'Data-Driven Insights',
    description: 'Collect soldier AFT scores, run times, and health data to get a clear picture of your unit\'s fitness.',
  },
  {
    icon: <Brain className="h-10 w-10 text-primary" />,
    title: 'Intelligent Workout Plans',
    description: 'Generates tailored workout programs for individuals, squads, or the entire company based on your soldiers\' actual performance data.',
  },
  {
    icon: <LineChart className="h-10 w-10 text-primary" />,
    title: 'Comprehensive Progress Tracking',
    description: 'Soldiers can log their progress, and commanders can monitor performance improvements across the unit over time.',
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Automatic Tiered Grouping',
    description: 'Dynamically split soldiers into focus groups to address specific deficiencies and optimize training effectiveness.',
  },
];

export default function LandingPage() {
  const [showTos, setShowTos] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  // Redirect mobile users to login/dashboard - they should never see the landing page
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // If user is logged in, go to dashboard
      if (user && !isUserLoading) {
        router.push('/dashboard');
      }
      // If not logged in and not loading, go to login
      else if (!user && !isUserLoading) {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router]);

  // Don't render landing page for mobile users - they'll be redirected
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div className="w-full bg-background">
      <header className="px-4 lg:px-6 h-20 flex items-center shadow-sm pt-[env(safe-area-inset-top)] backdrop-blur-sm bg-background/95 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold text-xl">FitSquad</span>
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4">
          <Button asChild variant="ghost" className="hover:bg-primary/10 transition-colors">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="hover:opacity-90 transition-opacity">
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full pt-16 pb-8 md:pt-24 md:pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
           <div className="absolute inset-0 z-0">
             <div
               className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 blur-3xl"
               style={{ transform: 'scale(1.1)' }}
             />
             <Image
                src="https://d2cto119c3bgok.cloudfront.net/thumbs/photos/2506/9112463/1000w_q95.jpg"
                alt="Hero background"
                layout="fill"
                objectFit="cover"
                className="opacity-40 blur-sm"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-background/80"></div>
           </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex flex-col justify-center space-y-6 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none animate-in fade-in slide-in-from-bottom-4 duration-1000 text-black">
                    Revolutionize Your Unit's Fitness
                  </h1>
                  <p className="max-w-[700px] text-black text-lg md:text-xl lg:text-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                    Stop guessing. Start planning. FitSquad generates tailored workout programs based on your soldiers' actual performance data.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                  <Button asChild size="lg" className="text-base hover:opacity-90 transition-all hover:scale-105">
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-base hover:bg-primary/10 transition-all hover:scale-105">
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Built for Modern Military Fitness</h2>
                <p className="max-w-[900px] text-muted-foreground text-base md:text-lg lg:text-xl mx-auto">
                  From individual soldier progress to company-wide performance, our tools provide the clarity and direction needed to build a stronger, more resilient force.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card
                  key={feature.title}
                  className="h-full transition-all hover:shadow-lg hover:scale-105 duration-300 border-2 hover:border-primary/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="mb-2">{feature.icon}</div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-3 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t bg-muted/20">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} FitSquad. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-6">
          <button
            onClick={() => setShowTos(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0"
          >
            Terms of Service
          </button>
          <button
            onClick={() => setShowPrivacy(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0"
          >
            Privacy
          </button>
        </nav>
      </footer>

      {/* Terms of Service Dialog */}
      <Dialog open={showTos} onOpenChange={setShowTos}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
            <DialogDescription>Last updated: {new Date().getFullYear()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using FitSquad, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Use of Service</h3>
              <p className="text-muted-foreground">
                FitSquad is a fitness tracking and workout planning platform designed for military units. You agree to use the service only for lawful purposes and in accordance with these terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. User Accounts</h3>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Data Accuracy</h3>
              <p className="text-muted-foreground">
                Users are responsible for ensuring the accuracy of fitness data entered into the system. FitSquad provides workout recommendations based on the data provided but does not guarantee specific fitness outcomes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                FitSquad is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from the use of our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Modifications</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
            <DialogDescription>Last updated: {new Date().getFullYear()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                We collect information you provide directly, including name, email, fitness data (ACFT scores, run times), and health metrics. We also collect usage data and analytics to improve our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
              <p className="text-muted-foreground">
                Your information is used to provide and improve FitSquad services, generate personalized workout plans, track fitness progress, and facilitate team management features. We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Data Sharing</h3>
              <p className="text-muted-foreground">
                Fitness data may be shared with your designated supervisors and commanders within your unit as part of team management features. We do not share your data outside your designated team without your consent.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Data Security</h3>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to access, correct, or delete your personal information. You may also request a copy of your data or opt out of certain data collection practices by contacting us.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Cookies and Tracking</h3>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to enhance user experience, analyze usage patterns, and maintain session security. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Changes to Privacy Policy</h3>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify users of significant changes via email or through the platform.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
