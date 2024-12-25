const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs'); // Required to read the config file
const { BalldontlieAPI } = require('@balldontlie/sdk');

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
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

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
        const isRegularSeason = String(game.id).startsWith('159');
        return isCompleted && isRegularSeason;
      });
  
      // Log filtered games
      console.log('Filtered Games (Displayed in Dashboard):');
      completedRegularSeasonGames.forEach((game) => {
        console.log(
          `Game ID: ${game.id}, Date: ${game.date}, ` +
          `${game.home_team.full_name} vs ${game.visitor_team.full_name}`
        );
      });
  
      // Log all games without filters
      console.log('\nAll Games (Unfiltered):');
      allGames.forEach((game) => {
        console.log(
          `Game ID: ${game.id}, Date: ${game.date}, Status: ${game.status}, ` +
          `${game.home_team.full_name} vs ${game.visitor_team.full_name}`
        );
      });
  
      return completedRegularSeasonGames;
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  });
  
  
  

// Return available seasons
ipcMain.handle('get-seasons', () => {
  // You can modify this array to reflect valid NBA seasons
  return Array.from({ length: 50 }, (_, i) => 1975 + i); // 1975 to 2024
});