(async () => {
  // Populate the seasons dropdown
  const seasons = await window.electron.getSeasons();
  const seasonDropdown = document.getElementById('season');
  seasons.forEach(season => {
    const option = document.createElement('option');
    option.value = season;
    option.textContent = season;
    seasonDropdown.appendChild(option);
  });

  // Populate the teams dropdown
  const teams = await window.electron.getTeams();
  const teamDropdown = document.getElementById('team');
  teams.forEach(team => {
    const option = document.createElement('option');
    option.value = team.id;
    option.textContent = team.full_name;
    teamDropdown.appendChild(option);
  });

  // Handle form submission
  document.getElementById('filterForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const season = seasonDropdown.value;
    const selectedTeamId = parseInt(teamDropdown.value); // Selected team ID
    const games = await window.electron.getFilteredGames(season, selectedTeamId);
  
    const winSpreadValues = [];
    const tableRankSpreadValues = [];
    const gameData = []; // To store each game's data for Z-Score calculations
  
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
  
    for (const game of games) {
      const homeTeamPct = parseFloat(await window.electron.getTeamPct(game.home_team.full_name));
      const visitorTeamPct = parseFloat(await window.electron.getTeamPct(game.visitor_team.full_name));
  
      let selectedTeam, opponentTeam, selectedTeamScore, opponentTeamScore;
      let selectedTeamPct, opponentTeamPct;
  
      if (game.home_team.id === selectedTeamId) {
        selectedTeam = game.home_team.full_name;
        opponentTeam = game.visitor_team.full_name;
        selectedTeamScore = game.home_team_score;
        opponentTeamScore = game.visitor_team_score;
        selectedTeamPct = homeTeamPct;
        opponentTeamPct = visitorTeamPct;
      } else if (game.visitor_team.id === selectedTeamId) {
        selectedTeam = game.visitor_team.full_name;
        opponentTeam = game.home_team.full_name;
        selectedTeamScore = game.visitor_team_score;
        opponentTeamScore = game.home_team_score;
        selectedTeamPct = visitorTeamPct;
        opponentTeamPct = homeTeamPct;
      } else {
        continue; // Skip games that don't involve the selected team
      }
  
      const winSpread = selectedTeamScore - opponentTeamScore;
      const tableRankSpread = opponentTeamPct - selectedTeamPct;
  
      // Push values into datasets
      winSpreadValues.push(winSpread);
      tableRankSpreadValues.push(tableRankSpread);
  
      // Store game data
      gameData.push({
        game,
        selectedTeam,
        opponentTeam,
        selectedTeamScore,
        opponentTeamScore,
        selectedTeamPct,
        opponentTeamPct,
        winSpread,
        tableRankSpread,
      });
    }
  
    // Calculate Mean and Standard Deviation for Win Spread and Table Rank Spread
    const calculateStats = (values) => {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      return { mean, stdDev };
    };
  
    const winSpreadStats = calculateStats(winSpreadValues);
    const tableRankSpreadStats = calculateStats(tableRankSpreadValues);
  
    // Render games with calculated Z-Scores
    for (const data of gameData) {
      const { game, selectedTeam, opponentTeam, selectedTeamScore, opponentTeamScore, selectedTeamPct, opponentTeamPct, winSpread, tableRankSpread } = data;
  
      const winSpreadZScore = ((winSpread - winSpreadStats.mean) / winSpreadStats.stdDev).toFixed(3);
      const tableRankSpreadZScore = ((tableRankSpread - tableRankSpreadStats.mean) / tableRankSpreadStats.stdDev).toFixed(3);
  
      const gameDiv = document.createElement('div');
      gameDiv.innerHTML = `
        <p><strong>${selectedTeam} (${selectedTeamScore})</strong> (${selectedTeamPct.toFixed(3)}) vs 
        <strong>${opponentTeam} (${opponentTeamScore})</strong> (${opponentTeamPct.toFixed(3)})</p>
        <p>Date: ${game.date}</p>
        <p>Win Spread: ${winSpread}</p>
        <p>Table Rank Spread: ${tableRankSpread}</p>
        <p>Win Spread Z-Score: ${winSpreadZScore}</p>
        <p>Table Rank Spread Z-Score: ${tableRankSpreadZScore}</p>
      `;
      resultsDiv.appendChild(gameDiv);
    }
  });
})();