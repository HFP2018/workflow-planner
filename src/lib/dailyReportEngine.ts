import { Task } from './types';
import { DingTalkMessage, DingTalkTask, DingTalkApproval } from './dingtalkApi';
import { EmailMessage } from './emailApi';
import { format } from './dateUtils';
import { generateId } from './storage';

export interface DailyReport {
  id: string;
  date: string;
  // 数据来源
  dingTalkMessages: DingTalkMessage[];
  dingTalkTasks: DingTalkTask[];
  dingTalkApprovals: DingTalkApproval[];
  emailMessages: EmailMessage[];
  systemTasks: Task[];
  // 汇总内容
  summary: string;
  keyCommunications: CommunicationItem[];
  pendingActions: ActionItem[];
  completedItems: string[];
  importantNotices: string[];
  aiInsight: string;
  createdAt: string;
}

export interface CommunicationItem {
  source: '钉钉' | '邮箱';
  from: string;
  subject: string;
  summary: string;
  priority: 'high' | 'normal' | 'low';
  time: string;
}

export interface ActionItem {
  source: '钉钉' | '邮箱' | '智规划';
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal';
  dueDate?: string;
}

export function generateDailyReport(
  tasks: Task[],
  dingTalkMessages: DingTalkMessage[],
  dingTalkTasks: DingTalkTask[],
  dingTalkApprovals: DingTalkApproval[],
  emailMessages: EmailMessage[],
): DailyReport {
  const today = format(new Date(), 'yyyy-MM-dd');

  // 1. 汇总关键沟通
  const keyCommunications: CommunicationItem[] = [];

  // 钉钉消息
  dingTalkMessages.forEach(msg => {
    keyCommunications.push({
      source: '钉钉',
      from: msg.senderName,
      subject: `[${msg.chatName}] ${msg.content.slice(0, 30)}...`,
      summary: msg.content,
      priority: msg.type === 'approval' ? 'high' : 'normal',
      time: format(new Date(msg.timestamp), 'HH:mm'),
    });
  });

  // 邮件
  emailMessages.forEach(email => {
    keyCommunications.push({
      source: '邮箱',
      from: email.fromName,
      subject: email.subject,
      summary: email.body.slice(0, 100),
      priority: email.priority,
      time: format(new Date(email.date), 'HH:mm'),
    });
  });

  // 按优先级排序
  keyCommunications.sort((a, b) => {
    const order = { high: 0, normal: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  // 2. 汇总待办事项
  const pendingActions: ActionItem[] = [];

  // 钉钉任务
  dingTalkTasks.filter(t => t.status !== 'completed').forEach(task => {
    pendingActions.push({
      source: '钉钉',
      title: task.title,
      description: `创建人: ${task.creator}，指派给: ${task.assignee}`,
      priority: task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : 'normal',
      dueDate: task.dueDate,
    });
  });

  // 钉钉待审批
  dingTalkApprovals.filter(a => a.status === 'pending').forEach(approval => {
    pendingActions.push({
      source: '钉钉',
      title: `审批: ${approval.title}`,
      description: `发起人: ${approval.initiator}，类型: ${approval.type}`,
      priority: 'high',
    });
  });

  // 邮件中需要回复的
  emailMessages.filter(e => !e.isRead && e.priority === 'high').forEach(email => {
    pendingActions.push({
      source: '邮箱',
      title: `回复: ${email.subject}`,
      description: `来自: ${email.fromName} <${email.from}>`,
      priority: 'high',
    });
  });

  // 系统中的紧急/高优先级待办
  tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').forEach(task => {
    pendingActions.push({
      source: '智规划',
      title: task.title,
      description: task.description,
      priority: task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : 'normal',
      dueDate: task.dueDate,
    });
  });

  // 按优先级排序
  pendingActions.sort((a, b) => {
    const order = { urgent: 0, high: 1, normal: 2 };
    return order[a.priority] - order[b.priority];
  });

  // 3. 已完成事项
  const completedItems = tasks
    .filter(t => t.status === 'completed')
    .map(t => `${t.title} (${t.category})`);

  // 4. 重要通知
  const importantNotices: string[] = [];
  const unreadMsgs = dingTalkMessages.filter(m => !m.isRead);
  if (unreadMsgs.length > 0) {
    importantNotices.push(`钉钉有 ${unreadMsgs.length} 条未读消息需要关注`);
  }
  const unreadEmails = emailMessages.filter(e => !e.isRead);
  if (unreadEmails.length > 0) {
    importantNotices.push(`邮箱有 ${unreadEmails.length} 封未读邮件需要处理`);
  }
  const pendingApprovals = dingTalkApprovals.filter(a => a.status === 'pending');
  if (pendingApprovals.length > 0) {
    importantNotices.push(`有 ${pendingApprovals.length} 个钉钉审批待处理`);
  }
  const urgentActions = pendingActions.filter(a => a.priority === 'urgent');
  if (urgentActions.length > 0) {
    importantNotices.push(`有 ${urgentActions.length} 项紧急任务需要立即处理`);
  }

  // 5. AI 洞察
  const aiInsight = generateDailyAiInsight(tasks, dingTalkMessages, emailMessages, pendingActions);

  // 6. 日报摘要
  const summary = `今日收到钉钉消息${dingTalkMessages.length}条（${unreadMsgs.length}条未读），` +
    `邮件${emailMessages.length}封（${unreadEmails.length}封未读），` +
    `待办任务${pendingActions.length}项（${urgentActions.length}项紧急），` +
    `待审批${pendingApprovals.length}项，` +
    `已完成${completedItems.length}项。`;

  return {
    id: generateId(),
    date: today,
    dingTalkMessages,
    dingTalkTasks,
    dingTalkApprovals,
    emailMessages,
    systemTasks: tasks,
    summary,
    keyCommunications,
    pendingActions,
    completedItems,
    importantNotices,
    aiInsight,
    createdAt: new Date().toISOString(),
  };
}

function generateDailyAiInsight(
  tasks: Task[],
  dingTalkMessages: DingTalkMessage[],
  emailMessages: EmailMessage[],
  pendingActions: ActionItem[],
): string {
  const insights: string[] = [];

  const urgentCount = pendingActions.filter(a => a.priority === 'urgent').length;
  const highCount = pendingActions.filter(a => a.priority === 'high').length;

  if (urgentCount > 0) {
    insights.push(`今日有${urgentCount}项紧急任务，建议优先处理，避免影响业务进度。`);
  }
  if (highCount > 2) {
    insights.push(`高优先级任务较多(${highCount}项)，建议按紧急程度排序逐项处理，避免多任务并行降低效率。`);
  }

  // 分析沟通热点
  const dtGroups = new Set(dingTalkMessages.map(m => m.chatName));
  if (dtGroups.size > 0) {
    insights.push(`钉钉${Array.from(dtGroups).join('、')}群有新消息，关注关键业务进展。`);
  }

  // 分析邮件中是否有客户沟通
  const clientEmails = emailMessages.filter(e => !e.from.includes('starmex.com'));
  if (clientEmails.length > 0) {
    insights.push(`收到${clientEmails.length}封外部邮件，建议及时回复维护客户关系。采用"先肯定合作、再切入问题、最后留余地"的沟通策略。`);
  }

  // 分析任务-邮件关联
  const overdueTasks = tasks.filter(t => {
    const days = Math.ceil((new Date(t.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days < 0 && t.status !== 'completed' && t.status !== 'cancelled';
  });
  if (overdueTasks.length > 0) {
    insights.push(`有${overdueTasks.length}项任务已逾期，需尽快推进并与相关方沟通延期原因。`);
  }

  if (insights.length === 0) {
    insights.push('今日工作节奏正常，建议保持专注，有序推进各项任务。');
  }

  return insights.join('\n');
}