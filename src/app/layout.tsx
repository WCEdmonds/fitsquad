import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CapacitorInit } from '@/components/capacitor-init';
import { Onboarding } from '@/components/onboarding';
import { AuthScreen } from '@/components/auth-screen';

export const metadata: Metadata = {
  title: 'FitSquad',
  description: 'Intelligent workout planner for military units.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <CapacitorInit />
        <Onboarding />
        <main className="flex-grow">
          <FirebaseClientProvider>
            <AuthScreen />
            {children}
          </FirebaseClientProvider>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
