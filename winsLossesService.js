const nbaApi = require('nba-api-client');

let winsLossesData = []; // In-memory storage

// Function to fetch and store wins/losses data in memory
async function fetchAndStoreWinsLosses() {
  try {
    const standingsData = await nbaApi.leagueStandings({
      LeagueID: '00',
      Season: '2024-25',
      SeasonType: 'Regular Season',
    });

    winsLossesData = Object.values(standingsData.Standings).map(team => ({
      SeasonID: team.SeasonID,
      TeamName: team.TeamName,
      TeamCity: team.TeamCity,
      WINS: team.WINS,
      LOSSES: team.LOSSES,
    }));

    console.log('Wins and losses data successfully fetched and stored in memory.');
  } catch (error) {
    console.error('Error fetching or processing standings data:', error.message);
  }
}

// Function to get the data
function getWinsLossesData() {
  return winsLossesData;
}

module.exports = {
  fetchAndStoreWinsLosses,
  getWinsLossesData,
};