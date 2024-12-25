(async () => {
  const setupDashboard = async (
    formId,
    seasonDropdownId,
    teamDropdownId,
    resultsId,
    impressivenessContainerId,
    probabilityContainerId,
    marketOddsInputId,
    marketWinProbabilityId,
    evCalculationId,
    otherImpressivenessContainerId
  ) => {
    const seasons = await window.electron.getSeasons();
    const seasonDropdown = document.getElementById(seasonDropdownId);
    seasons.forEach((season) => {
      const option = document.createElement("option");
      option.value = season;
      option.textContent = season;
      seasonDropdown.appendChild(option);
    });

    const teams = await window.electron.getTeams();
    const teamDropdown = document.getElementById(teamDropdownId);
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.full_name;
      teamDropdown.appendChild(option);
    });

    document.getElementById(formId).addEventListener("submit", async (event) => {
      event.preventDefault();

      const season = seasonDropdown.value;
      const selectedTeamId = parseInt(teamDropdown.value); // Selected team ID
      const games = await window.electron.getFilteredGames(season, selectedTeamId);

      const winSpreadValues = [];
      const tableRankSpreadValues = [];
      const gameData = []; // To store each game's data for Z-Score calculations

      const resultsDiv = document.getElementById(resultsId);
      const impressivenessScoreSpan = document.getElementById(impressivenessContainerId);
      const winProbabilitySpan = document.getElementById(probabilityContainerId);
      const marketWinProbabilitySpan = document.getElementById(marketWinProbabilityId);
      const evCalculationSpan = document.getElementById(evCalculationId);
      resultsDiv.innerHTML = "";

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

        winSpreadValues.push(winSpread);
        tableRankSpreadValues.push(tableRankSpread);

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

      const calculateStats = (values) => {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        return { mean, stdDev };
      };

      const winSpreadStats = calculateStats(winSpreadValues);
      const tableRankSpreadStats = calculateStats(tableRankSpreadValues);

      let totalAdjustedGameImpressiveness = 0;
      let minGameImpressiveness = Number.MAX_VALUE;

      const gameImpressivenessValues = gameData.map((data) => {
        const winSpreadZScore = ((data.winSpread - winSpreadStats.mean) / winSpreadStats.stdDev).toFixed(3);
        const tableRankSpreadZScore = ((data.tableRankSpread - tableRankSpreadStats.mean) / tableRankSpreadStats.stdDev).toFixed(3);

        const gameImpressiveness = (parseFloat(winSpreadZScore) + parseFloat(tableRankSpreadZScore)).toFixed(3);
        minGameImpressiveness = Math.min(minGameImpressiveness, gameImpressiveness);
        return parseFloat(gameImpressiveness);
      });

      const adjustmentFactor = Math.abs(minGameImpressiveness);

      for (let i = 0; i < gameData.length; i++) {
        const data = gameData[i];
        const winSpreadZScore = ((data.winSpread - winSpreadStats.mean) / winSpreadStats.stdDev).toFixed(3);
        const tableRankSpreadZScore = ((data.tableRankSpread - tableRankSpreadStats.mean) / tableRankSpreadStats.stdDev).toFixed(3);

        const gameImpressiveness = (parseFloat(winSpreadZScore) + parseFloat(tableRankSpreadZScore)).toFixed(3);
        const adjustedGameImpressiveness = (parseFloat(gameImpressiveness) + adjustmentFactor).toFixed(3);
        totalAdjustedGameImpressiveness += parseFloat(adjustedGameImpressiveness);

        const gameDiv = document.createElement("div");
        gameDiv.innerHTML = `
          <div class="game-header">${data.selectedTeam} (${data.selectedTeamScore}) vs ${data.opponentTeam} (${data.opponentTeamScore})</div>
          <p>Date: ${data.game.date}</p>
          <p>Win Spread: ${data.winSpread}</p>
          <p>Table Rank Spread: ${data.tableRankSpread}</p>
          <p>Win Spread Z-Score: ${winSpreadZScore}</p>
          <p>Table Rank Spread Z-Score: ${tableRankSpreadZScore}</p>
          <p>Game Impressiveness: ${gameImpressiveness}</p>
          <p>Adjusted Game Impressiveness: ${adjustedGameImpressiveness}</p>
        `;
        resultsDiv.appendChild(gameDiv);
      }

      impressivenessScoreSpan.textContent = totalAdjustedGameImpressiveness.toFixed(3);

      const impressivenessScore1 = parseFloat(document.getElementById("impressivenessScore1").textContent);
      const impressivenessScore2 = parseFloat(document.getElementById("impressivenessScore2").textContent);

      if (!isNaN(impressivenessScore1) && !isNaN(impressivenessScore2)) {
        const winProbability1 = (
          impressivenessScore1 /
          (impressivenessScore1 + impressivenessScore2)
        ).toFixed(3);
        const winProbability2 = (
          impressivenessScore2 /
          (impressivenessScore1 + impressivenessScore2)
        ).toFixed(3);

        document.getElementById("winProbability1").textContent = winProbability1;
        document.getElementById("winProbability2").textContent = winProbability2;

        // Calculate market probabilities and EV
        const marketOdds1 = parseFloat(document.getElementById(marketOddsInputId).value || 0);
        if (marketOdds1 > 1) {
          const marketProbability1 = (1 / marketOdds1).toFixed(3);
          marketWinProbabilitySpan.textContent = marketProbability1;

          const ev = ((winProbability1 - marketProbability1) * marketOdds1).toFixed(3);
          evCalculationSpan.textContent = ev;
        }
      }
    });
  };

  setupDashboard(
    "filterForm1",
    "season1",
    "team1",
    "results1",
    "impressivenessScore1",
    "winProbability1",
    "marketOdds1",
    "marketWinProbability1",
    "ev1",
    "impressivenessScore2"
  );

  setupDashboard(
    "filterForm2",
    "season2",
    "team2",
    "results2",
    "impressivenessScore2",
    "winProbability2",
    "marketOdds2",
    "marketWinProbability2",
    "ev2",
    "impressivenessScore1"
  );
})();