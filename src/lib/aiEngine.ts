import { Task, WeeklyReport } from './types';
import { getTasksForWeek, getWeekRange, format } from './dateUtils';
import { generateId } from './storage';

const AI_ADVICE_TEMPLATES: Record<string, string[]> = {
  '清关管理': [
    '建议在货物到港前3天开始准备清关文件，预留充足的审核时间。',
    '重点关注海关政策变化，定期核查HS编码归类是否准确，避免归类错误导致的处罚。',
    '建议建立清关文件标准化模板，减少重复工作，提高效率。',
    '对于特殊监管条件（如3C认证、法检），提前确认货物是否满足要求，避免到港后无法通关。',
  ],
  '账务结算': [
    '建议每周核对账目，及时发现差异并处理，避免月末集中核对的工作压力。',
    '对于大额结算，建议分批处理并设置审批节点，降低资金风险。',
    '建立供应商账期台账，实时跟踪付款期限，避免逾期付款影响合作。',
    '建议使用电子对账系统替代手工核对，提高准确性和效率。',
  ],
  '单证管理': [
    '建议实施单证版本管理机制，每次修改均保留历史版本，便于追溯和审计。',
    '关键单证建议设置双审机制，降低单证错误率。',
    '建立单证到期提醒机制，对有有效期的文件（如许可证、资质证书）提前30天预警。',
    '建议按业务类型分类管理单证模板，减少查找时间。',
  ],
  '合规认证': [
    '建议建立合规日历，将各类认证到期时间、年检时间统一管理，避免遗漏。',
    '关注法规更新动态，建议每季度进行合规自查，确保持续合规。',
    '认证申请建议预留2-3个月缓冲期，应对可能的审核延迟。',
    '建议建立合规知识库，积累常见问题和解决方案，提升团队合规能力。',
  ],
  '物流跟踪': [
    '建议对高风险航线设置多点跟踪机制，在起运港、中转港、目的港均设置状态监控。',
    '对于时效敏感货物，建议预留2-3天的缓冲时间应对可能的延误。',
    '建立异常事件快速响应机制，设置明确的异常上报和处理流程。',
    '建议定期分析物流数据，识别延误高发环节，针对性优化。',
  ],
  '客户沟通': [
    '建议建立客户分级沟通机制，重要客户每周主动沟通，普通客户每两周跟进。',
    '沟通记录建议及时归档，便于后续查询和问题追溯。',
    '面对客户投诉，建议采用"先肯定合作、再切入问题、最后留余地"的三段式沟通结构。',
    '建议制作常见问题FAQ文档，提高沟通效率和一致性。',
  ],
  '内部协作': [
    '建议每日10分钟团队站会，快速同步关键信息，减少信息不对称。',
    '跨部门任务建议设置明确的交接节点和责任人，避免责任模糊。',
    '建议建立知识共享机制，定期组织经验分享会，提升团队整体能力。',
    '重要决策建议记录决策过程和依据，便于后续复盘和审计。',
  ],
};

export function generateAiInsight(tasks: Task[]): string {
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
  const overdueTasks = tasks.filter(t => {
    const days = Math.ceil((new Date(t.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days < 0 && t.status !== 'completed';
  });
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status === 'in_progress');

  const insights: string[] = [];

  if (overdueTasks.length > 0) {
    insights.push(`当前有${overdueTasks.length}个逾期任务，建议优先处理以避免影响后续工作进度。`);
  }
  if (urgentTasks.length > 0) {
    insights.push(`有${urgentTasks.length}个紧急任务待处理，建议集中精力在上午高效时段完成。`);
  }
  if (highPriorityTasks.length > 0) {
    insights.push(`当前${highPriorityTasks.length}个高优先级任务正在进行中，注意合理分配时间，避免多任务并行降低效率。`);
  }

  const categoryDistribution: Record<string, number> = {};
  tasks.filter(t => t.status !== 'completed').forEach(t => {
    categoryDistribution[t.category] = (categoryDistribution[t.category] || 0) + 1;
  });
  const topCategory = Object.entries(categoryDistribution).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    insights.push(`本周"${topCategory[0]}"类任务占比最高(${topCategory[1]}项)，建议关注该领域的资源分配。`);
  }

  if (insights.length === 0) {
    insights.push('当前工作节奏良好，建议保持专注，适时复盘已完成工作，提炼经验。');
  }

  return insights.join('\n');
}

export function generateCategoryAdvice(category: string): string {
  const advices = AI_ADVICE_TEMPLATES[category] || AI_ADVICE_TEMPLATES['其他'];
  return advices[Math.floor(Math.random() * advices.length)];
}

export function generateWeeklyReportText(tasks: Task[]): WeeklyReport {
  const { start, end } = getWeekRange(new Date());
  const weekTasks = getTasksForWeek(tasks);

  const highlights = weekTasks.completed.map(t => `完成: ${t.title} (${t.category})`);
  const challenges: string[] = [];
  weekTasks.inProgress.forEach(t => {
    const days = Math.ceil((new Date(t.dueDate).getTime() - new Date().getTime()) / (1004 * 60 * 60 * 24));
    if (days < 2) challenges.push(`${t.title} 即将到期，需要加快进度`);
  });

  const nextWeekPlan = weekTasks.todo.slice(0, 5).map(t => `推进: ${t.title}`);
  if (weekTasks.inProgress.length > 0) {
    nextWeekPlan.unshift(...weekTasks.inProgress.map(t => `继续完成: ${t.title}`));
  }

  const completedCount = weekTasks.completed.length;
  const totalCount = completedCount + weekTasks.inProgress.length + weekTasks.todo.length;
  const completionRate = totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0;

  const summary = `本周共完成${completedCount}项任务，完成率${completionRate}%。` +
    (weekTasks.inProgress.length > 0 ? `进行中${weekTasks.inProgress.length}项，` : '') +
    (weekTasks.todo.length > 0 ? `待办${weekTasks.todo.length}项。` : '');

  const aiInsight = generateAiInsight(tasks);

  return {
    id: generateId(),
    userId: tasks[0]?.userId || 'unknown',
    weekStart: format(start, 'yyyy-MM-dd'),
    weekEnd: format(end, 'yyyy-MM-dd'),
    completedTasks: weekTasks.completed,
    inProgressTasks: weekTasks.inProgress,
    todoTasks: weekTasks.todo,
    summary,
    highlights,
    challenges,
    nextWeekPlan: nextWeekPlan.slice(0, 8),
    aiInsight,
    createdAt: new Date().toISOString(),
  };
}