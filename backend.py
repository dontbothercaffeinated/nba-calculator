from flask import Flask, jsonify, request
from flask_cors import CORS
from nba_api.stats.static import teams
from nba_api.stats.endpoints import LeagueGameFinder

app = Flask(__name__)
CORS(app)

@app.route('/api/teams', methods=['GET'])
def get_teams():
    # Fetch all teams
    nba_teams = teams.get_teams()

    # Only include active teams
    active_teams = [
        {"id": team["id"], "name": team["full_name"]}
        for team in nba_teams
    ]

    return jsonify(active_teams)

@app.route('/api/games', methods=['GET'])
def get_games():
    # Get the team ID from the request parameters
    team_id = request.args.get('team_id')
    if not team_id:
        return jsonify({"error": "team_id is required"}), 400

    try:
        # Fetch games for the team
        game_finder = LeagueGameFinder(team_id_nullable=team_id)
        games = game_finder.get_data_frames()[0]

        # Debug: Print column names
        print("Column names in the games DataFrame:")
        print(games.columns.tolist())

        # Calculate PTS_OPP (opponent points)
        games['PTS_OPP'] = games['PTS'] - games['PLUS_MINUS']

        # Handle NaN values by replacing them with 0
        games.fillna(0, inplace=True)

        # Filter and format the game data
        formatted_games = games[[
            'GAME_DATE', 'MATCHUP', 'PTS', 'PTS_OPP'
        ]].rename(columns={
            'GAME_DATE': 'date',
            'MATCHUP': 'matchup',
            'PTS': 'team_score',
            'PTS_OPP': 'opponent_score'
        })

        return jsonify(formatted_games.to_dict(orient='records'))
    except Exception as e:
        # Log the exact error for debugging
        print(f"Error fetching games for team_id {team_id}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)