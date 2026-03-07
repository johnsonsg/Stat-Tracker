import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useTeamData } from "@/state/useTeamData";

export default function RosterSchedule() {
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Position</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>{player.number}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.position}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Opponent</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>{game.opponent}</TableCell>
                  <TableCell>{new Date(game.dateTime).toLocaleString()}</TableCell>
                  <TableCell>{game.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
