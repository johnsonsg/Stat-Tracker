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
  const monoFont =
    "'Geist Mono','Geist Mono Fallback',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace";

  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 1.5, sm: 2 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)"
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Play Timeline
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: monoFont }}>
          {plays.length} plays
        </Typography>
      </Stack>
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          pr: 1,
          "&::before": {
            content: '""',
            position: "absolute",
            left: 12,
            top: 4,
            bottom: 4,
            width: 2,
            bgcolor: "divider",
            borderRadius: 999
          }
        }}
      >
        {plays.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No plays yet.
          </Typography>
        )}
        <Stack spacing={1.5} sx={{ pl: 3 }}>
          {plays.map((play) => {
            const isSelected = selectedId === play.id;
            const note = play.note?.toLowerCase() ?? "";
            const label = play.label.toLowerCase();
            const isIncomplete = note === "incomplete" || label.includes("inc");
            const isTouchdown = note === "touchdown" || label.includes("td");
            const isInterception = note === "int" || label.includes("int");
            const isFumble = note === "fumble" || label.includes("fumble");
            return (
              <ButtonBase
                key={play.id}
                onClick={() => onSelect?.(play.id)}
                sx={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  bgcolor: isSelected ? "action.selected" : "background.paper",
                  px: 1.5,
                  py: 1,
                  display: "flex",
                  gap: 2,
                  alignItems: "stretch"
                }}
              >
                <Stack alignItems="center" spacing={0.5} sx={{ pt: 0.25, minWidth: 28 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: isSelected ? "primary.main" : "text.secondary"
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: monoFont }}>
                    {play.sequence}
                  </Typography>
                </Stack>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {play.label}
                    </Typography>
                    {isTouchdown && <Chip label="TD" size="small" color="success" />}
                    {isInterception && <Chip label="INT" size="small" color="error" />}
                    {isFumble && <Chip label="FUMBLE" size="small" color="warning" />}
                    {isIncomplete && <Chip label="INC" size="small" color="info" />}
                  </Stack>
                  {play.note && (
                    <Typography variant="caption" color="text.secondary">
                      {play.note}
                    </Typography>
                  )}
                </Stack>
                <Stack alignItems="flex-end" spacing={0.25} sx={{ minWidth: 60 }}>
                  <Typography variant="h6" sx={{ fontFamily: monoFont, fontWeight: 700 }}>
                    {play.yards}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    yds
                  </Typography>
                </Stack>
              </ButtonBase>
            );
          })}
        </Stack>
      </Box>
    </Paper>
  );
}
