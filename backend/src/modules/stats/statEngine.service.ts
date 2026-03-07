import { PlayerGameStats } from "./playerGameStats.model";
import { TeamGameStats } from "./teamGameStats.model";

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
  return PlayerGameStats.find({ tenantId, gameId }).lean();
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
  return TeamGameStats.findOne({ tenantId, gameId }).lean();
}
