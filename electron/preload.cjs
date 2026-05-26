const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  sendDingTalk: (payload) => ipcRenderer.invoke('send-dingtalk', payload),
  isElectron: true,
})
