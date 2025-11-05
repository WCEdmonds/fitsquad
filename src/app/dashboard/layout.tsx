import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dumbbell, LogOut } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Dumbbell className="size-6" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <h2 className="font-headline text-lg font-semibold">UnitFit Planner</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage src="https://picsum.photos/seed/user/100/100" alt="Commander" data-ai-hint="person portrait" />
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">Commander</span>
              <span className="text-xs text-muted-foreground">Unit Lead</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto group-data-[collapsible=icon]:hidden">
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Page specific header content can go here */}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
