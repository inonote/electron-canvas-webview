const { BrowserWindow, WebContents, ipcMain } = require("electron");
const path = require("path");

/**
 * @constructor
 * @param {number} handle 
 * @param {WebContents} owner 
 * @param {number} width 
 * @param {number} height 
 */
function OffscreenWebViewHost(handle, owner, width, height) {
  /** @type {number} */
  this.$_handle = handle;

  /** @type {BrowserWindow} */
  this.$_wnd = OffscreenWebViewHost.$_getFreeWnd();

  /** @type {WebContents} */
  this.$_ownerWnd = owner;

  this.$_onlyDirtyRect = true;

  this.$_wnd.webContents.addListener("paint", (details, dirty, image) => {
    const size = image.getSize();
    if (this.$_onlyDirtyRect)
      this.$_ownerWnd.send("owvOnPaint", this.$_handle, image.crop(dirty).toBitmap(), size.width, size.height, dirty.x, dirty.y, dirty.width, dirty.height);
    else
      this.$_ownerWnd.send("owvOnPaint", this.$_handle, image.toBitmap(), size.width, size.height, dirty.x, dirty.y, dirty.width, dirty.height);
  });
  
  this.$_wnd.webContents.addListener("cursor-changed", (e, type, image, scale, size, hotspot) => {
    this.$_ownerWnd.send("owvOnCursorChanged", this.$_handle, type);
  });

  this.$_wnd.webContents.setFrameRate(60);
  this.$_wnd.setSize(width, height);
  this.$_wnd.webContents.startPainting();
}

/** @type {BrowserWindow[]} */
OffscreenWebViewHost.$_wndPool = [];

/** @type {() => BrowserWindow} */
OffscreenWebViewHost.$_getFreeWnd = function() {
  if (!OffscreenWebViewHost.$_wndPool.length) {
    console.log("OffscreenWebViewHost.$_getFreeWnd pool is empty");
    return new BrowserWindow({
      show: false,
      fullscreenable:false,
      webPreferences: {
        offscreen: true,
      }
    });
  }

  return OffscreenWebViewHost.$_wndPool.pop();
}

/**
 * destroy the webview
 * @returns {void}
 */
OffscreenWebViewHost.prototype.$_destroy = function() {
  this.$_wnd.webContents.stopPainting();
  this.$_wnd.webContents.removeAllListeners("paint");
  this.$_wnd.webContents.removeAllListeners("cursor-changed");
  this.$_wnd.webContents.loadURL("about:blank");
  OffscreenWebViewHost.$_wndPool.push(this.$_wnd);

  OffscreenWebViewHost.$_handles.delete(this.$_handle);
};

/**
 * load a web contents
 * @param {string} url 
 * @param {boolean} isLocal 
 * @returns {void}
 */
OffscreenWebViewHost.prototype.$_navigate = function(url, isLocal) {
  if (isLocal)
    this.$_wnd.loadFile(path.join(__dirname, url));
  else
    this.$_wnd.loadURL(url);
};

/**
 * send a mouse event to the webview
 * @param {"mouseDown" | "mouseUp" | "mouseEnter" | "mouseLeave" | "contextMenu" | "mouseWheel" | "mouseMove"} type 
 * @param {number} x 
 * @param {number} y 
 * @param {0 | 1 | 2} button which mouse button is pressed
 * @param {Array<"shift" | "control" | "ctrl" | "alt" | "meta" | "command" | "cmd" | "isKeypad" | "isAutoRepeat" | "leftButtonDown" | "middleButtonDown" | "rightButtonDown" | "capsLock" | "numLock" | "left" | "right">} modifiers
 * @param {number} wheelDeltaX only for `mouseWheel`
 * @param {number} wheelDeltaY only for `mouseWheel`
 * @returns {void}
 */
