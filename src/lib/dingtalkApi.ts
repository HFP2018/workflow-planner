// 钉钉 API 数据源配置与拉取模块
// 实际使用时需要配置真实的 AppKey、AppSecret 等

export interface DingTalkConfig {
  appKey: string;
  appSecret: string;
  agentId: string;
  corpId: string;
  isConnected: boolean;
}

export interface DingTalkMessage {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  chatName: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'approval';
  isRead: boolean;
}

export interface DingTalkTask {
  id: string;
  title: string;
  creator: string;
  assignee: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  priority: 'normal' | 'urgent' | 'high';
}

export interface DingTalkApproval {
  id: string;
  title: string;
  initiator: string;
  status: 'pending' | 'approved' | 'rejected';
  createTime: string;
  type: string;
}

const DEFAULT_CONFIG: DingTalkConfig = {
  appKey: '',
  appSecret: '',
  agentId: '',
  corpId: '',
  isConnected: false,
};

const STORAGE_KEY_DINGTALK_CONFIG = 'wf_dingtalk_config';
const STORAGE_KEY_DINGTALK_MESSAGES = 'wf_dingtalk_messages';
const STORAGE_KEY_DINGTALK_TASKS = 'wf_dingtalk_tasks';
const STORAGE_KEY_DINGTALK_APPROVALS = 'wf_dingtalk_approvals';

export function getDingTalkConfig(): DingTalkConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DINGTALK_CONFIG);
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setDingTalkConfig(config: DingTalkConfig): void {
  localStorage.setItem(STORAGE_KEY_DINGTALK_CONFIG, JSON.stringify(config));
}

export function getDingTalkMessages(): DingTalkMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DINGTALK_MESSAGES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setDingTalkMessages(messages: DingTalkMessage[]): void {
  localStorage.setItem(STORAGE_KEY_DINGTALK_MESSAGES, JSON.stringify(messages));
}

export function getDingTalkTasks(): DingTalkTask[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DINGTALK_TASKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setDingTalkTasks(tasks: DingTalkTask[]): void {
  localStorage.setItem(STORAGE_KEY_DINGTALK_TASKS, JSON.stringify(tasks));
}

export function getDingTalkApprovals(): DingTalkApproval[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DINGTALK_APPROVALS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setDingTalkApprovals(approvals: DingTalkApproval[]): void {
  localStorage.setItem(STORAGE_KEY_DINGTALK_APPROVALS, JSON.stringify(approvals));
}

/**
 * 钉钉 API 拉取方法
 * 实际使用时替换为真实的钉钉开放平台 API 调用
 * 文档: https://open.dingtalk.com/document/
 */
export async function fetchDingTalkData(config: DingTalkConfig): Promise<{
  messages: DingTalkMessage[];
  tasks: DingTalkTask[];
  approvals: DingTalkApproval[];
}> {
  if (!config.appKey || !config.appSecret) {
    // 未配置API时返回模拟数据
    return generateMockDingTalkData();
  }

  try {
    // 1. 获取 access_token
    const tokenRes = await fetch('https://api.dingtalk.com/v1.0/oauth2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appKey: config.appKey,
        appSecret: config.appSecret,
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.accessToken;

    // 2. 拉取消息（示例 - 实际API端点需根据钉钉文档调整）
    // const messagesRes = await fetch(...)

    // 3. 拉取任务
    // const tasksRes = await fetch(...)

    // 4. 拉取审批
    // const approvalsRes = await fetch(...)

    // 当API配置完成但尚未完全实现时，返回模拟数据
    void accessToken;
    return generateMockDingTalkData();
  } catch {
    return generateMockDingTalkData();
  }
}

function generateMockDingTalkData(): {
  messages: DingTalkMessage[];
  tasks: DingTalkTask[];
  approvals: DingTalkApproval[];
} {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  return {
    messages: [
      {
        id: 'dt-msg-1',
        sender: 'zhangsan',
        senderName: '张三',
        content: '韩经理，ABCD公司的清关文件已提交，请审核。',
        chatName: '清关业务群',
        timestamp: now,
        type: 'text',
        isRead: false,
      },
      {
        id: 'dt-msg-2',
        sender: 'lisi',
        senderName: '李四',
        content: '5月份供应商账单已核对完毕，有2笔差异需要确认。',
        chatName: '财务核算群',
        timestamp: now,
        type: 'text',
        isRead: false,
      },
      {
        id: 'dt-msg-3',
        sender: 'wangwu',
        senderName: '王五',
        content: 'XYZ公司货物已到汉堡港，预计明天完成清关。',
        chatName: '物流跟踪群',
        timestamp: now,
        type: 'text',
        isRead: true,
      },
      {
        id: 'dt-msg-4',
        sender: 'zhaoliu',
        senderName: '赵六',
        content: 'ISO年检材料已提交至认证机构，等待反馈。',
        chatName: '合规认证群',
        timestamp: now,
        type: 'text',
        isRead: true,
      },
    ],
    tasks: [
      {
        id: 'dt-task-1',
        title: '审核ABCD公司清关文件',
        creator: '张三',
        assignee: '韩方浦',
        status: 'pending',
        dueDate: today,
        priority: 'urgent',
      },
      {
        id: 'dt-task-2',
        title: '确认5月账单差异',
        creator: '李四',
        assignee: '韩方浦',
        status: 'pending',
        dueDate: today,
        priority: 'high',
      },
      {
        id: 'dt-task-3',
        title: '安排XYZ货物提货',
        creator: '王五',
        assignee: '韩方浦',
        status: 'in_progress',
        dueDate: today,
        priority: 'normal',
      },
    ],
    approvals: [
      {
        id: 'dt-approval-1',
        title: 'ABCD公司清关费用报销',
        initiator: '张三',
        status: 'pending',
        createTime: now,
        type: '费用报销',
      },
      {
        id: 'dt-approval-2',
        title: '5月物流供应商合同续签',
        initiator: '李四',
        status: 'pending',
        createTime: now,
        type: '合同审批',
      },
    ],
  };
}