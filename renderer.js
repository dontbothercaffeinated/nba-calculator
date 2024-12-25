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
  
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
  
    for (const game of games) {
      // Fetch team win/loss percentages (.pct) for both home and visitor teams
      const homeTeamPct = parseFloat(await window.electron.getTeamPct(game.home_team.full_name));
      const visitorTeamPct = parseFloat(await window.electron.getTeamPct(game.visitor_team.full_name));
  
      let selectedTeam, opponentTeam, selectedTeamScore, opponentTeamScore;
      let selectedTeamPct, opponentTeamPct;
  
      // Determine which team is the selected team and which is the opponent
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
        // Skip this game if neither team matches the selected team
        continue;
      }
  
      // Calculate Win Spread and Table Rank Spread
      const winSpread = selectedTeamScore - opponentTeamScore; // Selected team score - Opponent team score
      const tableRankSpread = (opponentTeamPct - selectedTeamPct).toFixed(3); // Opponent pct - Selected team pct
  
      // Create and display game information
      const gameDiv = document.createElement('div');
      gameDiv.innerHTML = `
        <p><strong>${selectedTeam} (${selectedTeamScore})</strong> (${selectedTeamPct.toFixed(3)}) vs 
        <strong>${opponentTeam} (${opponentTeamScore})</strong> (${opponentTeamPct.toFixed(3)})</p>
        <p>Date: ${game.date}</p>
        <p>Win Spread: ${winSpread}</p>
        <p>Table Rank Spread: ${tableRankSpread}</p>
      `;
      resultsDiv.appendChild(gameDiv);
    }
  });
})();