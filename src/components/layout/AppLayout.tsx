import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { FeedbackButton } from '@/components/FeedbackButton';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full gradient-bg">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-4 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-primary">Hall Booking System</h1>
          </header>
          <div className="flex-1 p-6 overflow-x-auto gradient-bg">
            {children}
          </div>
        </main>
        <FeedbackButton />
      </div>
    </SidebarProvider>
  );
}
