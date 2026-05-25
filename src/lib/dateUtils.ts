import { format, startOfWeek, endOfWeek, addDays, isWithinInterval, parseISO } from 'date-fns';
import { Task } from './types';

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

export function getTasksForWeek(tasks: Task[], date: Date = new Date()): {
  completed: Task[];
  inProgress: Task[];
  todo: Task[];
} {
  const { start, end } = getWeekRange(date);
  const completed = tasks.filter(t => {
    if (t.status !== 'completed' || !t.completedAt) return false;
    return isWithinInterval(parseISO(t.completedAt), { start, end });
  });
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const todo = tasks.filter(t => t.status === 'todo');
  return { completed, inProgress, todo };
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

export function formatDateCN(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MM月dd日');
  } catch {
    return dateStr;
  }
}

export function getDaysUntilDue(dueDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = parseISO(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDate: string): boolean {
  return getDaysUntilDue(dueDate) < 0;
}

export function isDueSoon(dueDate: string, threshold: number = 3): boolean {
  const days = getDaysUntilDue(dueDate);
  return days >= 0 && days <= threshold;
}

export { format, parseISO, startOfWeek, endOfWeek, addDays };