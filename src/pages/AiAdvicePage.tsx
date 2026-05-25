import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Brain,
  Sparkles,
  Send,
  Lightbulb,
  Target,
  BarChart3,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Task, AiAdvice, DEFAULT_CATEGORIES } from '@/lib/types';
import { CurrentUser } from '@/lib/userAuth';
import { generateCategoryAdvice, generateAiInsight } from '@/lib/aiEngine';
import { getAdvice, setAdvice } from '@/lib/storage';
import { generateId } from '@/lib/storage';

interface AiAdvicePageProps {
  tasks: Task[];
  currentUser: CurrentUser;
}

export default function AiAdvicePage({ tasks, currentUser }: AiAdvicePageProps) {
  const [adviceHistory, setAdviceHistory] = React.useState<AiAdvice[]>(getAdvice());
  const [selectedCategory, setSelectedCategory] = React.useState(DEFAULT_CATEGORIES[0]);
  const [customQuestion, setCustomQuestion] = React.useState('');
  const [activeAdvice, setActiveAdvice] = React.useState<string | null>(null);
  const [currentInsight, setCurrentInsight] = React.useState(generateAiInsight(tasks));

  const handleGetAdvice = () => {
    const advice = generateCategoryAdvice(selectedCategory);
    const newAdvice: AiAdvice = {
      id: generateId(),
      userId: currentUser.id,
      category: selectedCategory,
      question: customQuestion || `${selectedCategory}领域专业建议`,
      advice,
      createdAt: new Date().toISOString(),
    };
    const newHistory = [newAdvice, ...adviceHistory];
    setAdviceHistory(newHistory);
    setAdvice(newHistory);
    setActiveAdvice(newAdvice.id);
    setCustomQuestion('');
  };

  const handleRefreshInsight = () => {
    setCurrentInsight(generateAiInsight(tasks));
  };

  const quickAdviceItems = [
    { icon: <Target className="w-5 h-5" />, label: '目标优化', desc: '如何更高效地设定和达成工作目标', category: '清关管理' },
    { icon: <BarChart3 className="w-5 h-5" />, label: '效率提升', desc: '减少重复工作，提高流程效率', category: '账务结算' },
    { icon: <BookOpen className="w-5 h-5" />, label: '合规要点', desc: '确保业务合规的关键注意事项', category: '合规认证' },
    { icon: <Lightbulb className="w-5 h-5" />, label: '沟通策略', desc: '优化客户和跨部门沟通效果', category: '客户沟通' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 专业建议</h1>
          <p className="text-muted-foreground text-sm mt-1">
            基于你的工作内容，获取专业意见和优化建议
          </p>
        </div>
        <Button variant="outline" onClick={handleRefreshInsight}>
          <Sparkles className="w-4 h-4 mr-2" /> 刷新洞察
        </Button>
      </div>

      {/* AI Insight Banner */}
      <Card className="gradient-primary text-primary-foreground shadow-glow border-none">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">AI 工作洞察</h3>
              <div className="text-sm leading-relaxed opacity-90">
                {currentInsight.split('\n').map((line, i) => (
                  <p key={i} className="mb-1.5">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Advice Cards */}
      <div className="grid grid-cols-4 gap-4">
        {quickAdviceItems.map(item => (
          <Card
            key={item.label}
            className="cursor-pointer hover:shadow-glow transition-smooth group"
            onClick={() => {
              setSelectedCategory(item.category);
              setCustomQuestion(item.desc);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-primary group-hover:text-accent transition-smooth">{item.icon}</div>
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              <Badge variant="outline" className="mt-2 text-xs">{item.category}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ask AI Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <CardTitle>获取专业建议</CardTitle>
          </div>
          <CardDescription>选择领域并提问，AI将为你生成针对性建议</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">领域分类</label>
              <Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">你的问题或需求描述</label>
              <div className="flex gap-2">
                <Input
                  value={customQuestion}
                  onChange={e => setCustomQuestion(e.target.value)}
                  placeholder="描述你想了解或优化的工作场景..."
                  className="flex-1"
                />
                <Button variant="accent" onClick={handleGetAdvice}>
                  <Send className="w-4 h-4 mr-1" /> 获取建议
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Advice Display */}
      {activeAdvice && (
        <Card className="shadow-glow border-accent/20 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <CardTitle>专业建议</CardTitle>
              <Badge variant="accent">{adviceHistory.find(a => a.id === activeAdvice)?.category}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">问题场景</p>
                <p className="text-sm mt-1">{adviceHistory.find(a => a.id === activeAdvice)?.question}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                <p className="text-sm leading-relaxed font-medium">
                  {adviceHistory.find(a => a.id === activeAdvice)?.advice}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advice History */}
      {adviceHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>建议历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adviceHistory.slice(0, 10).map(advice => (
                <div
                  key={advice.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer group"
                  onClick={() => setActiveAdvice(advice.id)}
                >
                  <ArrowRight className="w-4 h-4 text-accent mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-smooth" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{advice.question}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{advice.advice}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">{advice.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}