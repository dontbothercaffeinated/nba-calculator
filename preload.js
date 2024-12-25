const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getTeams: () => ipcRenderer.invoke('get-teams'),
  getSeasons: () => ipcRenderer.invoke('get-seasons'),
  getFilteredGames: (season, teamId) => ipcRenderer.invoke('get-filtered-games', season, teamId),
  getTeamPct: (teamName) => ipcRenderer.invoke('get-team-pct', teamName),
});