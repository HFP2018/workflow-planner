import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Bell,
  BellRing,
  AlertTriangle,
  Clock,
  Plus,
  X,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { Reminder, ReminderType, Task } from '@/lib/types';
import { CurrentUser } from '@/lib/userAuth';
import { formatDateCN } from '@/lib/dateUtils';
import { generateId } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { getDingTalkSettings } from '@/lib/settings';
import { sendDingTalkNotification } from '@/lib/dingtalk';

interface RemindersPageProps {
  reminders: Reminder[];
  tasks: Task[];
  currentUser: CurrentUser;
  onUpdate: (reminders: Reminder[]) => void;
}

const TYPE_CONFIG: Record<ReminderType, { label: string; icon: React.ReactNode; color: string; badgeVariant: 'destructive' | 'warning' | 'accent' }> = {
  deadline: { label: '截止提醒', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-destructive', badgeVariant: 'destructive' },
  important: { label: '重要事项', icon: <BellRing className="w-4 h-4" />, color: 'text-warning', badgeVariant: 'warning' },
  custom: { label: '自定义', icon: <Clock className="w-4 h-4" />, color: 'text-accent', badgeVariant: 'accent' },
};

export default function RemindersPage({ reminders, tasks, currentUser, onUpdate }: RemindersPageProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [formTitle, setFormTitle] = React.useState('');
  const [formMessage, setFormMessage] = React.useState('');
  const [formType, setFormType] = React.useState<ReminderType>('custom');
  const [formTriggerDate, setFormTriggerDate] = React.useState('');
  const [formTaskId, setFormTaskId] = React.useState('');

  const unreadReminders = reminders.filter(r => !r.isRead);
  const readReminders = reminders.filter(r => r.isRead);

  const resetForm = () => {
    setFormTitle('');
    setFormMessage('');
    setFormType('custom');
    setFormTriggerDate('');
    setFormTaskId('');
    setShowForm(false);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formTriggerDate) return;
    const newReminder: Reminder = {
      id: generateId(),
      userId: currentUser.id,
      taskId: formTaskId || undefined,
      title: formTitle,
      message: formMessage,
      type: formType,
      triggerDate: formTriggerDate,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    onUpdate([...reminders, newReminder]);
    const settings = getDingTalkSettings();
    if (settings.enabled) {
      sendDingTalkNotification(settings, newReminder.title, newReminder.message || newReminder.title);
    }
    resetForm();
  };

  const handleMarkRead = (id: string) => {
    onUpdate(reminders.map(r => r.id === id ? { ...r, isRead: true } : r));
  };

  const handleMarkAllRead = () => {
    onUpdate(reminders.map(r => ({ ...r, isRead: true })));
  };

  const handleDelete = (id: string) => {
    onUpdate(reminders.filter(r => r.id !== id));
  };

  // Auto-generate reminders for overdue and due-soon tasks
  React.useEffect(() => {
    const autoReminders: Reminder[] = [];
    tasks.forEach(task => {
      if (task.status === 'completed' || task.status === 'cancelled') return;
      const days = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (days < 0) {
        const exists = reminders.some(r => r.taskId === task.id && r.type === 'deadline');
        if (!exists) {
          autoReminders.push({
            id: generateId(),
            userId: task.userId,
            taskId: task.id,
            title: `任务逾期: ${task.title}`,
            message: `任务"${task.title}"已逾期${Math.abs(days)}天，请尽快处理。`,
            type: 'deadline',
            triggerDate: task.dueDate,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      } else if (days <= 3) {
        const exists = reminders.some(r => r.taskId === task.id && r.type === 'important');
        if (!exists) {
          autoReminders.push({
            id: generateId(),
            userId: task.userId,
            taskId: task.id,
            title: `即将到期: ${task.title}`,
            message: `任务"${task.title}"将在${days}天后到期，请关注进度。`,
            type: 'important',
            triggerDate: task.dueDate,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
    if (autoReminders.length > 0) {
      onUpdate([...reminders, ...autoReminders]);
      const settings = getDingTalkSettings();
      if (settings.enabled) {
        autoReminders.forEach(r => {
          sendDingTalkNotification(settings, r.title, r.message || r.title);
        });
      }
    }
  }, [tasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">提醒中心</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理任务截止提醒和重要事项提醒
          </p>
        </div>
        <div className="flex gap-2">
          {unreadReminders.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4 mr-1" /> 全部标记已读
            </Button>
          )}
          <Button variant="gradient" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> 新建提醒
          </Button>
        </div>
      </div>

      {/* Create Reminder Form */}
      {showForm && (
        <Card className="shadow-glow border-primary/20 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>创建新提醒</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">提醒标题 *</label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="输入提醒标题" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">提醒类型</label>
                <Select value={formType} onChange={e => setFormType(e.target.value as ReminderType)}>
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">触发日期 *</label>
                <Input type="date" value={formTriggerDate} onChange={e => setFormTriggerDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">关联任务（可选）</label>
                <Select value={formTaskId} onChange={e => setFormTaskId(e.target.value)}>
                  <option value="">不关联任务</option>
                  {tasks.filter(t => t.status !== 'completed').map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">提醒内容</label>
                <Textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="详细提醒内容" rows={3} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="gradient" onClick={handleSave}>保存</Button>
              <Button variant="outline" onClick={resetForm}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unread Reminders */}
      {unreadReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-destructive animate-pulse-soft" />
              <CardTitle>未读提醒</CardTitle>
              <Badge variant="destructive">{unreadReminders.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadReminders.map(reminder => {
                const config = TYPE_CONFIG[reminder.type];
                const relatedTask = reminder.taskId ? tasks.find(t => t.id === reminder.taskId) : null;
                return (
                  <div
                    key={reminder.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-smooth group"
                  >
                    <div className={cn("mt-0.5", config.color)}>{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{reminder.title}</p>
                      {reminder.message && (
                        <p className="text-xs text-muted-foreground mt-1">{reminder.message}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={config.badgeVariant}>{config.label}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateCN(reminder.triggerDate)}</span>
                        {relatedTask && (
                          <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                            关联: {relatedTask.title}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-smooth shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkRead(reminder.id)}>
                        <CheckCheck className="w-4 h-4 text-success" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(reminder.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read Reminders */}
      {readReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-muted-foreground">已读提醒</CardTitle>
              <Badge variant="outline">{readReminders.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {readReminders.map(reminder => {
                const config = TYPE_CONFIG[reminder.type];
                return (
                  <div key={reminder.id} className="flex items-start gap-3 p-3 rounded-lg opacity-60 group hover:opacity-80 transition-smooth">
                    <div className={cn("mt-0.5", config.color)}>{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{reminder.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{config.label}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateCN(reminder.triggerDate)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-smooth" onClick={() => handleDelete(reminder.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {reminders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">暂无提醒</p>
          <p className="text-sm mt-2">系统会自动为逾期和即将到期的任务生成提醒</p>
        </div>
      )}
    </div>
  );
}