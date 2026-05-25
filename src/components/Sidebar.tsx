import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Bell,
  FileText,
  Brain,
  Newspaper,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrentUser } from '@/lib/userAuth';

const baseNavItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/daily-report', label: '日报中心', icon: Newspaper },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/reminders', label: '提醒中心', icon: Bell },
  { path: '/weekly-report', label: '周报中心', icon: FileText },
  { path: '/ai-advice', label: 'AI 建议', icon: Brain },
  { path: '/settings', label: '系统设置', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentUser: CurrentUser;
  onLogout: () => void;
}

export default function Sidebar({ collapsed, onToggle, currentUser, onLogout }: SidebarProps) {
  const navItems = currentUser.role === 'admin'
    ? [...baseNavItems, { path: '/users', label: '子账号管理', icon: Users }]
    : baseNavItems;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-smooth flex flex-col",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-accent/20">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center text-sm font-bold text-white shrink-0">
            Z
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight whitespace-nowrap">
              智规划
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="px-3 py-3 border-t border-sidebar-accent/20">
        <div className={cn("flex items-center gap-2 mb-2", collapsed && "justify-center")}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            currentUser.role === 'admin' ? "gradient-primary text-white" : "bg-accent/20 text-accent"
          )}>
            {currentUser.displayName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser.displayName}</p>
              <div className="flex items-center gap-1">
                {currentUser.role === 'admin' && <ShieldCheck className="w-3 h-3 text-warning" />}
                <p className="text-xs text-sidebar-foreground/50 truncate">
                  {currentUser.role === 'admin' ? '管理员' : '子账号'}
                </p>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-smooth w-full",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>

      {/* Toggle */}
      <div className="p-3 border-t border-sidebar-accent/20">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-md hover:bg-sidebar-foreground/10 transition-smooth text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
