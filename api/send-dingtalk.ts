import crypto from 'crypto';

function sign(secret: string, timestamp: string): string {
  const str = `${timestamp}\n${secret}`;
  return crypto.createHmac('sha256', secret).update(str).digest('base64');
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { webhookUrl, secret, title, message, msgtype = 'markdown' } = req.body || {};

  if (!webhookUrl) {
    return res.status(400).json({ error: '缺少 webhookUrl' });
  }

  if (!title && !message) {
    return res.status(400).json({ error: '缺少 title 或 message' });
  }

  try {
    let url = webhookUrl;
    if (secret) {
      const timestamp = Date.now().toString();
      const signature = sign(secret, timestamp);
      const sep = webhookUrl.includes('?') ? '&' : '?';
      url = `${webhookUrl}${sep}timestamp=${timestamp}&sign=${encodeURIComponent(signature)}`;
    }

    const payload: any = {
      msgtype,
    };

    if (msgtype === 'markdown') {
      payload.markdown = {
        title: title || '智规划提醒',
        text: `### ${title || '智规划提醒'}\n${message || ''}`,
      };
    } else {
      payload.text = {
        content: `${title || '智规划提醒'}\n${message || ''}`,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.errcode !== 0) {
      return res.status(502).json({ error: '钉钉接口调用失败', detail: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
}
