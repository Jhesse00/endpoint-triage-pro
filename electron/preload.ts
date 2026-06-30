import { contextBridge, ipcRenderer } from 'electron';

const endpointTriageApi = {
  runScan: () => ipcRenderer.invoke('endpointTriage:runScan'),
  getReports: () => ipcRenderer.invoke('endpointTriage:getReports'),
  exportJson: (reportId: string) => ipcRenderer.invoke('endpointTriage:exportJson', reportId),
  exportHtml: (reportId: string) => ipcRenderer.invoke('endpointTriage:exportHtml', reportId),
  openReportsFolder: () => ipcRenderer.invoke('endpointTriage:openReportsFolder'),
};

contextBridge.exposeInMainWorld('endpointTriage', endpointTriageApi);
