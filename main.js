const fs = require("node:fs/promises");
const path = require("node:path");
const { app, BrowserWindow, Menu, dialog, ipcMain, nativeTheme, shell } = require("electron");

app.setName("Akış Studio");

let mainWindow = null;
let currentFilePath = null;

function sendCommand(command) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("menu:command", command);
}

function setTheme(theme) {
  nativeTheme.themeSource = theme;
  buildMenu();
  sendCommand(`theme:${theme}`);
}

function buildMenu() {
  const template = [
    {
      label: "Dosya",
      submenu: [
        { label: "Yeni", accelerator: "CmdOrCtrl+N", click: () => sendCommand("new") },
        { label: "Aç…", accelerator: "CmdOrCtrl+O", click: () => sendCommand("open") },
        { type: "separator" },
        { label: "Kaydet", accelerator: "CmdOrCtrl+S", click: () => sendCommand("save") },
        { label: "Farklı Kaydet…", accelerator: "CmdOrCtrl+Shift+S", click: () => sendCommand("save-as") },
        { type: "separator" },
        { label: "PNG / SVG Dışa Aktar…", accelerator: "CmdOrCtrl+E", click: () => sendCommand("export") },
        { type: "separator" },
        { role: "quit", label: "Çıkış" }
      ]
    },
    {
      label: "Düzen",
      submenu: [
        { label: "Geri Al", accelerator: "CmdOrCtrl+Z", click: () => sendCommand("undo") },
        { label: "Yinele", accelerator: "CmdOrCtrl+Y", click: () => sendCommand("redo") },
        { type: "separator" },
        { label: "Çoğalt", accelerator: "CmdOrCtrl+D", click: () => sendCommand("duplicate") },
        { label: "Sil", accelerator: "Delete", click: () => sendCommand("delete") },
        { type: "separator" },
        { label: "Tümünü Sığdır", accelerator: "CmdOrCtrl+0", click: () => sendCommand("fit") }
      ]
    },
    {
      label: "Görünüm",
      submenu: [
        { label: "Şekil Panelini Aç/Kapat", accelerator: "CmdOrCtrl+Shift+B", click: () => sendCommand("toggle-palette") },
        { label: "Izgarayı Aç/Kapat", accelerator: "CmdOrCtrl+Shift+G", click: () => sendCommand("toggle-grid") },
        { type: "separator" },
        {
          label: "Tema",
          submenu: [
            { label: "Sistem", type: "radio", checked: nativeTheme.themeSource === "system", click: () => setTheme("system") },
            { label: "Açık", type: "radio", checked: nativeTheme.themeSource === "light", click: () => setTheme("light") },
            { label: "Koyu", type: "radio", checked: nativeTheme.themeSource === "dark", click: () => setTheme("dark") }
          ]
        },
        { type: "separator" },
        { role: "reload", label: "Yenile" },
        { role: "togglefullscreen", label: "Tam Ekran" },
        { role: "toggleDevTools", label: "Geliştirici Araçları" }
      ]
    },
    {
      label: "Yardım",
      submenu: [
        {
          label: "Akış Studio Hakkında",
          click: () => dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "Akış Studio",
            message: "Akış Studio 1.2.0",
            detail: "Enes Can Çelik için hazırlanmış çevrimdışı diyagram editörü."
          })
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Akış Studio",
    width: 1600,
    height: 950,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#181818" : "#f7f7f8",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false
    }
  });

  buildMenu();
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });
}

function safeProjectName(name) {
  return String(name || "diyagram").trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-") || "diyagram";
}

async function chooseSavePath(name) {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Akış Projesini Kaydet",
    defaultPath: path.join(app.getPath("documents"), `${safeProjectName(name)}.akis`),
    filters: [
      { name: "Akış Studio Projesi", extensions: ["akis"] },
      { name: "JSON", extensions: ["json"] }
    ]
  });
  return result.canceled ? null : result.filePath;
}

ipcMain.handle("project:open", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Akış Projesi Aç",
    properties: ["openFile"],
    filters: [
      { name: "Akış Studio Projesi", extensions: ["akis", "json"] },
      { name: "Tüm Dosyalar", extensions: ["*"] }
    ]
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  const data = await fs.readFile(filePath, "utf8");
  currentFilePath = filePath;
  return { canceled: false, filePath, data };
});

ipcMain.handle("project:save", async (_event, payload) => {
  const filePath = currentFilePath || await chooseSavePath(payload.name);
  if (!filePath) return { canceled: true };
  await fs.writeFile(filePath, payload.data, "utf8");
  currentFilePath = filePath;
  return { canceled: false, filePath };
});

ipcMain.handle("project:save-as", async (_event, payload) => {
  const filePath = await chooseSavePath(payload.name);
  if (!filePath) return { canceled: true };
  await fs.writeFile(filePath, payload.data, "utf8");
  currentFilePath = filePath;
  return { canceled: false, filePath };
});

ipcMain.handle("project:clear-path", () => {
  currentFilePath = null;
  return true;
});

ipcMain.handle("window:set-title", (_event, payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const dirty = payload.dirty ? " •" : "";
  const file = payload.filePath ? ` — ${path.basename(payload.filePath)}` : "";
  mainWindow.setTitle(`${payload.name || "İsimsiz Diyagram"}${dirty}${file} — Akış Studio`);
});

ipcMain.handle("theme:set", (_event, theme) => {
  if (["system", "light", "dark"].includes(theme)) {
    nativeTheme.themeSource = theme;
    buildMenu();
  }
  return nativeTheme.themeSource;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
