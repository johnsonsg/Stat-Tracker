import { Box, Paper, Typography } from "@mui/material";

type GameBarProps = {
  quarter: number;
  clock: string;
  down: number;
  distance: number;
  yardLine: number;
};

export default function GameBar({ quarter, clock, down, distance, yardLine }: GameBarProps) {
  return (
    <Paper elevation={1} sx={{ p: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" } }}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Quarter
        </Typography>
        <Typography variant="h6">{quarter}</Typography>
      </Box>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Clock
        </Typography>
        <Typography variant="h6">{clock}</Typography>
      </Box>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Down
        </Typography>
        <Typography variant="h6">{down}</Typography>
      </Box>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Distance
        </Typography>
        <Typography variant="h6">{distance}</Typography>
      </Box>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Yard Line
        </Typography>
        <Typography variant="h6">{yardLine}</Typography>
      </Box>
    </Paper>
  );
}
