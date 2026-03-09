import { Box, Button, Paper, Stack, Typography } from "@mui/material";

type PlayDisplay = {
  label: string;
  yards: number;
  touchdown?: boolean;
  turnover?: boolean;
};

type PlayConfirmationBannerProps = {
  play: PlayDisplay | null;
  onUndo: () => void;
  onEdit: () => void;
};

export default function PlayConfirmationBanner({
  play,
  onUndo,
  onEdit
}: PlayConfirmationBannerProps) {
  if (!play) {
    return null;
  }

  const meta = [
    `${play.yards} YDS`,
    play.touchdown ? "TD" : null,
    play.turnover ? "TURNOVER" : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        left: 16,
        right: 16,
        zIndex: (theme) => theme.zIndex.snackbar
      }}
    >
      <Paper
        elevation={8}
        sx={{
          bgcolor: "success.main",
          color: "common.white",
          px: 2,
          py: 1.5,
          borderRadius: 2
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {play.label}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {meta}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" color="inherit" onClick={onUndo}>
              Undo
            </Button>
            <Button variant="contained" color="inherit" onClick={onEdit}>
              Edit
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
