import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Newspaper,
  RefreshCw,
  Download,
  MessageSquare,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings,
  Link2,
  Bell,
} from 'lucide-react';
import { Task } from '@/lib/types';
import { DailyReport } from '@/lib/dailyReportEngine';
import { generateDailyReport } from '@/lib/dailyReportEngine';
import { DingTalkConfig, getDingTalkConfig, setDingTalkConfig, fetchDingTalkData, getDingTalkMessages, setDingTalkMessages, getDingTalkTasks, setDingTalkTasks, getDingTalkApprovals, setDingTalkApprovals } from '@/lib/dingtalkApi';
import { EmailConfig, getEmailConfig, setEmailConfig, fetchEmailData, getEmailMessages, setEmailMessages } from '@/lib/emailApi';
import { exportDailyReportToXlsx } from '@/lib/exportUtils';
import { cn } from '@/lib/utils';

interface DailyReportPageProps {
  tasks: Task[];
}

export default function DailyReportPage({ tasks }: DailyReportPageProps) {
  const [report, setReport] = React.useState<DailyReport | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [showDingTalkConfig, setShowDingTalkConfig] = React.useState(false);
  const [showEmailConfig, setShowEmailConfig] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<string | null>('all');

  // Config states
  const [dingTalkConfig, setLocalDingTalkConfig] = React.useState<DingTalkConfig>(getDingTalkConfig());
  const [emailConfigState, setLocalEmailConfig] = React.useState<EmailConfig>(getEmailConfig());
  const [dtConfigForm, setDtConfigForm] = React.useState(dingTalkConfig);
  const [emailConfigForm, setEmailConfigForm] = React.useState(emailConfigState);

  const handleFetchAndGenerate = async () => {
    setIsFetching(true);
    try {
      // 拉取钉钉数据
      const dtData = await fetchDingTalkData(dingTalkConfig);
      setDingTalkMessages(dtData.messages);
      setDingTalkTasks(dtData.tasks);
      setDingTalkApprovals(dtData.approvals);

      // 拉取邮箱数据
      const emailData = await fetchEmailData(emailConfigState);
      setEmailMessages(emailData);

      // 生成日报
      const newReport = generateDailyReport(
        tasks,
        dtData.messages,
        dtData.tasks,
        dtData.approvals,
        emailData,
      );
      setReport(newReport);
    } catch {
      // 即使出错也用已有数据生成
      const newReport = generateDailyReport(
        tasks,
        getDingTalkMessages(),
        getDingTalkTasks(),
        getDingTalkApprovals(),
        getEmailMessages(),
      );
      setReport(newReport);
    }
    setIsFetching(false);
  };

  const handleSaveDingTalkConfig = () => {
    setLocalDingTalkConfig(dtConfigForm);
    setDingTalkConfig(dtConfigForm);
    setShowDingTalkConfig(false);
  };

  const handleSaveEmailConfig = () => {
    setLocalEmailConfig(emailConfigForm);
    setEmailConfig(emailConfigForm);
    setShowEmailConfig(false);
  };

  const handleExport = () => {
    if (report) {
      exportDailyReportToXlsx(report);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">日报中心</h1>
          <p className="text-muted-foreground text-sm mt-1">
            从钉钉和邮箱拉取数据，自动生成每日工作日报
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="gradient" onClick={handleFetchAndGenerate} disabled={isFetching}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
            {isFetching ? '拉取中...' : '拉取数据并生成日报'}
          </Button>
          {report && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> 导出 Excel
            </Button>
          )}
        </div>
      </div>

      {/* Data Source Status */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">钉钉</p>
                  <p className="text-xs text-muted-foreground">
                    {dingTalkConfig.isConnected ? '已连接' : '未连接 - 使用模拟数据'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDingTalkConfig(!showDingTalkConfig)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            {showDingTalkConfig && (
              <div className="mt-4 space-y-3 pt-3 border-t">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">App Key</label>
                  <Input
                    value={dtConfigForm.appKey}
                    onChange={e => setDtConfigForm({ ...dtConfigForm, appKey: e.target.value })}
                    placeholder="钉钉应用 AppKey"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">App Secret</label>
                  <Input
                    type="password"
                    value={dtConfigForm.appSecret}
                    onChange={e => setDtConfigForm({ ...dtConfigForm, appSecret: e.target.value })}
                    placeholder="钉钉应用 AppSecret"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Corp ID</label>
                  <Input
                    value={dtConfigForm.corpId}
                    onChange={e => setDtConfigForm({ ...dtConfigForm, corpId: e.target.value })}
                    placeholder="企业 CorpId"
                    className="mt-1"
                  />
                </div>
                <Button size="sm" onClick={handleSaveDingTalkConfig}>保存配置</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">STARMERX 邮箱</p>
                  <p className="text-xs text-muted-foreground">
                    {emailConfigState.isConnected ? '已连接' : '未连接 - 使用模拟数据'}
                    {emailConfigState.email && ` · ${emailConfigState.email}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowEmailConfig(!showEmailConfig)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            {showEmailConfig && (
              <div className="mt-4 space-y-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  使用 Microsoft Graph API 接入 Office 365 邮箱
                  <a href="https://docs.microsoft.com/zh-cn/graph/auth-register-app-v2" target="_blank" rel="noopener noreferrer" className="text-accent underline ml-1">查看注册指南</a>
                </p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">邮箱地址</label>
                  <Input
                    value={emailConfigForm.email}
                    onChange={e => setEmailConfigForm({ ...emailConfigForm, email: e.target.value })}
                    placeholder="fangpu@starmex.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">租户 ID (Tenant ID)</label>
                  <Input
                    value={emailConfigForm.tenantId}
                    onChange={e => setEmailConfigForm({ ...emailConfigForm, tenantId: e.target.value })}
                    placeholder="在 Azure Portal → 概述 中查看"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">客户端 ID (Client ID)</label>
                  <Input
                    value={emailConfigForm.clientId}
                    onChange={e => setEmailConfigForm({ ...emailConfigForm, clientId: e.target.value })}
                    placeholder="在 Azure Portal → 应用注册 → 概述 中查看"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">客户端密码 (Client Secret)</label>
                  <Input
                    type="password"
                    value={emailConfigForm.clientSecret}
                    onChange={e => setEmailConfigForm({ ...emailConfigForm, clientSecret: e.target.value })}
                    placeholder="在 Azure Portal → 证书和密码 中创建"
                    className="mt-1"
                  />
                </div>
                <Button size="sm" onClick={handleSaveEmailConfig}>保存配置</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      {report ? (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="shadow-glow border-primary/10">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold">日报摘要</h2>
                    <Badge variant="outline">{report.date}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notices */}
          {report.importantNotices.length > 0 && (
            <Card className="border-warning/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('notices')}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <CardTitle className="text-warning text-base">重要通知</CardTitle>
                    <Badge variant="warning">{report.importantNotices.length}</Badge>
                  </div>
                  {expandedSection === 'notices' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
              {expandedSection === 'notices' && (
                <CardContent>
                  <div className="space-y-2">
                    {report.importantNotices.map((notice, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-warning/5">
                        <Bell className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                        <p className="text-sm">{notice}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Key Communications */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('communications')}>
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">关键沟通</CardTitle>
                  <Badge variant="outline">{report.keyCommunications.length}</Badge>
                </div>
                {expandedSection === 'communications' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
            {expandedSection === 'communications' && (
              <CardContent>
                <div className="space-y-3">
                  {report.keyCommunications.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        item.source === '钉钉' ? "bg-primary/10" : "bg-accent/10"
                      )}>
                        {item.source === '钉钉' ?
                          <MessageSquare className="w-4 h-4 text-primary" /> :
                          <Mail className="w-4 h-4 text-accent" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.from}</span>
                          <Badge variant={item.source === '钉钉' ? 'default' : 'accent'} className="text-xs">{item.source}</Badge>
                          {item.priority === 'high' && <Badge variant="destructive" className="text-xs">紧急</Badge>}
                          <span className="text-xs text-muted-foreground ml-auto">{item.time}</span>
                        </div>
                        <p className="text-sm mt-1">{item.subject}</p>
                        {item.summary !== item.subject && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Pending Actions */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('actions')}>
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-accent" />
                  <CardTitle className="text-base">待办事项</CardTitle>
                  <Badge variant="accent">{report.pendingActions.length}</Badge>
                </div>
                {expandedSection === 'actions' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
            {expandedSection === 'actions' && (
              <CardContent>
                <div className="space-y-2">
                  {report.pendingActions.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2 shrink-0",
                        item.priority === 'urgent' ? "bg-destructive" : item.priority === 'high' ? "bg-warning" : "bg-accent"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.title}</span>
                          <Badge variant={item.source === '钉钉' ? 'default' : item.source === '邮箱' ? 'accent' : 'outline'} className="text-xs">
                            {item.source}
                          </Badge>
                          {item.priority === 'urgent' && <Badge variant="destructive" className="text-xs">紧急</Badge>}
                          {item.priority === 'high' && <Badge variant="warning" className="text-xs">高</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        {item.dueDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">截止: {item.dueDate}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Completed Items */}
          {report.completedItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('completed')}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <CardTitle className="text-success text-base">已完成</CardTitle>
                    <Badge variant="success">{report.completedItems.length}</Badge>
                  </div>
                  {expandedSection === 'completed' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
              {expandedSection === 'completed' && (
                <CardContent>
                  <div className="space-y-1">
                    {report.completedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* AI Insight */}
          <Card className="border-accent/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-accent mb-2">AI 智能洞察</h3>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {report.aiInsight.split('\n').map((line, i) => (
                      <p key={i} className="mb-1.5">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">尚未生成今日日报</p>
          <p className="text-sm mt-2">点击"拉取数据并生成日报"，系统将从钉钉和邮箱获取今日数据并自动汇总</p>
          <Button variant="gradient" className="mt-6" onClick={handleFetchAndGenerate} disabled={isFetching}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
            {isFetching ? '拉取中...' : '生成今日日报'}
          </Button>
        </div>
      )}
    </div>
  );
}