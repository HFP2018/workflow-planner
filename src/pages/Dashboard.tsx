import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { Task, PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/types';
import { formatDateCN, getDaysUntilDue, isOverdue, isDueSoon } from '@/lib/dateUtils';
import { generateCategoryAdvice, generateAiInsight } from '@/lib/aiEngine';
import { useToast } from '@/components/ui/toast';

interface DashboardProps {
  tasks: Task[];
  onNavigate: (path: string) => void;
}

export default function Dashboard({ tasks, onNavigate }: DashboardProps) {
  const { showToast } = useToast();
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = activeTasks.filter(t => isOverdue(t.dueDate));
  const dueSoonTasks = activeTasks.filter(t => isDueSoon(t.dueDate) && !isOverdue(t.dueDate));
  const inProgressTasks = activeTasks.filter(t => t.status === 'in_progress');

  const stats = [
    {
      label: '待办任务',
      value: activeTasks.filter(t => t.status === 'todo').length,
      icon: ListTodo,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '进行中',
      value: inProgressTasks.length,
      icon: Clock,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: '已完成',
      value: completedTasks.length,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: '逾期警告',
      value: overdueTasks.length,
      icon: AlertTriangle,
      color: overdueTasks.length > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: overdueTasks.length > 0 ? 'bg-destructive/10' : 'bg-muted',
    },
  ];

  const aiInsight = generateAiInsight(tasks);
  const dailyAdvice = generateCategoryAdvice('清关管理');

  React.useEffect(() => {
    if (overdueTasks.length > 0) {
      showToast({
        message: `有 ${overdueTasks.length} 个任务已逾期，请尽快处理！`,
        type: 'warning',
        duration: 5000,
      });
    }
    if (dueSoonTasks.length > 0) {
      showToast({
        message: `有 ${dueSoonTasks.length} 个任务即将到期`,
        type: 'info',
        duration: 4000,
      });
    }
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">工作概览</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <Button variant="gradient" onClick={() => onNavigate('/tasks')}>
          创建新任务
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="hover:shadow-glow cursor-default">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>今日任务</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/tasks')}>
                查看全部 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <CardDescription>当前需要关注的任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTasks.slice(0, 6).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth group cursor-pointer"
                  onClick={() => onNavigate('/tasks')}
                >
                  <div className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[task.priority].bgColor} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={task.status === 'in_progress' ? 'accent' : task.status === 'todo' ? 'outline' : 'default'}>
                        {STATUS_CONFIG[task.status].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{task.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{formatDateCN(task.dueDate)}</p>
                    {isOverdue(task.dueDate) && (
                      <p className="text-xs text-destructive font-medium">逾期</p>
                    )}
                    {isDueSoon(task.dueDate) && !isOverdue(task.dueDate) && (
                      <p className="text-xs text-warning font-medium">{getDaysUntilDue(task.dueDate)}天后</p>
                    )}
                  </div>
                </div>
              ))}
              {activeTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>暂无待办任务</p>
                  <p className="text-sm mt-1">点击右上角创建新任务开始规划</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Insight */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <CardTitle>AI 智能洞察</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                {aiInsight.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <Button variant="accent" size="sm" className="w-full mt-4" onClick={() => onNavigate('/ai-advice')}>
                获取更多建议
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-warning" />
                </div>
                <CardTitle>今日专业建议</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{dailyAdvice}</p>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate('/daily-report')}>
                生成今日日报
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate('/weekly-report')}>
                生成本周周报
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate('/reminders')}>
                查看提醒事项
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}