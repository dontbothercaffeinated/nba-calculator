const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { BalldontlieAPI } = require('@balldontlie/sdk');
const { fetchAndStoreWinsLosses, getWinsLossesData } = require('./winsLossesService');

let mainWindow;

// Load the API key from the config.json file
let apiKey;
try {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  apiKey = config.apiKey;
} catch (error) {
  console.error('Error loading API key from config.json:', error);
  app.quit();
}

// Initialize the API with your API key
const api = new BalldontlieAPI({ apiKey });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');
}

app.on('ready', async () => {
  await fetchAndStoreWinsLosses(); // Fetch and store data in memory on app start
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle the request to fetch teams
ipcMain.handle('get-teams', async () => {
  try {
    const response = await api.nba.getTeams();
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
});

// Handle the request to fetch games
ipcMain.handle('get-filtered-games', async (event, season, teamId) => {
  try {
    const allGames = [];
    let cursor = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await api.nba.getGames({
        seasons: [parseInt(season)],
        team_ids: [parseInt(teamId)],
        cursor: cursor,
      });

      allGames.push(...response.data);
      cursor = response.meta?.next_cursor || null;
      hasMore = !!cursor; // Continue fetching if there’s a next page
    }

    // Filter games based on the provided conditions
    const completedRegularSeasonGames = allGames.filter((game) => {
      const isCompleted = game.status === 'Final' || game.status === 'Completed';
      return isCompleted;
    });

    return completedRegularSeasonGames;
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
});

// Return available seasons
ipcMain.handle('get-seasons', () => {
  return Array.from({ length: 50 }, (_, i) => 1975 + i); // 1975 to 2024
});

// IPC to get team win/loss data
ipcMain.handle('get-team-pct', (event, teamName) => {
  const data = getWinsLossesData();
  const team = data.find(t => `${t.TeamCity} ${t.TeamName}` === teamName);
  if (team) {
    return (team.WINS / (team.WINS + team.LOSSES)).toFixed(3); // Decimal format
  }
  return null;
});