OffscreenWebViewHost.prototype.$_sendMouseEvent = function(type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY) {
  this.$_wnd.webContents.sendInputEvent({
    type: type,
    x: x,
    y: y,
    clickCount: 1,
    button: [ "left", "middle", "right" ][button],
    // canScroll: true,
    modifiers: modifiers,
    deltaX: wheelDeltaX,
    deltaY: wheelDeltaY
  });
};

/**
 * send a keyboard event to the webview
 * @param {"rawKeyDown" | "keyDown" | "keyUp" | "char"} type 
 * @param {string} keyCode 
 * @param {Array<"shift" | "control" | "ctrl" | "alt" | "meta" | "command" | "cmd" | "isKeypad" | "isAutoRepeat" | "leftButtonDown" | "middleButtonDown" | "rightButtonDown" | "capsLock" | "numLock" | "left" | "right">} modifiers 
 * @returns {void}
 */
OffscreenWebViewHost.prototype.$_sendKbdEvent = function(type, keyCode, modifiers) {
  this.$_wnd.webContents.sendInputEvent({
    type: type,
    keyCode: keyCode,
    modifiers: modifiers
  });
};

/**
 * activate the webview
 * @param {boolean} flag blur/focus
 * @returns {void}
 */
OffscreenWebViewHost.prototype.$_setFocus = function(flag) {
  if (flag)
    this.$_wnd.focus();
  else if (!flag)
    this.$_wnd.blur();
};


/** @type {Map<number, OffscreenWebViewHost>} */
OffscreenWebViewHost.$_handles = new Map();

/** @type {number} */
OffscreenWebViewHost.$_handleMax = 0;

/**
 * create a webview
 * @param {WebFrameMain} owner a target for the paint message
 * @param {number} width 
 * @param {number} height 
 * @returns {OffscreenWebViewHost}
 */
OffscreenWebViewHost.$_create = function(owner, width, height) {
  let hdl = ++OffscreenWebViewHost.$_handleMax;
  let owv = new OffscreenWebViewHost(hdl, owner, width, height);
  this.$_handles.set(hdl, owv);
  return hdl;
};

/**
 * register ipc handlers
 * @returns {void}
 */
OffscreenWebViewHost.$_bindIpcHandlers = function() {
  ipcMain.handle("owvCreate", (e, width, height) => {
    console.log("owvCreate");

    return this.$_create(e.sender, width, height);
  });

  ipcMain.handle("owvDestroy", (e, handle) => {
    let owv = OffscreenWebViewHost.$_handles.get(handle);
    if (!owv)
      return false;

    console.log("owvDestroy");

    return owv.$_destroy();
  });

  ipcMain.handle("owvNavigate", (e, handle, url, isLocal) => {
    let owv = OffscreenWebViewHost.$_handles.get(handle);
    if (!owv)
      return false;

    console.log("owvNavigate");

    owv.$_navigate(url, isLocal);
    return true;
  });

  ipcMain.handle("owvSendMouseEvent", (e, handle, type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY) => {
    let owv = OffscreenWebViewHost.$_handles.get(handle);
    if (!owv)
      return false;
    
    if (type !== "mouseMove")
      console.log("owvSendMouseEvent", type, button);

    owv.$_sendMouseEvent(type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY);
    return true;
  });

  ipcMain.handle("owvSendKbdEvent", (e, handle, type, keyCode, modifiers) => {
    let owv = OffscreenWebViewHost.$_handles.get(handle);
    if (!owv)
      return false;

    console.log("owvSendKbdEvent", keyCode);

    owv.$_sendKbdEvent(type, keyCode, modifiers);
    return true;
  });

  ipcMain.handle("owvSetFocus", (e, handle, flag) => {
    let owv = OffscreenWebViewHost.$_handles.get(handle);
    if (!owv)
      return false;

    console.log("owvSetFocus");

    owv.$_setFocus(flag);
    return true;
  });
};

exports.OffscreenWebViewHost = OffscreenWebViewHost;
