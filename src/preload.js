const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("_owv", {
  $_create: (width, height) => ipcRenderer.invoke("owvCreate", width, height),
  $_destroy: (handle) => ipcRenderer.invoke("owvDestroy", handle),
  $_navigate: (handle, url, isLocal) => ipcRenderer.invoke("owvNavigate", handle, url, isLocal),
  $_sendMouseEvent: (handle, type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY) => ipcRenderer.invoke("owvSendMouseEvent", handle, type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY),
  $_sendKbdEvent: (handle, type, keyCode, modifiers) => ipcRenderer.invoke("owvSendKbdEvent", handle, type, keyCode, modifiers),
  $_setFocus: (handle, flag) => ipcRenderer.invoke("owvSetFocus", handle, flag),
  $_onPaint: callback => ipcRenderer.on("owvOnPaint", callback),
  $_onCursorChanged: callback => ipcRenderer.on("owvOnCursorChanged", callback),
});
