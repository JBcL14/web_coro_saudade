/* preload.js — expone al renderer una API mínima y segura */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  leerConfig:    ()        => ipcRenderer.invoke('config:leer'),
  guardarConfig: (cfg)     => ipcRenderer.invoke('config:guardar', cfg),
  listar:        ()        => ipcRenderer.invoke('medios:listar'),
  elegir:        ()        => ipcRenderer.invoke('medios:elegir'),
  subir:         (rutas)   => ipcRenderer.invoke('medios:subir', rutas),
  borrar:        (clave)   => ipcRenderer.invoke('medios:borrar', clave),
  renombrar:     (clave, nuevoNombre) => ipcRenderer.invoke('medios:renombrar', clave, nuevoNombre),
  confirmar:     (mensaje) => ipcRenderer.invoke('confirmar', mensaje),
  agendaListar:  ()        => ipcRenderer.invoke('agenda:listar'),
  agendaAnadir:  (datos)   => ipcRenderer.invoke('agenda:anadir', datos),
  agendaBorrar:  (seccion, indice) => ipcRenderer.invoke('agenda:borrar', seccion, indice)
});
