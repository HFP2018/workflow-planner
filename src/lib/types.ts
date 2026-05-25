export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type ReminderType = 'deadline' | 'important' | 'custom';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  tags: string[];
}

export interface Reminder {
  id: string;
  userId: string;
  taskId?: string;
  title: string;
  message: string;
  type: ReminderType;
  triggerDate: string;
  isRead: boolean;
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  completedTasks: Task[];
  inProgressTasks: Task[];
  todoTasks: Task[];
  summary: string;
  highlights: string[];
  challenges: string[];
  nextWeekPlan: string[];
  aiInsight: string;
  createdAt: string;
}

export interface AiAdvice {
  id: string;
  userId: string;
  taskId?: string;
  category: string;
  question: string;
  advice: string;
  createdAt: string;
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: '紧急', color: 'text-destructive', bgColor: 'bg-destructive/10' },
  high: { label: '高', color: 'text-warning', bgColor: 'bg-warning/10' },
  medium: { label: '中', color: 'text-accent', bgColor: 'bg-accent/10' },
  low: { label: '低', color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  todo: { label: '待办', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  in_progress: { label: '进行中', color: 'text-accent', bgColor: 'bg-accent/10' },
  completed: { label: '已完成', color: 'text-success', bgColor: 'bg-success/10' },
  cancelled: { label: '已取消', color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

export const DEFAULT_CATEGORIES = [
  '清关管理',
  '账务结算',
  '单证管理',
  '合规认证',
  '物流跟踪',
  '客户沟通',
  '内部协作',
  '其他',
];