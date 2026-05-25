export interface DingTalkSettings {
  enabled: boolean;
  webhookUrl: string;
  secret: string;
  msgtype: 'markdown' | 'text';
}

const SETTINGS_KEY = 'zh_guihua_settings';

export function getDingTalkSettings(): DingTalkSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? false,
        webhookUrl: parsed.webhookUrl ?? '',
        secret: parsed.secret ?? '',
        msgtype: parsed.msgtype ?? 'markdown',
      };
    }
  } catch {
    // ignore
  }
  return {
    enabled: false,
    webhookUrl: '',
    secret: '',
    msgtype: 'markdown',
  };
}

export function setDingTalkSettings(settings: DingTalkSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
