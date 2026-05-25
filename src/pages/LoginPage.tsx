import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { login, CurrentUser } from '@/lib/userAuth';

interface LoginPageProps {
  onLogin: (user: CurrentUser) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('用户名或密码错误，或账号已被禁用');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-xl font-bold text-white">
            Z
          </div>
          <div>
            <h1 className="text-2xl font-bold">智规划</h1>
            <p className="text-xs text-muted-foreground">工作规划助手</p>
          </div>
        </div>

        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="text-center text-lg">用户登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">用户名</label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">密码</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="mt-4 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">默认账号</p>
              <p>用户名: admin</p>
              <p>密码: admin123</p>
              <p className="mt-1 text-warning">请登录后立即修改默认密码</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
