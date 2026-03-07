import { Box, ButtonBase, Paper, Stack, Typography } from "@mui/material";

type Player = {
  id: string;
  number: number;
  position: string;
  name: string;
};

type PlayerSelectorProps = {
  title: string;
  players: Player[];
  selected?: Player | null;
  onSelect: (player: Player) => void;
};

export default function PlayerSelector({ title, players, selected, onSelect }: PlayerSelectorProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }
        }}
      >
        {players.map((player) => {
          const isSelected = selected?.id === player.id;
          return (
            <Paper
              key={player.id}
              elevation={isSelected ? 3 : 1}
              sx={{
                border: "1px solid",
                borderColor: isSelected ? "primary.main" : "divider",
                bgcolor: isSelected ? "primary.soft" : "background.paper",
                borderRadius: 2
              }}
            >
              <ButtonBase
                onClick={() => onSelect(player)}
                sx={{ display: "flex", flexDirection: "column", p: 2, width: "100%" }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  #{player.number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {player.position}
                </Typography>
                <Typography variant="caption" color="text.secondary">
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
