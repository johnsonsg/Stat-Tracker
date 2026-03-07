import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";

type GameSummary = {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  status: string;
};

type PlayerGameStat = {
  _id: string;
  playerId: string;
  passing?: number;
  rushing?: number;
  receiving?: number;
  tackles?: number;
  sacks?: number;
  interceptions?: number;
  tds?: number;
};

export default function Players() {
  const { getToken } = useAuth();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [stats, setStats] = useState<PlayerGameStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadGames = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }
        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBase}/api/games`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to load games");
        }
        const data = (await response.json()) as GameSummary[];
        if (isMounted) {
          setGames(data);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load games";
          setError(message);
        }
      }
    };

    void loadGames();
    return () => {
      isMounted = false;
    };
  }, [getToken]);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      if (!selectedGameId) {
        setStats([]);
        return;
      }

      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }
        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
        const response = await fetch(
          `${apiBase}/api/stats/player-game?gameId=${selectedGameId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to load player stats");
        }
        const data = (await response.json()) as PlayerGameStat[];
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load player stats";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStats();
    return () => {
      isMounted = false;
    };
  }, [getToken, selectedGameId]);

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Player stats by game
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a game to review player stat totals.
            </Typography>
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel id="players-game-select">Game</InputLabel>
            <Select
              labelId="players-game-select"
              label="Game"
              value={selectedGameId}
              onChange={(event) => setSelectedGameId(event.target.value)}
            >
              {games.map((game) => (
                <MenuItem key={game._id} value={game._id}>
                  {game.homeTeam} vs {game.awayTeam} ·
                  {new Date(game.gameDate).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Player totals
        </Typography>
        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading stats...
          </Typography>
        )}
        {!loading && stats.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No stats yet for this game.
          </Typography>
        )}
        {!loading && stats.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Player ID</TableCell>
                <TableCell align="right">Pass</TableCell>
                <TableCell align="right">Rush</TableCell>
                <TableCell align="right">Recv</TableCell>
                <TableCell align="right">Tackles</TableCell>
                <TableCell align="right">Sacks</TableCell>
                <TableCell align="right">INT</TableCell>
                <TableCell align="right">TD</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.playerId}</TableCell>
                  <TableCell align="right">{row.passing ?? 0}</TableCell>
                  <TableCell align="right">{row.rushing ?? 0}</TableCell>
                  <TableCell align="right">{row.receiving ?? 0}</TableCell>
                  <TableCell align="right">{row.tackles ?? 0}</TableCell>
                  <TableCell align="right">{row.sacks ?? 0}</TableCell>
                  <TableCell align="right">{row.interceptions ?? 0}</TableCell>
                  <TableCell align="right">{row.tds ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
