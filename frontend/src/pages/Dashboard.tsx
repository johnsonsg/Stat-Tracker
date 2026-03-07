import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { useAuth } from "@clerk/clerk-react";

type GameSummary = {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  status: string;
  season?: number;
};

export default function Dashboard() {
  const { getToken } = useAuth();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadGames = async () => {
      setLoading(true);
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
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadGames();
    return () => {
      isMounted = false;
    };
  }, [getToken]);

  const sortedGames = useMemo(() => {
    return [...games].sort(
      (a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
    );
  }, [games]);

  const recentGames = sortedGames.slice(0, 5);
  const upcomingGame = useMemo(() => {
    const now = new Date().getTime();
    const futureGames = games
      .filter((game) => new Date(game.gameDate).getTime() >= now)
      .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());
    return futureGames[0] ?? null;
  }, [games]);

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quick snapshot of recent activity and upcoming games.
        </Typography>
      </Paper>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper elevation={1} sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Total games
          </Typography>
          <Typography variant="h5">{loading ? "..." : games.length}</Typography>
        </Paper>
        <Paper elevation={1} sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Next game
          </Typography>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : upcomingGame ? (
            <Box>
              <Typography variant="subtitle1">
                {upcomingGame.homeTeam} vs {upcomingGame.awayTeam}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(upcomingGame.gameDate).toLocaleString()}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No upcoming games.
            </Typography>
          )}
        </Paper>
      </Stack>
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Recent games
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading games...
          </Typography>
        )}
        {!loading && recentGames.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No games yet.
          </Typography>
        )}
        <Stack spacing={1.5}>
          {recentGames.map((game) => (
            <Box key={game._id} sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="subtitle1">
                  {game.homeTeam} vs {game.awayTeam}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(game.gameDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={game.status}
                color={game.status === "live" ? "success" : "default"}
              />
            </Box>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
