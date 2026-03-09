import { useState } from "react";
import { Stack, Button, Typography, TextField } from "@mui/material";

type ResultSelectorProps = {
  onSelect: (result: string) => void;
};

const results = ["+1", "+3", "+5", "+10", "+15", "+20"];
const negativeResults = ["0", "-1", "-3", "-5", "-10", "-15", "-20"];

export default function ResultSelector({ onSelect }: ResultSelectorProps) {
  const [customYards, setCustomYards] = useState("");

  const submitCustomYards = () => {
    const trimmed = customYards.trim();
    if (!trimmed) return;
    const normalized = /^[-+]/.test(trimmed) ? trimmed : `+${trimmed}`;
    onSelect(normalized);
    setCustomYards("");
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
      <Stack spacing={1.5} flex={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Yards
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {results.map((result) => (
            <Button
              key={result}
              variant="outlined"
              color="success"
              onClick={() => onSelect(result)}
              sx={{
                borderRadius: 1,
                px: { xs: 1, sm: 1.25 },
                py: { xs: 0.5, sm: 0.75 },
                minWidth: 0,
                fontSize: { xs: "0.75rem", sm: "0.875rem" }
              }}
            >
              {result}
            </Button>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Negative yards
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {negativeResults.map((result) => (
            <Button
              key={result}
              variant="outlined"
              color="error"
              onClick={() => onSelect(result)}
              sx={{
                borderRadius: 1,
                px: { xs: 1, sm: 1.25 },
                py: { xs: 0.5, sm: 0.75 },
                minWidth: 0,
                fontSize: { xs: "0.75rem", sm: "0.875rem" }
              }}
            >
              {result}
            </Button>
          ))}
        </Stack>
      </Stack>
      <Stack spacing={1} sx={{ minWidth: { xs: "100%", sm: 120 } }}>
        <Typography variant="caption" color="text.secondary">
          Custom yards
        </Typography>
        <TextField
          size="small"
          placeholder="+7"
          value={customYards}
          onChange={(event) => setCustomYards(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitCustomYards();
            }
          }}
          sx={{ width: { xs: "100%", sm: 96 } }}
        />
      </Stack>
    </Stack>
  );
}
