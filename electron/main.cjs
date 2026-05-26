const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron')
const path = require('path')
const https = require('https')
const http = require('http')
const crypto = require('crypto')
const isDev = process.env.NODE_ENV === 'development'

// __dirname 是 electron/ 目录，项目根目录需要上一级
const ROOT_DIR = path.join(__dirname, '..')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '智规划 - 工作规划助手',
    icon: path.join(ROOT_DIR, 'public/icons/icon-256x256.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
    backgroundColor: '#f8fafc',
  })

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(ROOT_DIR, 'dist/index.html'))
  }

  // 窗口准备好后显示，避免白屏闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 外部链接在系统浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 主进程发送钉钉消息（绕过 CORS）
ipcMain.handle('send-dingtalk', async (event, { webhookUrl, secret, message }) => {
  return new Promise((resolve) => {
    try {
      let finalUrl = webhookUrl
      let body = JSON.stringify({
        msgtype: 'markdown',
        markdown: {
          title: '智规划提醒',
          text: message,
        },
      })

      // 加签
      if (secret && secret.trim()) {
        const timestamp = Date.now()
        const str = `${timestamp}\n${secret}`
        const sign = crypto.createHmac('sha256', secret).update(str).digest('base64')
        const encodedSign = encodeURIComponent(sign)
        finalUrl = `${webhookUrl}&timestamp=${timestamp}&sign=${encodedSign}`
      }

      const urlObj = new URL(finalUrl)
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }

      const lib = urlObj.protocol === 'https:' ? https : http
      const req = lib.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          try {
            const result = JSON.parse(data)
            if (result.errcode === 0) {
              resolve({ success: true })
            } else {
              resolve({ success: false, error: result.errmsg || '钉钉返回错误: ' + result.errcode })
            }
          } catch {
            resolve({ success: false, error: '解析响应失败: ' + data })
          }
        })
      })

      req.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      req.write(body)
      req.end()
    } catch (err) {
      resolve({ success: false, error: err.message })
    }
  })
})

// 自定义菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'Ctrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'Ctrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '放大', accelerator: 'Ctrl+=', role: 'zoomIn' },
        { label: '缩小', accelerator: 'Ctrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'Ctrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于智规划',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于智规划',
              message: '智规划 - 工作规划助手',
              detail: `版本: 1.0.0\n\n智能工作规划与提醒助手\n支持钉钉消息推送`,
              buttons: ['确定'],
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()
  createMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
