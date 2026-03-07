import { Stack, Button, Typography } from "@mui/material";

type Player = {
  id: string;
  number: string;
  position: string;
  name: string;
};

type QuickRosterProps = {
  title: string;
  players: Player[];
  onSelect: (player: Player) => void;
};

export default function QuickRoster({ title, players, onSelect }: QuickRosterProps) {
  if (players.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {players.map((player) => (
          <Button
            key={player.id}
            variant="outlined"
            size="small"
            onClick={() => onSelect(player)}
            sx={{ borderRadius: 999 }}
          >
            #{player.number} {player.position}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
