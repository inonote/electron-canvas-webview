const owvInvoker = window._owv;

/** @typedef {(owv: OffscreenWebViewClient, image: Uint8Array, width: number, height: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number)} OffscreenWebViewOnPaint */
/** @typedef {(owv: OffscreenWebViewClient, type: string)} OffscreenWebViewOnCursorChanged */

export function OffscreenWebViewClient() {
  this.$_handle = 0;

  /** @type {OffscreenWebViewOnPaint|null} */
  this.$_onPaintHandler = null;

  /** @type {OffscreenWebViewOnCursorChanged|null} */
  this.$_onCursorChangedHandler = null;
}

/** @type {Map<number, OffscreenWebViewClient>} */
OffscreenWebViewClient.$_handleMap = new Map();

OffscreenWebViewClient.$_isInitialized = false;
OffscreenWebViewClient.$_init = function() {
  if (OffscreenWebViewClient.$_isInitialized)
    return;

  OffscreenWebViewClient.$_isInitialized = true;

  owvInvoker.$_onPaint((e, handle, image, width, height, dirtyX, dirtyY, dirtyWidth, dirtyHeight) => {
    const owv = OffscreenWebViewClient.$_handleMap.get(handle);
    if (!owv || !owv.$_onPaintHandler)
      return;

    owv.$_onPaintHandler.call(owv, owv, image, width, height, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
  });

  owvInvoker.$_onCursorChanged((e, handle, type) => {
    const owv = OffscreenWebViewClient.$_handleMap.get(handle);
    if (!owv || !owv.$_onCursorChangedHandler)
      return;

    owv.$_onCursorChangedHandler.call(owv, owv, type);
  });
};

/**
 * create a webview
 * @param {number} width 
 * @param {number} height 
 * @returns {Promise<boolean>}
 */
OffscreenWebViewClient.prototype.$_create = async function(width, height) {
  this.$_handle = await owvInvoker.$_create(width, height);
  if (!this.$_handle)
    return false;

  OffscreenWebViewClient.$_handleMap.set(this.$_handle, this);
  return true;
};

/**
 * destroy the webview
 * @returns {Promise<boolean>}
 */
OffscreenWebViewClient.prototype.$_destroy = function() {
  OffscreenWebViewClient.$_handleMap.delete(this.$_handle);
  return owvInvoker.$_destroy(this.$_handle);
};

/**
 * load a web contents
 * @param {string} url 
 * @param {boolean} isLocal 
 * @returns {Promise<boolean>}
 */
OffscreenWebViewClient.prototype.$_navigate = function(url, isLocal) {
  return owvInvoker.$_navigate(this.$_handle, url, isLocal);
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
 * @returns {Promise<boolean>}
 */
OffscreenWebViewClient.prototype.$_sendMouseEvent = function(type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY) {
  return owvInvoker.$_sendMouseEvent(this.$_handle, type, x, y, button, modifiers, wheelDeltaX, wheelDeltaY);
};

/**
 * send a keyboard event to the webview
 * @param {"rawKeyDown" | "keyDown" | "keyUp" | "char"} type 
 * @param {string} keyCode 
 * @param {Array<"shift" | "control" | "ctrl" | "alt" | "meta" | "command" | "cmd" | "isKeypad" | "isAutoRepeat" | "leftButtonDown" | "middleButtonDown" | "rightButtonDown" | "capsLock" | "numLock" | "left" | "right">} modifiers 
 * @returns {Promise<boolean>}
 */
OffscreenWebViewClient.prototype.$_sendKbdEvent = function(type, keyCode, modifiers) {
  return owvInvoker.$_sendKbdEvent(this.$_handle, type, keyCode, modifiers);
};

/**
 * activate the webview
 * @param {boolean} flag blur/focus
 * @returns {Promise<boolean>}
 */
OffscreenWebViewClient.prototype.$_setFocus = function(flag) {
  return owvInvoker.$_setFocus(this.$_handle, flag);
};

/**
 * set a paint handler
 * @param {OffscreenWebViewOnPaint|null} func 
 */
OffscreenWebViewClient.prototype.$_setOnPaintHandler = function(func) {
  if (typeof func === "function")
    this.$_onPaintHandler = func;
  else
    this.$_onPaintHandler = null;
};

/**
 * set a cursor changed handler
 * @param {OffscreenWebViewOnCursorChanged|null} func 
 */
OffscreenWebViewClient.prototype.$_setOnCursorChangedHandler = function(func) {
  if (typeof func === "function")
    this.$_onCursorChangedHandler = func;
  else
    this.$_onCursorChangedHandler = null;
};
