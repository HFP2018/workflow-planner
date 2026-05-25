import { DingTalkSettings } from './settings';

export async function sendDingTalkNotification(
  settings: DingTalkSettings,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!settings.enabled || !settings.webhookUrl) {
    return { success: false, error: '钉钉推送未启用或未配置Webhook' };
  }

  try {
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
