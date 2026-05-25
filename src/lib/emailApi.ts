// STARMERX 邮箱 API 数据源配置与拉取模块
// 使用 Microsoft Graph API (Office 365 / Exchange Online)
// 文档: https://docs.microsoft.com/zh-cn/graph/api/resources/mail-api-overview

export interface EmailConfig {
  email: string;
  // Microsoft Graph API 配置
  tenantId: string;
  clientId: string;
  clientSecret: string;
  // 状态
  isConnected: boolean;
  accessToken?: string;
  tokenExpiresAt?: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  hasAttachment: boolean;
  priority: 'normal' | 'high' | 'low';
}

const DEFAULT_CONFIG: EmailConfig = {
  email: 'fangpu@starmex.com',
  tenantId: '',
  clientId: '',
  clientSecret: '',
  isConnected: false,
};

const STORAGE_KEY_EMAIL_CONFIG = 'wf_email_config';
const STORAGE_KEY_EMAIL_MESSAGES = 'wf_email_messages';

export function getEmailConfig(): EmailConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY_EMAIL_CONFIG);
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setEmailConfig(config: EmailConfig): void {
  localStorage.setItem(STORAGE_KEY_EMAIL_CONFIG, JSON.stringify(config));
}

export function getEmailMessages(): EmailMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_EMAIL_MESSAGES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setEmailMessages(messages: EmailMessage[]): void {
  localStorage.setItem(STORAGE_KEY_EMAIL_MESSAGES, JSON.stringify(messages));
}

/**
 * 获取 Microsoft Graph access_token
 * 使用客户端凭据流 (Client Credentials Flow)
 * 需要在 Azure AD 中注册应用并授予 Mail.Read 权限
 */
async function getGraphAccessToken(config: EmailConfig): Promise<string | null> {
  if (!config.tenantId || !config.clientId || !config.clientSecret) {
    return null;
  }

  // 检查现有 token 是否过期
  if (config.accessToken && config.tokenExpiresAt) {
    const expiresAt = new Date(config.tokenExpiresAt);
    if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return config.accessToken;
    }
  }

  try {
    const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', config.clientId);
    params.append('client_secret', config.clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Graph API token error:', errorData);
      return null;
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in;

    // 更新存储的 token
    const updatedConfig = {
      ...config,
      accessToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      isConnected: true,
    };
    setEmailConfig(updatedConfig);

    return accessToken;
  } catch (err) {
    console.error('Failed to get Graph access token:', err);
    return null;
  }
}

/**
 * 从 Microsoft Graph API 拉取邮件
 * 文档: https://docs.microsoft.com/zh-cn/graph/api/user-list-messages
 */
export async function fetchEmailData(config: EmailConfig): Promise<EmailMessage[]> {
  const accessToken = await getGraphAccessToken(config);

  if (!accessToken) {
    // 未配置或认证失败，返回模拟数据
    return generateMockEmailData();
  }

  try {
    // 拉取今日邮件
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filter = `$filter=receivedDateTime ge ${today.toISOString()}`;

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?${filter}&$top=50&$select=id,subject,bodyPreview,from,toRecipients,receivedDateTime,isRead,hasAttachments,importance`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Graph API fetch error:', await response.text());
      return generateMockEmailData();
    }

    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: EmailMessage[] = data.value.map((msg: any) => ({
      id: msg.id || '',
      from: msg.from?.emailAddress?.address || '',
      fromName: msg.from?.emailAddress?.name || '',
      to: msg.toRecipients?.[0]?.emailAddress?.address || '',
      subject: msg.subject || '',
      body: msg.bodyPreview || '',
      date: msg.receivedDateTime || '',
      isRead: msg.isRead || false,
      hasAttachment: msg.hasAttachments || false,
      priority: msg.importance === 'high' ? 'high' : msg.importance === 'low' ? 'low' : 'normal',
    }));

    return messages;
  } catch (err) {
    console.error('Failed to fetch emails from Graph API:', err);
    return generateMockEmailData();
  }
}

function generateMockEmailData(): EmailMessage[] {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'email-1',
      from: 'customs@partner.com',
      fromName: '海关合作方',
      to: 'fangpu@starmex.com',
      subject: '关于ABCD公司进口货物清关进度的通知',
      body: '韩经理，您好！ABCD公司进口货物的清关文件已审核通过，预计明天可完成放行。请知悉。',
      date: `${today}T09:30:00`,
      isRead: false,
      hasAttachment: true,
      priority: 'high',
    },
    {
      id: 'email-2',
      from: 'finance@starmex.com',
      fromName: '财务部-内部',
      to: 'fangpu@starmex.com',
      subject: '5月供应商结算账单差异确认',
      body: '韩方浦，5月账单核对发现2笔差异：1) ABC供应商运费差额￥350；2) DEF供应商关税预估与实际差￥1,200。请确认处理方案。',
      date: `${today}T10:15:00`,
      isRead: false,
      hasAttachment: true,
      priority: 'high',
    },
    {
      id: 'email-3',
      from: 'logistics@starmex.com',
      fromName: '物流部-内部',
      to: 'fangpu@starmex.com',
      subject: 'XYZ公司货物到港通知',
      body: '韩经理，XYZ公司货物已于今日抵达汉堡港，正在安排当地清关和提货事宜，预计2-3天内完成。',
      date: `${today}T11:00:00`,
      isRead: true,
      hasAttachment: false,
      priority: 'normal',
    },
    {
      id: 'email-4',
      from: 'compliance@cert.org',
      fromName: '认证机构',
      to: 'fangpu@starmex.com',
      subject: 'ISO合规认证年检审核结果通知',
      body: '尊敬的韩方浦先生，贵司ISO合规认证年检材料已收到，初步审核通过，最终结果将于5个工作日内通知。',
      date: `${today}T14:20:00`,
      isRead: true,
      hasAttachment: true,
      priority: 'normal',
    },
    {
      id: 'email-5',
      from: 'client@xyzcorp.com',
      fromName: 'XYZ公司-客户',
      to: 'fangpu@starmex.com',
      subject: '关于货物延误的沟通',
      body: '韩经理，了解到近期货物有些延误，能否提供最新的物流进度？我们这边客户也在催，请尽快回复，谢谢合作。',
      date: `${today}T15:45:00`,
      isRead: false,
      hasAttachment: false,
      priority: 'high',
    },
  ];
}
