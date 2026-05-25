import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ToastProvider } from '@/components/ui/toast';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import DailyReportPage from '@/pages/DailyReportPage';
import TasksPage from '@/pages/TasksPage';
import RemindersPage from '@/pages/RemindersPage';
import WeeklyReportPage from '@/pages/WeeklyReportPage';
import AiAdvicePage from '@/pages/AiAdvicePage';
import UserManagementPage from '@/pages/UserManagementPage';
import SettingsPage from '@/pages/SettingsPage';
import { Task, Reminder } from '@/lib/types';
import { getTasks, setTasks, getReminders, setReminders } from '@/lib/storage';
import { CurrentUser, getCurrentUser, setCurrentUser, logout } from '@/lib/userAuth';
import { useToast } from '@/components/ui/toast';

function AppContent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentUser, setCurrentUserState] = React.useState<CurrentUser | null>(getCurrentUser());

  // 数据状态管理
  const [allTasks, setAllTasks] = React.useState<Task[]>(getTasks());
  const [allReminders, setAllReminders] = React.useState<Reminder[]>(getReminders());

  // 用户切换时重新加载数据
  React.useEffect(() => {
    setAllTasks(getTasks());
    setAllReminders(getReminders());
  }, [currentUser]);

  const visibleTasks = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return allTasks;
    return allTasks.filter(t => t.userId === currentUser.id);
  }, [allTasks, currentUser]);

  const visibleReminders = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return allReminders;
    return allReminders.filter(r => r.userId === currentUser.id);
  }, [allReminders, currentUser]);

  const handleLogin = (user: CurrentUser) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    showToast({ message: `欢迎回来，${user.displayName}`, type: 'success' });
  };

  const handleLogout = () => {
    logout();
    setCurrentUserState(null);
    showToast({ message: '已退出登录', type: 'info' });
    navigate('/login');
  };

  const handleTasksUpdate = (newVisibleTasks: Task[]) => {
    // 保留其他用户的任务（子账号模式下），管理员则直接覆盖全部
    const otherTasks = currentUser?.role === 'admin'
      ? []
      : allTasks.filter(t => t.userId !== currentUser?.id);
    const merged = [...otherTasks, ...newVisibleTasks];
    setTasks(merged);
    setAllTasks(merged);
  };

  const handleRemindersUpdate = (newVisibleReminders: Reminder[]) => {
    const otherReminders = currentUser?.role === 'admin'
      ? []
      : allReminders.filter(r => r.userId !== currentUser?.id);
    const merged = [...otherReminders, ...newVisibleReminders];
    setReminders(merged);
    setAllReminders(merged);
  };

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout currentUser={currentUser} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard tasks={visibleTasks} onNavigate={(path) => navigate(path)} />} />
        <Route path="/daily-report" element={<DailyReportPage tasks={visibleTasks} />} />
        <Route path="/tasks" element={
          <TasksPage
            tasks={visibleTasks}
            currentUser={currentUser}
            onUpdate={(tasks) => {
              handleTasksUpdate(tasks);
            }}
          />
        } />
        <Route path="/reminders" element={
          <RemindersPage
            reminders={visibleReminders}
            tasks={visibleTasks}
            currentUser={currentUser}
            onUpdate={handleRemindersUpdate}
          />
        } />
        <Route path="/weekly-report" element={<WeeklyReportPage tasks={visibleTasks} />} />
        <Route path="/ai-advice" element={<AiAdvicePage tasks={visibleTasks} currentUser={currentUser} />} />
        {currentUser.role === 'admin' && (
          <Route path="/users" element={<UserManagementPage currentUser={currentUser} />} />
        )}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  );
}
