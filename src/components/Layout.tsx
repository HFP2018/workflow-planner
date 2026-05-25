import React from 'react';
import Sidebar from './Sidebar';
import { CurrentUser } from '@/lib/userAuth';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: CurrentUser;
  onLogout: () => void;
}

export default function Layout({ children, currentUser, onLogout }: LayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <main
        className="transition-smooth"
        style={{ marginLeft: collapsed ? '60px' : '220px' }}
      >
        <div className="p-6 max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
