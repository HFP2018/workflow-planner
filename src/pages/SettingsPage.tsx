import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Send, MessageSquare, Link2, KeyRound } from 'lucide-react';
import { getDingTalkSettings, setDingTalkSettings, DingTalkSettings } from '@/lib/settings';
import { sendDingTalkNotification } from '@/lib/dingtalk';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = React.useState<DingTalkSettings>(getDingTalkSettings);
  const [testLoading, setTestLoading] = React.useState(false);

  const update = (patch: Partial<DingTalkSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setDingTalkSettings(next);
  };

  const handleTest = async () => {
    setTestLoading(true);
    const result = await sendDingTalkNotification(
      settings,
      '智规划测试消息',
      '这是一条来自【智规划】的钉钉推送测试。如果您收到此消息，说明配置成功！'
    );
    setTestLoading(false);
    if (result.success) {
      showToast({ message: '测试消息已发送，请检查钉钉', type: 'success' });
    } else {
      showToast({ message: `发送失败：${result.error}`, type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">系统设置</h1>
        <p className="text-muted-foreground text-sm mt-1">配置通知、推送等系统功能</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            <CardTitle>钉钉机器人推送</CardTitle>
            <Badge variant={settings.enabled ? 'success' : 'outline'}>
              {settings.enabled ? '已启用' : '未启用'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">启用钉钉推送</p>
              <p className="text-xs text-muted-foreground">开启后，新建提醒和自动生成提醒时会推送到钉钉</p>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={v => update({ enabled: v })} />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                Webhook 地址
              </label>
              <Input
                value={settings.webhookUrl}
                onChange={e => update({ webhookUrl: e.target.value })}
                placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx"
              />
              <p className="text-xs text-muted-foreground mt-1">
                在钉钉群 → 群设置 → 智能群助手 → 添加机器人 → 自定义机器人 中获取
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                加签密钥（Secret）
              </label>
              <Input
                type="password"
                value={settings.secret}
                onChange={e => update({ secret: e.target.value })}
                placeholder="SECxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-muted-foreground mt-1">
                如果机器人安全设置选择了"加签"，请填写此项；选择"关键词"或"IP白名单"可留空
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">消息格式</label>
              <Select value={settings.msgtype} onChange={e => update({ msgtype: e.target.value as any })}>
                <option value="markdown">Markdown（支持标题、换行）</option>
                <option value="text">纯文本</option>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testLoading || !settings.enabled || !settings.webhookUrl}
            >
              <Send className="w-4 h-4 mr-2" />
              {testLoading ? '发送中...' : '发送测试消息'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
