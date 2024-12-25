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
    const impressivenessScoreSpan = document.getElementById('impressivenessScore');
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

    let totalAdjustedGameImpressiveness = 0; // To calculate the season impressiveness score
    let minGameImpressiveness = Number.MAX_VALUE;

    // First pass: calculate game impressiveness and find minimum
    const gameImpressivenessValues = gameData.map(data => {
      const winSpreadZScore = ((data.winSpread - winSpreadStats.mean) / winSpreadStats.stdDev).toFixed(3);
      const tableRankSpreadZScore = ((data.tableRankSpread - tableRankSpreadStats.mean) / tableRankSpreadStats.stdDev).toFixed(3);

      const gameImpressiveness = (parseFloat(winSpreadZScore) + parseFloat(tableRankSpreadZScore)).toFixed(3);
      minGameImpressiveness = Math.min(minGameImpressiveness, gameImpressiveness);
      return parseFloat(gameImpressiveness);
    });

    // Calculate the absolute value of the lowest game impressiveness
    const adjustmentFactor = Math.abs(minGameImpressiveness);

    // Render games with calculated scores
    for (let i = 0; i < gameData.length; i++) {
      const data = gameData[i];
      const { game, selectedTeam, opponentTeam, selectedTeamScore, opponentTeamScore, selectedTeamPct, opponentTeamPct, winSpread, tableRankSpread } = data;

      const winSpreadZScore = ((winSpread - winSpreadStats.mean) / winSpreadStats.stdDev).toFixed(3);
      const tableRankSpreadZScore = ((tableRankSpread - tableRankSpreadStats.mean) / tableRankSpreadStats.stdDev).toFixed(3);

      const gameImpressiveness = gameImpressivenessValues[i].toFixed(3);

      // Calculate Adjusted Game Impressiveness
      const adjustedGameImpressiveness = (parseFloat(gameImpressiveness) + adjustmentFactor).toFixed(3);

      // Add to total adjusted game impressiveness
      totalAdjustedGameImpressiveness += parseFloat(adjustedGameImpressiveness);

      const gameDiv = document.createElement('div');
      gameDiv.classList.add('game');
      gameDiv.innerHTML = `
        <div class="game-header">
          <p><strong>${selectedTeam} (${selectedTeamScore})</strong> (${selectedTeamPct.toFixed(3)}) vs 
          <strong>${opponentTeam} (${opponentTeamScore})</strong> (${opponentTeamPct.toFixed(3)})</p>
        </div>
        <p>Date: ${game.date}</p>
        <p>Win Spread: ${winSpread}</p>
        <p>Table Rank Spread: ${tableRankSpread}</p>
        <p>Win Spread Z-Score: ${winSpreadZScore}</p>
        <p>Table Rank Spread Z-Score: ${tableRankSpreadZScore}</p>
        <p><strong>Game Impressiveness: ${gameImpressiveness}</strong></p>
        <p><strong>Adjusted Game Impressiveness: ${adjustedGameImpressiveness}</strong></p>
      `;
      resultsDiv.appendChild(gameDiv);
    }

    // Display Total Season Impressiveness Score as the sum of all adjusted scores
    impressivenessScoreSpan.textContent = totalAdjustedGameImpressiveness.toFixed(3);
  });
})();