import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  ListTodo,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Task, WeeklyReport } from '@/lib/types';
import { formatDateCN } from '@/lib/dateUtils';
import { generateWeeklyReportText } from '@/lib/aiEngine';
import { getReports, setReports } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface WeeklyReportPageProps {
  tasks: Task[];
}

export default function WeeklyReportPage({ tasks }: WeeklyReportPageProps) {
  const [reports, setLocalReports] = React.useState<WeeklyReport[]>(getReports());
  const [selectedReport, setSelectedReport] = React.useState<WeeklyReport | null>(null);

  const handleGenerate = () => {
    const report = generateWeeklyReportText(tasks);
    const newReports = [report, ...reports];
    setLocalReports(newReports);
    setReports(newReports);
    setSelectedReport(report);
  };

  const handleExport = (report: WeeklyReport) => {
    const text = buildExportText(report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `周报_${report.weekStart}_${report.weekEnd}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildExportText = (report: WeeklyReport): string => {
    const lines: string[] = [];
    lines.push(`=== 工作周报 ===`);
    lines.push(`周期: ${report.weekStart} ~ ${report.weekEnd}`);
    lines.push(`\n${report.summary}`);
    lines.push(`\n【本周完成】`);
    report.highlights.forEach(h => lines.push(`  - ${h}`));
    lines.push(`\n【进行中任务】`);
    report.inProgressTasks.forEach(t => lines.push(`  - ${t.title} (${t.category}) - 截止: ${t.dueDate}`));
    lines.push(`\n【待办任务】`);
    report.todoTasks.slice(0, 5).forEach(t => lines.push(`  - ${t.title} (${t.category}) - 截止: ${t.dueDate}`));
    if (report.challenges.length > 0) {
      lines.push(`\n【本周挑战】`);
      report.challenges.forEach(c => lines.push(`  - ${c}`));
    }
    lines.push(`\n【下周计划】`);
    report.nextWeekPlan.forEach(p => lines.push(`  - ${p}`));
    lines.push(`\n【AI 智能洞察】`);
    lines.push(report.aiInsight);
    return lines.join('\n');
  };

  const displayReport = selectedReport || reports[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">周报中心</h1>
          <p className="text-muted-foreground text-sm mt-1">
            自动汇总每周工作，生成专业周报
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="gradient" onClick={handleGenerate}>
            <RefreshCw className="w-4 h-4 mr-2" /> 生成本周周报
          </Button>
          {displayReport && (
            <Button variant="outline" onClick={() => handleExport(displayReport)}>
              <Download className="w-4 h-4 mr-2" /> 导出周报
            </Button>
          )}
        </div>
      </div>

      {displayReport ? (
        <div className="grid grid-cols-3 gap-6">
          {/* Report Content */}
          <div className="col-span-2 space-y-4">
            {/* Summary Card */}
            <Card className="shadow-glow border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle>周报概览</CardTitle>
                </div>
                <CardDescription>
                  {displayReport.weekStart} ~ {displayReport.weekEnd}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{displayReport.summary}</p>
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <CardTitle className="text-success">本周完成</CardTitle>
                  <Badge variant="success">{displayReport.completedTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayReport.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md hover:bg-success/5 transition-smooth">
                      <ArrowRight className="w-3 h-3 text-success mt-1 shrink-0" />
                      <p className="text-sm">{h}</p>
                    </div>
                  ))}
                  {displayReport.completedTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">本周暂无完成任务</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <CardTitle className="text-accent">进行中</CardTitle>
                  <Badge variant="accent">{displayReport.inProgressTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayReport.inProgressTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/5 transition-smooth">
                      <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                      <p className="text-sm flex-1">{task.title}</p>
                      <Badge variant="outline">{task.category}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateCN(task.dueDate)}</span>
                    </div>
                  ))}
                  {displayReport.inProgressTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">暂无进行中任务</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Challenges */}
            {displayReport.challenges.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <CardTitle className="text-warning">本周挑战</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {displayReport.challenges.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-warning/5">
                        <AlertTriangle className="w-3 h-3 text-warning mt-1 shrink-0" />
                        <p className="text-sm">{c}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Week Plan */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-primary" />
                  <CardTitle>下周计划</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayReport.nextWeekPlan.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-smooth">
                      <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                      <p className="text-sm">{p}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Insight */}
            <Card className="border-accent/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <CardTitle className="text-accent">AI 智能洞察</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {displayReport.aiInsight.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>数据统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: '完成任务', value: displayReport.completedTasks.length, color: 'text-success' },
                    { label: '进行中', value: displayReport.inProgressTasks.length, color: 'text-accent' },
                    { label: '待办', value: displayReport.todoTasks.length, color: 'text-muted-foreground' },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className={cn("text-lg font-bold", stat.color)}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Previous Reports */}
            {reports.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>历史周报</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reports.slice(0, 5).map(r => (
                      <button
                        key={r.id}
                        className={cn(
                          "w-full text-left p-2 rounded-md text-sm transition-smooth",
                          selectedReport?.id === r.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-muted-foreground"
                        )}
                        onClick={() => setSelectedReport(r)}
                      >
                        <p>{r.weekStart} ~ {r.weekEnd}</p>
                        <p className="text-xs mt-0.5">{r.completedTasks.length}项完成</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">尚未生成周报</p>
          <p className="text-sm mt-2">点击"生成本周周报"按钮，AI将自动汇总本周工作</p>
          <Button variant="gradient" className="mt-6" onClick={handleGenerate}>
            <Sparkles className="w-4 h-4 mr-2" /> 生成周报
          </Button>
        </div>
      )}
    </div>
  );
}