import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AlertsProvider, useAlerts } from '@/app/providers/AlertsContext';

export function AppLayout() {
  return (
    <AlertsProvider>
      <Shell />
    </AlertsProvider>
  );
}

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { summary } = useAlerts();

  return (
    <div className="flex min-h-screen flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(true)} pendingAlerts={summary.pending} />
      <div className="flex flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          pendingAlerts={summary.pending}
        />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
