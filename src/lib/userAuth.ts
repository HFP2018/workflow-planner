export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
  email?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

const STORAGE_KEY_USERS = 'wf_users';
const STORAGE_KEY_CURRENT_USER = 'wf_current_user';

// 获取用户列表
export function getUsers(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_USERS);
    if (data) return JSON.parse(data);
    // 首次使用，创建默认管理员账号
    const defaultAdmin: User = {
      id: 'admin-1',
      username: 'admin',
      displayName: '管理员',
      password: 'admin123',
      role: 'admin',
      email: 'admin@starmex.com',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
  } catch {
    return [];
  }
}

export function setUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

// 获取当前登录用户
export function getCurrentUser(): CurrentUser | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: CurrentUser | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }
}

// 登录
export function login(username: string, password: string): CurrentUser | null {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password && u.isActive);
  if (!user) return null;

  const current: CurrentUser = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
  setCurrentUser(current);
  return current;
}

// 退出登录
export function logout(): void {
  setCurrentUser(null);
}

// 创建子账号（仅管理员）
export function createSubAccount(
  adminUser: CurrentUser,
  username: string,
  displayName: string,
  password: string,
  email?: string,
): User | null {
  if (adminUser.role !== 'admin') return null;

  const users = getUsers();
  if (users.some(u => u.username === username)) return null;

  const newUser: User = {
    id: `user-${Date.now()}`,
    username,
    displayName,
    password,
    role: 'user',
    email,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: adminUser.id,
  };
  users.push(newUser);
  setUsers(users);
  return newUser;
}

// 更新子账号
export function updateUser(
  adminUser: CurrentUser,
  userId: string,
  updates: Partial<Pick<User, 'displayName' | 'password' | 'isActive' | 'email'>>,
): boolean {
  if (adminUser.role !== 'admin') return false;

  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;

  users[idx] = { ...users[idx], ...updates };
  setUsers(users);
  return true;
}

// 删除子账号（标记为非活跃）
export function deactivateUser(adminUser: CurrentUser, userId: string): boolean {
  if (adminUser.role !== 'admin') return false;
  if (userId === adminUser.id) return false; // 不能删除自己

  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;

  users[idx].isActive = false;
  setUsers(users);
  return true;
}

// 生成ID
export function generateUserId(): string {
  return `user-${Date.now().toString(36)}`;
}
