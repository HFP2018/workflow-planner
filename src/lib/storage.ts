import { Task, Reminder, WeeklyReport, AiAdvice } from './types';

const STORAGE_KEYS = {
  TASKS: 'wf_tasks',
  REMINDERS: 'wf_reminders',
  REPORTS: 'wf_reports',
  ADVICE: 'wf_advice',
};

function getItems<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export function getTasks(): Task[] {
  const existing = getItems<Task>(STORAGE_KEYS.TASKS);
  if (existing.length > 0) return existing;
  // Seed sample data for first-time users
  const sampleTasks: Task[] = [
    {id:'demo1',userId:'admin-1',title:'处理ABCD公司进口清关申报',description:'准备报关单、装箱单、发票等文件，确保HS编码准确',priority:'urgent',status:'in_progress',category:'清关管理',dueDate:'2026-05-26',createdAt:'2026-05-20T09:00:00',tags:['紧急','清关']},
    {id:'demo2',userId:'admin-1',title:'核对5月份供应商账务结算',description:'核对3家供应商的月度账单，确认金额无误',priority:'high',status:'todo',category:'账务结算',dueDate:'2026-05-28',createdAt:'2026-05-21T10:00:00',tags:['账务','月结']},
    {id:'demo3',userId:'admin-1',title:'更新出口单证模板',description:'根据最新法规更新出口报关单证模板',priority:'medium',status:'todo',category:'单证管理',dueDate:'2026-05-30',createdAt:'2026-05-22T11:00:00',tags:['单证','更新']},
    {id:'demo4',userId:'admin-1',title:'完成ISO合规认证年检',description:'提交年检材料并跟进审核进度',priority:'high',status:'completed',category:'合规认证',dueDate:'2026-05-24',createdAt:'2026-05-18T08:00:00',completedAt:'2026-05-23T16:00:00',tags:['合规','年检']},
    {id:'demo5',userId:'admin-1',title:'跟踪XYZ公司货物物流状态',description:'监控从上海到汉堡的货物运输进度',priority:'medium',status:'in_progress',category:'物流跟踪',dueDate:'2026-06-01',createdAt:'2026-05-19T09:30:00',tags:['物流','跟踪']},
    {id:'demo6',userId:'admin-1',title:'回复客户关于延误的投诉邮件',description:'客户投诉货物延误，需要协商解决方案',priority:'urgent',status:'todo',category:'客户沟通',dueDate:'2026-05-25',createdAt:'2026-05-24T14:00:00',tags:['客户','投诉']},
  ];
  setItems(STORAGE_KEYS.TASKS, sampleTasks);
  return sampleTasks;
}
export function setTasks(tasks: Task[]): void { setItems(STORAGE_KEYS.TASKS, tasks); }

export function getReminders(): Reminder[] { return getItems<Reminder>(STORAGE_KEYS.REMINDERS); }
export function setReminders(reminders: Reminder[]): void { setItems(STORAGE_KEYS.REMINDERS, reminders); }

export function getReports(): WeeklyReport[] { return getItems<WeeklyReport>(STORAGE_KEYS.REPORTS); }
export function setReports(reports: WeeklyReport[]): void { setItems(STORAGE_KEYS.REPORTS, reports); }

export function getAdvice(): AiAdvice[] { return getItems<AiAdvice>(STORAGE_KEYS.ADVICE); }
export function setAdvice(advice: AiAdvice[]): void { setItems(STORAGE_KEYS.ADVICE, advice); }

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}