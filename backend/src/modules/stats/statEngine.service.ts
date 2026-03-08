import mongoose from "mongoose";
import { PlayEvent } from "../playEvents/playEvent.model";
import { PlayerGameStats } from "./playerGameStats.model";
import { TeamGameStats } from "./teamGameStats.model";

type PlayerStatTotals = {
  passing: number;
  passingAttempts: number;
  passingCompletions: number;
  rushing: number;
  receiving: number;
  tackles: number;
  sacks: number;
  interceptions: number;
  tds: number;
};

const emptyPlayerTotals = (): PlayerStatTotals => ({
  passing: 0,
  passingAttempts: 0,
  passingCompletions: 0,
  rushing: 0,
  receiving: 0,
  tackles: 0,
  sacks: 0,
  interceptions: 0,
  tds: 0
});

const emptyTeamTotals = () => ({
  pointsFor: 0,
  pointsAgainst: 0,
  totalYards: 0,
  penalties: 0,
  turnovers: 0
});

export type PlayEventLike = {
  playType?: string;
  yards?: number;
  touchdown?: boolean;
  turnover?: boolean;
  players?: {
    passerId?: string | null;
    receiverId?: string | null;
    rusherId?: string | null;
    tacklerId?: string | null;
  } | null;
};

export function computeStatsFromPlays(plays: PlayEventLike[]) {
  const teamTotals = emptyTeamTotals();
  const playerTotals = new Map<string, PlayerStatTotals>();

  const getPlayerTotals = (playerId?: string | null) => {
    if (!playerId) {
      return undefined;
    }
    const existing = playerTotals.get(playerId);
    if (existing) {
      return existing;
    }
    const next = emptyPlayerTotals();
    playerTotals.set(playerId, next);
    return next;
  };

  for (const play of plays) {
    const playType = play.playType?.toLowerCase() ?? "";
    const yards = typeof play.yards === "number" ? play.yards : 0;
    const touchdown = Boolean(play.touchdown);
    const turnover = Boolean(play.turnover);

    if (playType !== "penalty") {
      teamTotals.totalYards += yards;
    } else {
      teamTotals.penalties += 1;
    }

    if (turnover) {
      teamTotals.turnovers += 1;
    }
    if (touchdown) {
      teamTotals.pointsFor += 6;
    }

    const passer = getPlayerTotals(play.players?.passerId);
    const receiver = getPlayerTotals(play.players?.receiverId);
    const rusher = getPlayerTotals(play.players?.rusherId);
    const tackler = getPlayerTotals(play.players?.tacklerId);

    if (playType === "pass" || playType === "incomplete") {
      if (passer) {
        passer.passingAttempts += 1;
      }
      const isCompletion = playType === "pass" && Boolean(receiver) && !turnover;
      if (isCompletion && passer) {
        passer.passingCompletions += 1;
      }
      if (playType === "pass") {
        if (passer) {
          passer.passing += yards;
        }
        if (receiver) {
          receiver.receiving += yards;
        }
        if (touchdown) {
          if (passer) {
            passer.tds += 1;
          }
          if (receiver) {
            receiver.tds += 1;
          }
        }
        if (turnover && tackler) {
          tackler.interceptions += 1;
        }
      }
    } else if (playType === "run") {
      if (rusher) {
        rusher.rushing += yards;
        if (touchdown) {
          rusher.tds += 1;
        }
      }
    } else if (playType === "sack") {
      if (tackler) {
        tackler.sacks += 1;
        tackler.tackles += 1;
      }
    } else if (playType === "turnover") {
      if (tackler) {
        tackler.tackles += 1;
      }
    }
  }

  return { teamTotals, playerTotals };
}

export async function upsertPlayerGameStats(
  tenantId: string,
  gameId: string,
  playerId: string,
  stats: Record<string, number>
) {
  return PlayerGameStats.findOneAndUpdate(
    { tenantId, gameId, playerId },
    { $set: stats },
    { upsert: true, new: true }
  ).lean();
}

export async function listPlayerGameStats(tenantId: string, gameId: string) {
  if (!mongoose.isValidObjectId(gameId)) {
    throw new Error("Invalid gameId");
  }
  const objectId = new mongoose.Types.ObjectId(gameId);
  return PlayerGameStats.find({ tenantId, gameId: objectId }).lean();
}

export async function upsertTeamGameStats(
  tenantId: string,
  gameId: string,
  stats: Record<string, number>
) {
  return TeamGameStats.findOneAndUpdate(
    { tenantId, gameId },
    { $set: stats },
    { upsert: true, new: true }
  ).lean();
}

export async function getTeamGameStats(tenantId: string, gameId: string) {
  if (!mongoose.isValidObjectId(gameId)) {
    throw new Error("Invalid gameId");
  }
  const objectId = new mongoose.Types.ObjectId(gameId);
  return TeamGameStats.findOne({ tenantId, gameId: objectId }).lean();
}

export async function recomputeGameStats(tenantId: string, gameId: string) {
  if (!mongoose.isValidObjectId(gameId)) {
    throw new Error("Invalid gameId");
  }

  const objectId = new mongoose.Types.ObjectId(gameId);
  const plays = await PlayEvent.find({ tenantId, gameId: objectId }).lean();
  const { teamTotals, playerTotals } = computeStatsFromPlays(plays);

  await PlayerGameStats.deleteMany({ tenantId, gameId: objectId });
  await TeamGameStats.deleteMany({ tenantId, gameId: objectId });

  const playerUpdates = Array.from(playerTotals.entries()).map(([playerId, stats]) =>
    PlayerGameStats.updateOne(
      { tenantId, gameId: objectId, playerId },
      { $set: stats },
      { upsert: true }
    )
  );

  await Promise.all([
    TeamGameStats.updateOne(
      { tenantId, gameId: objectId },
      { $set: teamTotals },
      { upsert: true }
    ),
    ...playerUpdates
  ]);

  return { teamTotals, playerCount: playerTotals.size };
}
