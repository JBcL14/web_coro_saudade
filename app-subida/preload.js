/* preload.js — expone al renderer una API mínima y segura */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  leerConfig:    ()      => ipcRenderer.invoke('config:leer'),
  guardarConfig: (cfg)   => ipcRenderer.invoke('config:guardar', cfg),
  listar:        ()      => ipcRenderer.invoke('medios:listar'),
  elegir:        ()      => ipcRenderer.invoke('medios:elegir'),
  subir:         (rutas) => ipcRenderer.invoke('medios:subir', rutas),
  borrar:        (clave) => ipcRenderer.invoke('medios:borrar', clave)
});
