
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
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-20 flex items-center shadow-sm pt-[env(safe-area-inset-top)]">
        <Link href="/" className="flex items-center justify-center">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold text-xl">FitSquad</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button asChild variant="ghost">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full pt-12 md:pt-24 lg:pt-32">
           <div className="absolute inset-0 z-0">
             <Image
                src="https://images.unsplash.com/photo-1545915345-3c135498d3dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxzb2xkaWVycyUyMHRyYWluaW5nfGVufDB8fHx8MTc2MjI1ODgzMnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Soldiers training"
                layout="fill"
                objectFit="cover"
                className="opacity-30"
                data-ai-hint="soldiers training"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
           </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Revolutionize Your Unit's Fitness
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
                    Stop guessing. Start planning. FitSquad generates tailored workout programs based on your soldiers' actual performance data.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Built for Modern Military Fitness</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From individual soldier progress to company-wide performance, our tools provide the clarity and direction needed to build a stronger, more resilient force.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature) => (
                <Card key={feature.title} className="h-full">
                  <CardHeader>
                    {feature.icon}
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} FitSquad. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
