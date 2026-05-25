import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG, DEFAULT_CATEGORIES } from '@/lib/types';
import { CurrentUser } from '@/lib/userAuth';
import { formatDate, getDaysUntilDue, isOverdue, isDueSoon } from '@/lib/dateUtils';
import { generateId } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface TasksPageProps {
  tasks: Task[];
  currentUser: CurrentUser;
  onUpdate: (tasks: Task[]) => void;
}

export default function TasksPage({ tasks, currentUser, onUpdate }: TasksPageProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [filterPriority, setFilterPriority] = React.useState<string>('all');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');

  const [formTitle, setFormTitle] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formPriority, setFormPriority] = React.useState<TaskPriority>('medium');
  const [formCategory, setFormCategory] = React.useState(DEFAULT_CATEGORIES[0]);
  const [formDueDate, setFormDueDate] = React.useState('');
  const [formTags, setFormTags] = React.useState('');

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const groupedTasks: Record<string, Task[]> = {
    overdue: filteredTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed' && t.status !== 'cancelled'),
    dueSoon: filteredTasks.filter(t => isDueSoon(t.dueDate) && !isOverdue(t.dueDate) && t.status !== 'completed' && t.status !== 'cancelled'),
    todo: filteredTasks.filter(t => t.status === 'todo' && !isOverdue(t.dueDate) && !isDueSoon(t.dueDate)),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    cancelled: filteredTasks.filter(t => t.status === 'cancelled'),
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormCategory(DEFAULT_CATEGORIES[0]);
    setFormDueDate('');
    setFormTags('');
    setEditingTask(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formDueDate) return;

    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingTask) {
      onUpdate(tasks.map(t =>
        t.id === editingTask.id
          ? { ...t, title: formTitle, description: formDescription, priority: formPriority, category: formCategory, dueDate: formDueDate, tags }
          : t
      ));
    } else {
      const newTask: Task = {
        id: generateId(),
        userId: currentUser.id,
        title: formTitle,
        description: formDescription,
        priority: formPriority,
        status: 'todo',
        category: formCategory,
        dueDate: formDueDate,
        createdAt: new Date().toISOString(),
        tags,
      };
      onUpdate([...tasks, newTask]);
    }
    resetForm();
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    onUpdate(tasks.map(t =>
      t.id === taskId
        ? { ...t, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined }
        : t
    ));
  };

  const handleDelete = (taskId: string) => {
    onUpdate(tasks.filter(t => t.id !== taskId));
  };

  const startEdit = (task: Task) => {
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormPriority(task.priority);
    setFormCategory(task.category);
    setFormDueDate(task.dueDate);
    setFormTags(task.tags.join(', '));
    setEditingTask(task);
    setShowForm(true);
  };

  const sectionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    overdue: { label: '逾期任务', icon: <AlertTriangle className="w-4 h-4 text-destructive" />, color: 'text-destructive' },
    dueSoon: { label: '即将到期', icon: <Clock className="w-4 h-4 text-warning" />, color: 'text-warning' },
    todo: { label: '待办', icon: <Clock className="w-4 h-4 text-muted-foreground" />, color: 'text-muted-foreground' },
    in_progress: { label: '进行中', icon: <Clock className="w-4 h-4 text-accent" />, color: 'text-accent' },
    completed: { label: '已完成', icon: <CheckCircle2 className="w-4 h-4 text-success" />, color: 'text-success' },
    cancelled: { label: '已取消', icon: <X className="w-4 h-4 text-muted-foreground" />, color: 'text-muted-foreground' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">任务管理</h1>
          <p className="text-muted-foreground text-sm mt-1">规划、跟踪和管理所有工作任务</p>
        </div>
        <Button variant="gradient" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> 新建任务
        </Button>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <Card className="shadow-glow border-primary/20 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{editingTask ? '编辑任务' : '创建新任务'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">任务标题 *</label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="输入任务标题" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">优先级</label>
                <Select value={formPriority} onChange={e => setFormPriority(e.target.value as TaskPriority)}>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">分类</label>
                <Select value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">截止日期 *</label>
                <Input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">标签（逗号分隔）</label>
                <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="标签1, 标签2" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">描述</label>
                <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="详细描述任务内容" rows={3} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="gradient" onClick={handleSave}>保存</Button>
              <Button variant="outline" onClick={resetForm}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-[130px]">
          <option value="all">全部状态</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </Select>
        <Select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="w-[130px]">
          <option value="all">全部优先级</option>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </Select>
        <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-[130px]">
          <option value="all">全部分类</option>
          {DEFAULT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Select>
      </div>

      {/* Task Groups */}
      <div className="space-y-4">
        {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => {
          if (groupTasks.length === 0) return null;
          const config = sectionConfig[groupKey];
          return (
            <Card key={groupKey}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {config.icon}
                  <CardTitle className={config.color}>{config.label}</CardTitle>
                  <Badge variant="outline">{groupTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {groupTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth group"
                    >
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", PRIORITY_CONFIG[task.priority].bgColor)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant={task.status === 'in_progress' ? 'accent' : task.status === 'completed' ? 'success' : 'outline'}>
                            {STATUS_CONFIG[task.status].label}
                          </Badge>
                          <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'outline'}>
                            {PRIORITY_CONFIG[task.priority].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{task.category}</span>
                          {task.tags.map(tag => (
                            <span key={tag} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 mr-2">
                        <p className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</p>
                        {groupKey === 'overdue' && (
                          <p className="text-xs text-destructive font-medium">逾期 {Math.abs(getDaysUntilDue(task.dueDate))} 天</p>
                        )}
                        {groupKey === 'dueSoon' && (
                          <p className="text-xs text-warning font-medium">{getDaysUntilDue(task.dueDate)} 天后到期</p>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                        {task.status === 'todo' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusChange(task.id, 'in_progress')}>
                            <Clock className="w-4 h-4 text-accent" />
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusChange(task.id, 'completed')}>
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          </Button>
                        )}
                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(task)}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">暂无任务</p>
            <p className="text-sm mt-2">点击"新建任务"按钮开始规划工作</p>
          </div>
        )}
      </div>
    </div>
  );
}