const nbaApi = require('nba-api-client');
const fs = require('fs');

async function saveWinsLossesToFile() {
  try {
    // Fetch league standings for the current season (2023-24)
    const standingsData = await nbaApi.leagueStandings({
      LeagueID: '00', // NBA league
      Season: '2024-25', // Current NBA season
      SeasonType: 'Regular Season', // Regular season data
    });

    // Extract relevant data
    const teamsData = standingsData.Standings;
    const extractedData = Object.values(teamsData).map(team => ({
      SeasonID: team.SeasonID,
      TeamName: team.TeamName,
      TeamCity: team.TeamCity,
      WINS: team.WINS,
      LOSSES: team.LOSSES,
    }));

    // Save the extracted data to a JSON file
    const filePath = './winsLosses.json';
    fs.writeFileSync(filePath, JSON.stringify(extractedData, null, 2), 'utf8');

    console.log(`Wins and losses data saved to ${filePath}`);
  } catch (error) {
    console.error("Error fetching or processing standings data:", error.message);
  }
}

// Call the function
saveWinsLossesToFile();