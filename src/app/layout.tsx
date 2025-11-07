import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { CapacitorInit } from '@/components/capacitor-init';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <CapacitorInit />
        <div className="
          w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 py-2 px-3
          pt-[calc(0.5rem+env(safe-area-inset-top))]
          text-center text-xs font-bold text-yellow-900
          no-print shadow-sm border-b border-yellow-500
        ">
          ⚠️ BETA - DO NOT USE FOR LIVE OPERATIONS
        </div>
        <main className="flex-grow">
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
