import { Box, Button, Divider, Stack, Typography, useTheme } from "@mui/material";

type TeamSide = "home" | "away";

type ScoreboardProps = {
	teamLabel: string;
	teamLogoUrl?: string | null;
	opponentName: string;
	opponentLogoUrl?: string | null;
	teamScore: number;
	opponentScore: number;
	teamSide: TeamSide;
	gameState: {
		quarter: number;
		clock: string;
		down?: number;
		distance?: number;
		yardLine?: number;
	};
	onAdjustScore?: (team: TeamSide, delta: number) => void;
	isUpdating?: boolean;
	isLive?: boolean;
};

const scoreButtons = [
	{ label: "+6", delta: 6 },
	{ label: "+3", delta: 3 },
	{ label: "+2", delta: 2 },
	{ label: "+1", delta: 1 },
	{ label: "-1", delta: -1 },
	{ label: "-2", delta: -2 },
	{ label: "-3", delta: -3 },
	{ label: "-6", delta: -6 }
];

export default function Scoreboard({
	teamLabel,
	teamLogoUrl,
	opponentName,
	opponentLogoUrl,
	teamScore,
	opponentScore,
	teamSide,
	gameState,
	onAdjustScore,
	isUpdating = false,
	isLive = false
}: ScoreboardProps) {
	const theme = useTheme();
	const monoFont =
		"'Geist Mono','Geist Mono Fallback',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace";
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
		const opponentBg = theme.palette.mode === "light" ? "#1E2A3B" : "#0B1220";
		return (
			<Box
				sx={{
					width: 44,
					height: 44,
					borderRadius: "50%",
					bgcolor: isTeam ? "primary.main" : opponentBg,
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
		<Typography
			variant="h4"
			sx={{ minWidth: 44, textAlign: "center", fontWeight: 700, fontFamily: monoFont }}
		>
			{value}
		</Typography>
	);

	const renderButtons = (team: TeamSide) => (
		<Stack
			direction="row"
			spacing={1}
			flexWrap={{ xs: "wrap", md: "nowrap" }}
			useFlexGap
			sx={{ overflowX: { xs: "visible", md: "auto" }, pb: { xs: 0, md: 0.25 } }}
		>
			{scoreButtons.map((button) => (
				<Button
					key={`${team}-${button.label}`}
					size="small"
					variant="outlined"
					onClick={() => onAdjustScore?.(team, button.delta)}
					disabled={isUpdating}
					sx={{
						borderRadius: 1,
						px: { xs: 1, sm: 1.25 },
						py: { xs: 0.5, sm: 0.75 },
						minWidth: 0,
						fontFamily: monoFont,
						fontSize: { xs: "0.75rem", sm: "0.875rem" }
					}}
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
		<Box
			sx={{
				p: { xs: 1.5, sm: 2 },
				borderRadius: 2,
				bgcolor: "background.paper",
				border: "1px solid",
				borderColor: "divider",
				boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)"
			}}
		>
			<Stack spacing={2}>
				<Stack
					direction={{ xs: "column", md: "row" }}
					alignItems={{ xs: "flex-start", md: "center" }}
					justifyContent="space-between"
					spacing={2}
				>
					<Stack direction="row" spacing={1.5} alignItems="center">
						{renderBadge(teamLabel, teamLogoUrl, "team")}
						<Box>
							<Typography variant="subtitle2">{teamLabel}</Typography>
						</Box>
					</Stack>
					<Stack
						direction="row"
						spacing={2}
						alignItems="center"
						sx={{ alignSelf: { xs: "center", md: "auto" } }}
					>
						{renderScore(teamScore)}
						<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
							{isLive ? liveBadge : null}
							<Typography variant="body1" color="text.secondary">
								vs
							</Typography>
						</Box>
						{renderScore(opponentScore)}
					</Stack>
					<Stack direction="row" spacing={1.5} alignItems="center">
						<Box sx={{ textAlign: { xs: "left", md: "right" } }}>
							<Typography variant="subtitle2">{opponentName}</Typography>
						</Box>
						{renderBadge(opponentName, opponentLogoUrl, "opponent")}
					</Stack>
				</Stack>
				<Divider sx={{ borderColor: "#0F182A" }} />
				<Stack
					direction={{ xs: "column", md: "row" }}
					justifyContent="space-between"
					spacing={2}
				>
					<Stack spacing={1} alignItems={{ xs: "flex-start", md: "center" }}>
						<Typography variant="caption" color="text.secondary">
							{teamLabel}
						</Typography>
						{renderButtons(teamSide)}
					</Stack>
					<Stack spacing={1} alignItems={{ xs: "flex-start", md: "center" }}>
						<Typography variant="caption" color="text.secondary">
							{opponentName}
						</Typography>
						{renderButtons(opponentSide)}
					</Stack>
				</Stack>
				<Divider sx={{ borderColor: "#0F182A" }} />
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={2}
					justifyContent="space-between"
				>
					<Stack spacing={0.5}>
						<Typography variant="caption" color="text.secondary">
							Quarter
						</Typography>
						<Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: monoFont }}>
							{gameState.quarter}
						</Typography>
					</Stack>
					<Stack spacing={0.5}>
						<Typography variant="caption" color="text.secondary">
							Clock
						</Typography>
						<Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: monoFont }}>
							{gameState.clock}
						</Typography>
					</Stack>
					<Stack spacing={0.5}>
						<Typography variant="caption" color="text.secondary">
							Down
						</Typography>
						<Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: monoFont }}>
							{gameState.down ?? "-"}
						</Typography>
					</Stack>
					<Stack spacing={0.5}>
						<Typography variant="caption" color="text.secondary">
							Distance
						</Typography>
						<Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: monoFont }}>
							{gameState.distance ?? "-"}
						</Typography>
					</Stack>
					<Stack spacing={0.5}>
						<Typography variant="caption" color="text.secondary">
							Yard Line
						</Typography>
						<Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: monoFont }}>
							{gameState.yardLine ?? "-"}
						</Typography>
					</Stack>
				</Stack>
			</Stack>
		</Box>
	);
}
