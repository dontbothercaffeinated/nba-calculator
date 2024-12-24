const API_BASE = "http://127.0.0.1:5000"; // Backend API base URL

// Fetch the list of NBA teams and populate the dropdown
async function fetchTeams() {
  try {
    const response = await fetch(`${API_BASE}/api/teams`);
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.statusText}`);
    }

    const teams = await response.json();
    const dropdown = document.getElementById("team");

    // Populate dropdown with team data
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id; // Use team ID as the value
      option.textContent = team.name; // Display team name
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    alert("Failed to load teams. Please try again later.");
  }
}

document.getElementById("fetch").addEventListener("click", async () => {
  const teamID = document.getElementById("team").value;
  if (!teamID) {
    alert("Please select a team.");
    return;
  }

  const table = document.getElementById("games-table");
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = ""; // Clear previous rows

  try {
    const response = await fetch(`${API_BASE}/api/games?team_id=${teamID}`);
    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`API error: ${errorResponse.error || response.statusText}`);
    }

    const games = await response.json();
    if (games.length === 0) {
      alert("No games found for this team.");
      return;
    }

    games.forEach((game) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(game.date).toLocaleDateString()}</td>
        <td>${game.matchup}</td>
        <td>${game.team_score}</td>
        <td>${game.opponent_score}</td>
      `;
      tbody.appendChild(row);
    });

    table.style.display = "table";
  } catch (error) {
    console.error("Error fetching games:", error);
    alert(`Error fetching games: ${error.message}`);
  }
});

// Fetch teams when the app starts
fetchTeams();