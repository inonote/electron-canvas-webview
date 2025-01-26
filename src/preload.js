const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("_owv", {
  $_create: (width, height) => ipcRenderer.invoke("owvCreate", width, height),
  $_destroy: (handle) => ipcRenderer.invoke("owvDestroy", handle),
  $_navigate: (handle, url, isLocal) => ipcRenderer.invoke("owvNavigate", handle, url, isLocal),
  $_sendMouseEvent: (handle, type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY) => ipcRenderer.invoke("owvSendMouseEvent", handle, type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY),
  $_sendKbdEvent: (handle, type, keyCode, modifiers) => ipcRenderer.invoke("owvSendKbdEvent", handle, type, keyCode, modifiers),
  $_setFocus: (handle, flag) => ipcRenderer.invoke("owvSetFocus", handle, flag),
  $_getUrl: (handle) => ipcRenderer.invoke("owvGetUrl", handle),
  $_getTitle: (handle) => ipcRenderer.invoke("owvGetTitle", handle),
  $_historyGoBack: (handle) => ipcRenderer.invoke("owvHistoryGoBack", handle),
  $_historyGoForward: (handle) => ipcRenderer.invoke("owvHistoryGoForward", handle),
  $_historyCanGoBack: (handle) => ipcRenderer.invoke("owvHistoryCanGoBack", handle),
  $_historyCanGoForward: (handle) => ipcRenderer.invoke("owvHistoryCanGoForward", handle),
  $_onPaint: callback => ipcRenderer.on("owvOnPaint", callback),
  $_onCursorChanged: callback => ipcRenderer.on("owvOnCursorChanged", callback),
  $_onStartNavigation: callback => ipcRenderer.on("owvOnStartNavigation", callback),
  $_onTitleChanged: callback => ipcRenderer.on("owvOnTitleChanged", callback),
});
