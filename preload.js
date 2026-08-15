const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  openProject: () => ipcRenderer.invoke("project:open"),
  saveProject: (payload) => ipcRenderer.invoke("project:save", payload),
  saveProjectAs: (payload) => ipcRenderer.invoke("project:save-as", payload),
  clearProjectPath: () => ipcRenderer.invoke("project:clear-path"),
  setWindowTitle: (payload) => ipcRenderer.invoke("window:set-title", payload),
  setTheme: (theme) => ipcRenderer.invoke("theme:set", theme),
  onMenuCommand: (callback) => {
    const listener = (_event, command) => callback(command);
    ipcRenderer.on("menu:command", listener);
    return () => ipcRenderer.removeListener("menu:command", listener);
  }
});
