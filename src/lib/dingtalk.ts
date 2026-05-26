import { DingTalkSettings } from './settings';

// 判断是否在 Electron 环境中
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export async function sendDingTalkNotification(
  settings: DingTalkSettings,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!settings.enabled || !settings.webhookUrl) {
    return { success: false, error: '钉钉推送未启用或未配置Webhook' };
  }

  const fullMessage = `## ${title}\n\n${message}`;

  try {
    // Electron 桌面版：通过主进程 IPC 发送（绕过 CORS）
    if (isElectron) {
      const result = await (window as any).electronAPI.sendDingTalk({
        webhookUrl: settings.webhookUrl,
        secret: settings.secret || '',
        message: fullMessage,
      });
      return result;
    }

    // 网页版：通过后端 API 中转
    const res = await fetch('/api/send-dingtalk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: settings.webhookUrl,
        secret: settings.secret || undefined,
        title,
        message,
        msgtype: settings.msgtype,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || '发送失败' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || '网络错误' };
  }
}
