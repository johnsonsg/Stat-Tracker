import { Stack, Button, Typography } from "@mui/material";

type PlayTypeSelectorProps = {
  selected?: string;
  onSelect: (playType: string) => void;
};

const playTypes = ["PASS", "RUN", "SACK", "PUNT", "FG", "PENALTY", "TURNOVER"];

export default function PlayTypeSelector({ selected, onSelect }: PlayTypeSelectorProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Play Type
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {playTypes.map((type) => (
          <Button
            key={type}
            variant={selected === type ? "contained" : "outlined"}
            color="primary"
            onClick={() => onSelect(type)}
            sx={{
              borderRadius: 999,
              px: { xs: 1.5, sm: 2.5 },
              py: { xs: 0.5, sm: 0.75 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" }
            }}
          >
            {type}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
