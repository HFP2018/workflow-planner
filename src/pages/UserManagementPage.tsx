import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Plus,
  Edit3,
  CheckCircle2,
  XCircle,
  UserCheck,
  Mail,
} from 'lucide-react';
import { User, CurrentUser } from '@/lib/userAuth';
import { getUsers, createSubAccount, updateUser, deactivateUser } from '@/lib/userAuth';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface UserManagementPageProps {
  currentUser: CurrentUser;
}

export default function UserManagementPage({ currentUser }: UserManagementPageProps) {
  const { showToast } = useToast();
  const [users, setLocalUsers] = React.useState<User[]>(getUsers());
  const [showForm, setShowForm] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);

  const [formUsername, setFormUsername] = React.useState('');
  const [formDisplayName, setFormDisplayName] = React.useState('');
  const [formPassword, setFormPassword] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');

  const refreshUsers = () => {
    setLocalUsers(getUsers());
  };

  const resetForm = () => {
    setFormUsername('');
    setFormDisplayName('');
    setFormPassword('');
    setFormEmail('');
    setEditingUser(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!formUsername.trim() || !formDisplayName.trim() || !formPassword.trim()) {
      showToast({ message: '请填写完整信息', type: 'error' });
      return;
    }
    const result = createSubAccount(currentUser, formUsername, formDisplayName, formPassword, formEmail || undefined);
    if (result) {
      showToast({ message: `子账号 ${formDisplayName} 创建成功`, type: 'success' });
      refreshUsers();
      resetForm();
    } else {
      showToast({ message: '创建失败，用户名可能已存在', type: 'error' });
    }
  };

  const handleUpdate = () => {
    if (!editingUser) return;
    const updates: Partial<Pick<User, 'displayName' | 'password' | 'email'>> = {};
    if (formDisplayName.trim()) updates.displayName = formDisplayName;
    if (formPassword.trim()) updates.password = formPassword;
    if (formEmail.trim()) updates.email = formEmail;

    const success = updateUser(currentUser, editingUser.id, updates);
    if (success) {
      showToast({ message: '账号信息更新成功', type: 'success' });
      refreshUsers();
      resetForm();
    } else {
      showToast({ message: '更新失败', type: 'error' });
    }
  };

  const handleToggleStatus = (user: User) => {
    if (user.id === currentUser.id) {
      showToast({ message: '不能禁用自己', type: 'error' });
      return;
    }
    if (user.isActive) {
      const success = deactivateUser(currentUser, user.id);
      if (success) {
        showToast({ message: `账号 ${user.displayName} 已禁用`, type: 'warning' });
      }
    } else {
      const success = updateUser(currentUser, user.id, { isActive: true });
      if (success) {
        showToast({ message: `账号 ${user.displayName} 已启用`, type: 'success' });
      }
    }
    refreshUsers();
  };

  const startEdit = (user: User) => {
    setFormUsername(user.username);
    setFormDisplayName(user.displayName);
    setFormPassword('');
    setFormEmail(user.email || '');
    setEditingUser(user);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">子账号管理</h1>
          <p className="text-muted-foreground text-sm mt-1">创建和管理团队成员的账号</p>
        </div>
        <Button variant="gradient" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> 创建子账号
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="shadow-glow border-primary/20 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle>{editingUser ? '编辑账号' : '创建子账号'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">用户名 {!editingUser && '*'}</label>
                <Input
                  value={formUsername}
                  onChange={e => setFormUsername(e.target.value)}
                  placeholder="登录用户名"
                  disabled={!!editingUser}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">显示名称 *</label>
                <Input
                  value={formDisplayName}
                  onChange={e => setFormDisplayName(e.target.value)}
                  placeholder="如：张三"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">密码 {editingUser ? '(留空不修改)' : '*'}</label>
                <Input
                  type="password"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder={editingUser ? '留空表示不修改' : '设置密码'}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">邮箱</label>
                <Input
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="可选"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="gradient" onClick={editingUser ? handleUpdate : handleCreate}>
                {editingUser ? '保存修改' : '创建账号'}
              </Button>
              <Button variant="outline" onClick={resetForm}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>账号列表</CardTitle>
            <Badge variant="outline">{users.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map(user => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg transition-smooth",
                  user.isActive ? "hover:bg-muted/50" : "opacity-50 bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  user.role === 'admin' ? "gradient-primary text-white" : "bg-accent/10 text-accent"
                )}>
                  {user.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{user.displayName}</span>
                    <Badge variant={user.role === 'admin' ? 'default' : 'accent'}>
                      {user.role === 'admin' ? '管理员' : '子账号'}
                    </Badge>
                    {user.isActive ? (
                      <Badge variant="success" className="text-xs">正常</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">已禁用</Badge>
                    )}
                    {user.id === currentUser.id && (
                      <Badge variant="outline" className="text-xs">当前账号</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> {user.username}
                    </span>
                    {user.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {user.email}
                      </span>
                    )}
                    <span>创建于 {user.createdAt.split('T')[0]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {user.id !== currentUser.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleStatus(user)}
                      title={user.isActive ? '禁用账号' : '启用账号'}
                    >
                      {user.isActive ? (
                        <XCircle className="w-4 h-4 text-destructive" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => startEdit(user)}
                    title="编辑"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
