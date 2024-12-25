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
    const teamId = teamDropdown.value;
    const games = await window.electron.getFilteredGames(season, teamId);

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    for (const game of games) {
      const homeTeamPct = await window.electron.getTeamPct(game.home_team.full_name);
      const visitorTeamPct = await window.electron.getTeamPct(game.visitor_team.full_name);

      const gameDiv = document.createElement('div');
      gameDiv.innerHTML = `
        <p><strong>${game.home_team.full_name} (${game.home_team_score})</strong> 
        (${homeTeamPct}) vs 
        <strong>${game.visitor_team.full_name} (${game.visitor_team_score})</strong> 
        (${visitorTeamPct})</p>
        <p>Date: ${game.date}</p>
      `;
      resultsDiv.appendChild(gameDiv);
    }
  });
})();