
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Target, Brain, LineChart, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

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
                className="opacity-30 blur-sm"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-background/80"></div>
           </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex flex-col justify-center space-y-6 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none animate-in fade-in slide-in-from-bottom-4 duration-1000 text-white">
                    Revolutionize Your Unit's Fitness
                  </h1>
                  <p className="max-w-[700px] text-white/90 text-lg md:text-xl lg:text-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
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
          <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
