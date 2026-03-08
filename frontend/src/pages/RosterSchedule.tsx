import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useTeamData } from "@/state/useTeamData";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

export default function RosterSchedule() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { teamData, loading, error } = useTeamData();

  if (loading || !teamData) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <CircularProgress />
      </Stack>
    );
  }

  const players = teamData.players;
  const schedule = teamData.schedule;

  const rosterColumns: GridColDef[] = [
    { field: "number", headerName: "#", width: 90, minWidth: 90 },
    { field: "name", headerName: "Name", width: 240, minWidth: 240 },
    { field: "position", headerName: "Position", width: 140, minWidth: 140 }
  ];

  const scheduleColumns: GridColDef[] = [
    { field: "opponent", headerName: "Opponent", width: 220, minWidth: 220 },
    { field: "dateTime", headerName: "Date", width: 220, minWidth: 220 },
    { field: "location", headerName: "Location", width: 160, minWidth: 160 }
  ];

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Roster
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {players.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No players yet.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto", height: 320 }}>
            <DataGrid
              rows={players.map((player) => ({
                id: player.id,
                number: player.number,
                name: player.name,
                position: player.position
              }))}
              columns={rosterColumns}
              hideFooter
              disableRowSelectionOnClick
              density={isSmall ? "compact" : "standard"}
              sx={{ border: 0, width: "100%", minWidth: 470 }}
            />
          </Box>
        )}
      </Paper>

      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" gutterBottom>
            Schedule
          </Typography>
          <Chip size="small" label={`${schedule.length} games`} />
        </Box>
        <Divider sx={{ mb: 2 }} />
        {schedule.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No games on the schedule yet.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto", height: 360 }}>
            <DataGrid
              rows={schedule.map((game) => ({
                id: game.id,
                opponent: game.opponent,
                dateTime: new Date(game.dateTime).toLocaleString(),
                location: game.location
              }))}
              columns={scheduleColumns}
              hideFooter
              disableRowSelectionOnClick
              density={isSmall ? "compact" : "standard"}
              sx={{ border: 0, width: "100%", minWidth: 600 }}
            />
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
