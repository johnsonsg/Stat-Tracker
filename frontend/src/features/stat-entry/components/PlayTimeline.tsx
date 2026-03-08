import { Box, ButtonBase, Chip, Paper, Stack, Typography } from "@mui/material";

type PlaySummary = {
  id: string;
  sequence: number;
  label: string;
  yards: number;
  note?: string;
};

type PlayTimelineProps = {
  plays: PlaySummary[];
  selectedId?: string | null;
  onSelect?: (playId: string) => void;
};

export default function PlayTimeline({ plays, selectedId, onSelect }: PlayTimelineProps) {
  return (
    <Paper elevation={1} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Play Timeline
      </Typography>
      <Stack spacing={1} sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {plays.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No plays yet.
          </Typography>
        )}
        {plays.map((play) => {
          const isSelected = selectedId === play.id;
          const note = play.note?.toLowerCase() ?? "";
          const label = play.label.toLowerCase();
          const isIncomplete = note === "incomplete" || label.includes("inc");
          const isTouchdown = note === "touchdown" || label.includes("td");
          const isInterception = note === "int" || label.includes("int");
          const isFumble = note === "fumble" || label.includes("fumble");
          return (
            <Box
              key={play.id}
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                pb: 1,
                bgcolor: isSelected ? "action.selected" : "transparent",
                borderRadius: 1
              }}
            >
              <ButtonBase
                onClick={() => onSelect?.(play.id)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.5,
                  width: "100%",
                  px: 1,
                  py: 0.75
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {play.sequence}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {play.label}
                  </Typography>
                  {isTouchdown && <Chip label="TD" size="small" color="success" />}
                  {isInterception && <Chip label="INT" size="small" color="error" />}
                  {isFumble && <Chip label="FUMBLE" size="small" color="warning" />}
                  {isIncomplete && <Chip label="INC" size="small" color="info" />}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {play.yards} yards
                </Typography>
                {play.note && (
                  <Typography variant="caption" color="text.secondary">
                    {play.note}
                  </Typography>
                )}
              </ButtonBase>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
