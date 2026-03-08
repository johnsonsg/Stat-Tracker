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
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useAuth } from "@clerk/clerk-react";
import { useTeamData } from "@/state/useTeamData";

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
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { getToken } = useAuth();
  const { teamData } = useTeamData();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [stats, setStats] = useState<PlayerGameStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns: GridColDef[] = [
    { field: "playerName", headerName: "Player", width: 220, minWidth: 220 },
    { field: "passing", headerName: "Pass", type: "number", width: 75, minWidth: 75, maxWidth: 75 },
    { field: "rushing", headerName: "Rush", type: "number", width: 75, minWidth: 75, maxWidth: 75 },
    { field: "receiving", headerName: "Recv", type: "number", width: 75, minWidth: 75, maxWidth: 75 },
    { field: "tackles", headerName: "Tackles", type: "number", width: 75, minWidth: 75, maxWidth: 75 },
    { field: "sacks", headerName: "Sacks", type: "number", width: 75, minWidth: 75, maxWidth: 75 },
    { field: "interceptions", headerName: "INT", type: "number", width: 75, minWidth: 75, maxWidth: 75 },
    { field: "tds", headerName: "TD", type: "number", width: 75, minWidth: 75, maxWidth: 75 }
  ];

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
              Select a tracked game to review stat totals. Roster lives in Roster & Schedule.
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
        <Box sx={{ width: "100%", overflowX: "auto", height: 420 }}>
          <DataGrid
            rows={stats.map((row) => ({
              id: row._id,
              playerName:
                teamData?.players.find((player) => player.id === row.playerId)?.name ??
                row.playerId,
              passing: row.passing ?? 0,
              rushing: row.rushing ?? 0,
              receiving: row.receiving ?? 0,
              tackles: row.tackles ?? 0,
              sacks: row.sacks ?? 0,
              interceptions: row.interceptions ?? 0,
              tds: row.tds ?? 0
            }))}
            columns={columns}
            loading={loading}
            hideFooter
            disableRowSelectionOnClick
            density={isSmall ? "compact" : "standard"}
            slots={{
              noRowsOverlay: () => (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No stats yet for this game.
                </Typography>
              )
            }}
            sx={{ border: 0, width: "100%", minWidth: 725 }}
          />
        </Box>
      </Paper>
    </Stack>
  );
}
