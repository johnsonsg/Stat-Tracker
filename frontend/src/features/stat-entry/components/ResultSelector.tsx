import { Stack, Button, Typography } from "@mui/material";

type ResultSelectorProps = {
  onSelect: (result: string) => void;
};

const results = ["+1", "+3", "+5", "+10", "+20", "TD", "INC", "INT", "FUMBLE"];

export default function ResultSelector({ onSelect }: ResultSelectorProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Result
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {results.map((result) => (
          <Button
            key={result}
            variant="outlined"
            color="secondary"
            onClick={() => onSelect(result)}
            sx={{ borderRadius: 999, px: 2.5 }}
          >
            {result}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
