import * as XLSX from 'xlsx';
import { DailyReport } from './dailyReportEngine';
import { PRIORITY_CONFIG, STATUS_CONFIG } from './types';
import { Task } from './types';

export function exportDailyReportToXlsx(report: DailyReport): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 日报概览
  const overviewData = [
    ['智规划 - 工作日报'],
    ['日期', report.date],
    ['生成时间', report.createdAt],
    [''],
    ['日报摘要', report.summary],
    [''],
    ['重要通知'],
    ...report.importantNotices.map((n, i) => [`${i + 1}`, n]),
    [''],
    ['AI 智能洞察'],
    ...report.aiInsight.split('\n').map(line => [line]),
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  wsOverview['!cols'] = [{ wch: 20 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, '日报概览');

  // Sheet 2: 关键沟通
  const commHeader = ['来源', '发送人', '主题/内容', '摘要', '优先级', '时间'];
  const commData: (string | undefined)[][] = [commHeader];
  report.keyCommunications.forEach(item => {
    commData.push([
      item.source,
      item.from,
      item.subject,
      item.summary,
      item.priority === 'high' ? '高' : item.priority === 'normal' ? '中' : '低',
      item.time,
    ]);
  });
  const wsComm = XLSX.utils.aoa_to_sheet(commData);
  wsComm['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 35 }, { wch: 50 }, { wch: 8 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsComm, '关键沟通');

  // Sheet 3: 待办事项
  const actionHeader = ['来源', '任务', '描述', '优先级', '截止日期'];
  const actionData: (string | undefined)[][] = [actionHeader];
  report.pendingActions.forEach(item => {
    actionData.push([
      item.source,
      item.title,
      item.description,
      item.priority === 'urgent' ? '紧急' : item.priority === 'high' ? '高' : '中',
      item.dueDate || '-',
    ]);
  });
  const wsAction = XLSX.utils.aoa_to_sheet(actionData);
  wsAction['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 40 }, { wch: 8 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsAction, '待办事项');

  // Sheet 4: 已完成
  const completedHeader = ['序号', '已完成事项'];
  const completedData = [completedHeader];
  report.completedItems.forEach((item, i) => {
    completedData.push([`${i + 1}`, item]);
  });
  const wsCompleted = XLSX.utils.aoa_to_sheet(completedData);
  wsCompleted['!cols'] = [{ wch: 8 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsCompleted, '已完成事项');

  // Sheet 5: 系统任务明细
  const taskHeader = ['任务', '分类', '状态', '优先级', '截止日期', '标签'];
  const taskData: (string | undefined)[][] = [taskHeader];
  report.systemTasks.forEach(task => {
    taskData.push([
      task.title,
      task.category,
      STATUS_CONFIG[task.status].label,
      PRIORITY_CONFIG[task.priority].label,
      task.dueDate,
      task.tags.join(', '),
    ]);
  });
  const wsTask = XLSX.utils.aoa_to_sheet(taskData);
  wsTask['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsTask, '任务明细');

  // 导出
  XLSX.writeFile(wb, `工作日报_${report.date}.xlsx`);
}

export function exportTaskListToXlsx(tasks: Task[]): void {
  const wb = XLSX.utils.book_new();
  const header = ['任务', '描述', '分类', '状态', '优先级', '截止日期', '创建日期', '完成日期', '标签'];
  const data: (string | undefined)[][] = [header];
  tasks.forEach(task => {
    data.push([
      task.title,
      task.description,
      task.category,
      STATUS_CONFIG[task.status].label,
      PRIORITY_CONFIG[task.priority].label,
      task.dueDate,
      task.createdAt.split('T')[0],
      task.completedAt?.split('T')[0],
      task.tags.join(', '),
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 30 }, { wch: 40 }, { wch: 12 }, { wch: 8 },
    { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '任务列表');
  XLSX.writeFile(wb, `任务列表_${new Date().toISOString().split('T')[0]}.xlsx`);
}