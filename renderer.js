(async () => {
    // Fetch and populate the teams dropdown
    const teams = await window.electron.getTeams();
    const teamSelect = document.getElementById('team');
    teams.forEach((team) => {
      const option = document.createElement('option');
      option.value = team.id;
      option.textContent = team.full_name;
      teamSelect.appendChild(option);
    });
  
    // Fetch and populate the seasons dropdown
    const seasons = await window.electron.getSeasons();
    const seasonSelect = document.getElementById('season');
    seasons.forEach((season) => {
      const option = document.createElement('option');
      option.value = season;
      option.textContent = season;
      seasonSelect.appendChild(option);
    });
  })();
  
  // Handle form submission
  document.getElementById('filterForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const season = document.getElementById('season').value;
    const teamId = document.getElementById('team').value;
  
    const games = await window.electron.getFilteredGames(season, teamId);
  
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    games.forEach((game) => {
      const gameDiv = document.createElement('div');
      gameDiv.innerHTML = `
        <p><strong>${game.home_team.full_name} (${game.home_team_score})</strong> vs 
        <strong>${game.visitor_team.full_name} (${game.visitor_team_score})</strong></p>
        <p>Date: ${game.date}</p>
      `;
      resultsDiv.appendChild(gameDiv);
    });
  });
   