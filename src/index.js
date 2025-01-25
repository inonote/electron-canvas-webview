const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const { OffscreenWebViewHost } = require("./owv-host");

app.commandLine.appendSwitch("disable-site-isolation-trials");

app.whenReady().then(() => {
  const wnd = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  wnd.setMenu(Menu.buildFromTemplate([
    {
      label: "Canvas2D",
      click: () => { 
        wnd.loadFile(path.join(__dirname, "renderer/canvas2d/index.html"));
      }
    },
    {
      label: "WebGL",
      click: () => { 
        wnd.loadFile(path.join(__dirname, "renderer/webgl/index.html"));
      }
    },
    {
      label: "...",
      type: "submenu",
      submenu: [
        {
          label: "Reload",
          accelerator: "F5",
          click: () => {
            wnd.webContents.reload();
          }
        },
        {
          label: "DevTools",
          accelerator: "F12",
          click: () => {
            wnd.webContents.toggleDevTools();
          }
        }
      ]
    },
  ]));
  wnd.on("closed", () => {
    app.quit();
  });

  OffscreenWebViewHost.$_bindIpcHandlers();
  
  wnd.loadFile(path.join(__dirname, "renderer/canvas2d/index.html"));
});
