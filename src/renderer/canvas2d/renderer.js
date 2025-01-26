import { OffscreenWebViewClient } from "../owv-client.js";

async function main() {
  OffscreenWebViewClient.$_init();
  
  const canvas = document.getElementById("webview");
  /** @type {CanvasRenderingContext2D} */
  const canvasCtx = canvas.getContext("2d");

  const canvasWebviewOverlay = document.getElementById("webviewOverlay");
  /** @type {CanvasRenderingContext2D} */
  const canvasWebviewOverlayCtx = canvasWebviewOverlay.getContext("2d");

  const elmCheckVisibleDirtyArea = document.getElementById("checkVisibleDirtyArea");

  const owv = new OffscreenWebViewClient();
  const owvWidth = 600;
  const owvHeight = 300;

  owv.$_setOnPaintHandler((owv, image, width, height, dirtyX, dirtyY, dirtyWidth, dirtyHeight) => {
    // swap bbggrr to rrggbb
    let buf = new Uint8ClampedArray(image.buffer);
    let begin = 0;
    let end = begin + (dirtyWidth * dirtyHeight) * 4;
    let t = 0;
    for(let i = begin; i < end; i += 4) {
      t = buf[i];
      buf[i] = buf[i + 2];
      buf[i + 2] = t;
    }
    canvasCtx.putImageData(new ImageData(buf, dirtyWidth, dirtyHeight, { colorSpace: "srgb" }), dirtyX, dirtyY);

    if (elmCheckVisibleDirtyArea.checked) {
      canvasWebviewOverlayCtx.clearRect(0, 0, canvasWebviewOverlay.width, canvasWebviewOverlay.height);
      canvasWebviewOverlayCtx.fillStyle = "rgba(255, 0, 255, 0.25)";
      canvasWebviewOverlayCtx.fillRect(dirtyX, dirtyY, dirtyWidth, dirtyHeight);
    }
  });

  owv.$_setOnCursorChangedHandler((owv, type) => {
    if (type === "pointer")
      canvas.style.cursor = "default";
    else if (type === "hand")
      canvas.style.cursor = "pointer";
    else
      canvas.style.cursor = type;
  });

  await owv.$_create(owvWidth, owvHeight);
  await owv.$_navigate("https://inonote.jp/files/canvas-webview-test.html");

  canvas.tabIndex = 0;
  canvas.width = owvWidth * window.devicePixelRatio;
  canvas.height = owvHeight * window.devicePixelRatio;
  canvas.style.width = (canvas.width / window.devicePixelRatio) + "px";
  canvas.style.height = (canvas.height / window.devicePixelRatio) + "px";

  canvasWebviewOverlay.width = owvWidth * window.devicePixelRatio;
  canvasWebviewOverlay.height = owvHeight * window.devicePixelRatio;
  canvasWebviewOverlay.style.width = (canvasWebviewOverlay.width / window.devicePixelRatio) + "px";
  canvasWebviewOverlay.style.height = (canvasWebviewOverlay.height / window.devicePixelRatio) + "px";
  
  owv.$_setFocus(true);

  window.addEventListener("unload", e => {
    owv.$_destroy();
  });
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    sendMouseEvent(owv, "mouseDown", e);
    canvas.focus();
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.addEventListener("pointerup", e => {
    sendMouseEvent(owv, "mouseUp", e);
    e.preventDefault();
    e.stopPropagation();
    canvas.releasePointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerenter", e => {
    sendMouseEvent(owv, "mouseEnter", e);
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.addEventListener("pointerleave", e => {
    sendMouseEvent(owv, "mouseLeave", e);
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.addEventListener("pointermove", e => {
    sendMouseEvent(owv, "mouseMove", e);
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.addEventListener("mousewheel", e => {
    sendMouseEvent(owv, "mouseWheel", e);
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.addEventListener("keydown", e => {
    owv.$_sendKbdEvent("keyDown", e.key, getModifiersFromInputEvent(e));
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.addEventListener("keyup", e => {
    owv.$_sendKbdEvent("keyUp", e.key, getModifiersFromInputEvent(e));
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.addEventListener("focus", e => {
    owv.$_setFocus(true);
  });
  canvas.addEventListener("blur", e => {
    owv.$_setFocus(false);
  });

  document.getElementById("btnGo").addEventListener("click", () => {
    owv.$_navigate(document.getElementById("addrbar").value, false);
  });

  elmCheckVisibleDirtyArea.addEventListener("click", () => {
    canvasWebviewOverlay.style.display = elmCheckVisibleDirtyArea.checked ? "block" : "none";
  });

  /** @type {(owv: OffscreenWebViewClient, eventName: string, inputEvent: MouseEvent|WheelEvent) => void} */
  function sendMouseEvent(owv, eventName, inputEvent) {
    if (eventName !== "mouseWheel")
      owv.$_sendMouseEvent(eventName, inputEvent.offsetX, inputEvent.offsetY, inputEvent.button, getModifiersFromInputEvent(inputEvent), 0, 0);
    else
      owv.$_sendMouseEvent(eventName, inputEvent.offsetX, inputEvent.offsetY, inputEvent.button, getModifiersFromInputEvent(inputEvent), -inputEvent.deltaX, -inputEvent.deltaY);
  }

  /** @type {(inputEvent: MouseEvent|WheelEvent|KeyboardEvent) => []]} */
  function getModifiersFromInputEvent(inputEvent) {
    let mods = [];
    if (inputEvent.shiftKey)
      mods.push("shift");
    if (inputEvent.ctrlKey)
      mods.push("ctrl");
    if (inputEvent.altKey)
      mods.push("alt");
    return mods;
  }
}

setTimeout(main);
