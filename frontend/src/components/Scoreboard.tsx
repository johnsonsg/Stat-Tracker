import { Box, Button, Stack, Typography } from "@mui/material";

type TeamSide = "home" | "away";

type ScoreboardProps = {
	homeLabel: string;
	awayLabel: string;
	homeScore: number;
	awayScore: number;
	onAdjustScore?: (team: TeamSide, delta: number) => void;
	isUpdating?: boolean;
};

const scoreButtons = [
	{ label: "+6 TD", delta: 6 },
	{ label: "+3 FG", delta: 3 },
	{ label: "+2 2PT", delta: 2 },
	{ label: "+1 PAT", delta: 1 },
	{ label: "-1", delta: -1 },
	{ label: "-2", delta: -2 },
	{ label: "-3", delta: -3 },
	{ label: "-6", delta: -6 }
];

export default function Scoreboard({
	homeLabel,
	awayLabel,
	homeScore,
	awayScore,
	onAdjustScore,
	isUpdating = false
}: ScoreboardProps) {
	const renderRow = (label: string, score: number, team: TeamSide) => (
		<Stack
			direction={{ xs: "column", sm: "row" }}
			spacing={2}
			alignItems={{ xs: "flex-start", sm: "center" }}
		>
			<Box sx={{ flex: 1, minWidth: 180 }}>
				<Typography variant="subtitle2" color="text.secondary">
					{team === "home" ? "Home" : "Away"}
				</Typography>
				<Typography variant="h6">{label}</Typography>
			</Box>
			<Typography variant="h4" sx={{ minWidth: 56 }}>
				{score}
			</Typography>
			<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
				{scoreButtons.map((button) => (
					<Button
						key={`${team}-${button.label}`}
						size="small"
						variant="outlined"
						onClick={() => onAdjustScore?.(team, button.delta)}
						disabled={isUpdating}
						sx={{ borderRadius: 999 }}
					>
						{button.label}
					</Button>
				))}
			</Stack>
		</Stack>
	);

	return (
		<Box sx={{ p: 2 }}>
			<Stack spacing={2}>
				{renderRow(homeLabel, homeScore, "home")}
				{renderRow(awayLabel, awayScore, "away")}
			</Stack>
		</Box>
	);
}
