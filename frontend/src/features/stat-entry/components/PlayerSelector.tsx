import { Box, ButtonBase, Paper, Stack, Typography } from "@mui/material";

type Player = {
  id: string;
  number: string;
  position: string;
  name: string;
};

type PlayerSelectorProps = {
  title: string;
  players: Player[];
  selected?: Player | null;
  secondarySelected?: Player | null;
  roleLabels?: (player: Player) => string[];
  onSelect: (player: Player) => void;
};

export default function PlayerSelector({
  title,
  players,
  selected,
  secondarySelected,
  roleLabels,
  onSelect
}: PlayerSelectorProps) {
  return (
    <Stack spacing={1.5}>
      {title ? (
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      ) : null}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }
        }}
      >
        {players.map((player) => {
          const isSelectedPrimary = selected?.id === player.id;
          const isSelectedSecondary = secondarySelected?.id === player.id;
          const labels = roleLabels?.(player) ?? [];
          return (
            <Paper
              key={player.id}
              elevation={isSelectedPrimary || isSelectedSecondary ? 3 : 1}
              sx={{
                border: "1px solid",
                borderColor: isSelectedPrimary
                  ? "primary.main"
                  : isSelectedSecondary
                  ? "primary.main"
                  : "divider",
                bgcolor: isSelectedPrimary
                  ? "primary.soft"
                  : isSelectedSecondary
                  ? "primary.main"
                  : "background.paper",
                borderRadius: 2,
                position: "relative"
              }}
            >
              {isSelectedPrimary && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    borderRadius: 999,
                    px: 0.75,
                    py: 0.2,
                    fontSize: "0.65rem",
                    fontWeight: 700
                  }}
                >
                  P
                </Box>
              )}
              {isSelectedSecondary && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: isSelectedPrimary ? 28 : 6,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    borderRadius: 999,
                    px: 0.75,
                    py: 0.2,
                    fontSize: "0.65rem",
                    fontWeight: 700
                  }}
                >
                  S
                </Box>
              )}
              <ButtonBase
                onClick={() => onSelect(player)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  p: { xs: 1.25, sm: 2 },
                  width: "100%"
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  #{player.number}
                </Typography>
                {labels.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                    {labels.map((label) => (
                      <Box
                        key={`${player.id}-${label}`}
                        sx={{
                          px: 0.6,
                          py: 0.1,
                          borderRadius: 999,
                          bgcolor: "action.selected",
                          fontSize: "0.6rem",
                          fontWeight: 700
                        }}
                      >
                        {label}
                      </Box>
                    ))}
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  {player.position}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {player.name}
                </Typography>
              </ButtonBase>
            </Paper>
          );
        })}
      </Box>
    </Stack>
  );
}
