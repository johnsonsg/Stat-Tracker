import { Box, Button, Stack, Typography } from "@mui/material";

type TeamSide = "home" | "away";

type ScoreboardProps = {
	teamLabel: string;
	teamLogoUrl?: string | null;
	opponentName: string;
	teamScore: number;
	opponentScore: number;
	teamSide: TeamSide;
	onAdjustScore?: (team: TeamSide, delta: number) => void;
	isUpdating?: boolean;
	isLive?: boolean;
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
	teamLabel,
	teamLogoUrl,
	opponentName,
	teamScore,
	opponentScore,
	teamSide,
	onAdjustScore,
	isUpdating = false,
	isLive = false
}: ScoreboardProps) {
	const opponentSide: TeamSide = teamSide === "home" ? "away" : "home";

	const getInitials = (value: string) => {
		const cleaned = value.replace(/[^a-zA-Z\s]/g, " ").trim();
		if (!cleaned) {
			return "?";
		}
		const parts = cleaned.split(/\s+/).filter(Boolean);
		const first = parts[0]?.[0] ?? "";
		const second = parts[1]?.[0] ?? "";
		return `${first}${second}`.toUpperCase();
	};

	const renderBadge = (
		label: string,
		logoUrl: string | null | undefined,
		variant: "team" | "opponent"
	) => {
		if (logoUrl) {
			return (
				<Box
					component="img"
					src={logoUrl}
					alt={label}
					sx={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
				/>
			);
		}
		const isTeam = variant === "team";
		return (
			<Box
				sx={{
					width: 44,
					height: 44,
					borderRadius: "50%",
					bgcolor: isTeam ? "primary.main" : "#1E2A3B",
					color: isTeam ? "primary.contrastText" : "common.white",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontWeight: 700
				}}
			>
				{getInitials(label)}
			</Box>
		);
	};

	const renderScore = (value: number) => (
		<Typography variant="h4" sx={{ minWidth: 44, textAlign: "center" }}>
			{value}
		</Typography>
	);

	const renderButtons = (team: TeamSide) => (
		<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
			{scoreButtons.map((button) => (
				<Button
					key={`${team}-${button.label}`}
					size="small"
					variant="outlined"
					onClick={() => onAdjustScore?.(team, button.delta)}
					disabled={isUpdating}
					sx={{ borderRadius: 999, px: 1.5 }}
				>
					{button.label}
				</Button>
			))}
		</Stack>
	);

	const liveBadge = (
		<Box
			sx={{
				px: 1.5,
				py: 0.5,
				borderRadius: 999,
				bgcolor: "error.main",
				color: "error.contrastText",
				fontSize: "0.75rem",
				fontWeight: 700,
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				animation: "livePulse 2.4s ease-in-out infinite",
				"@keyframes livePulse": {
					"0%": { opacity: 0.35 },
					"50%": { opacity: 1 },
					"100%": { opacity: 0.35 }
				}
			}}
		>
			Live
		</Box>
	);

	return (
		<Box sx={{ p: 1.5 }}>
			<Stack
				direction="row"
				alignItems="center"
				spacing={2}
				flexWrap="wrap"
				useFlexGap
			>
				{renderBadge(teamLabel, teamLogoUrl, "team")}
				{renderScore(teamScore)}
				{renderButtons(teamSide)}
				{isLive ? liveBadge : null}
				{renderButtons(opponentSide)}
				{renderScore(opponentScore)}
				{renderBadge(opponentName, null, "opponent")}
			</Stack>
		</Box>
	);
}
