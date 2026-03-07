import mongoose from "mongoose";
import { PlayEvent, type PlayEventDocument } from "./playEvent.model";
import { createPlayEventSchema, type CreatePlayEventInput, type UpdatePlayEventInput } from "./playEvent.types";
import { Game, type GameDocument } from "../games/game.model";

async function getGameSeason(tenantId: string, gameId: string) {
  const objectId = new mongoose.Types.ObjectId(gameId);
  const game = await Game.findOne({ _id: objectId, tenantId }).lean<GameDocument>();
  if (!game) {
    throw new Error("Game not found");
  }

  if (typeof game.season !== "number") {
    throw new Error("Game season missing");
  }

  return { season: game.season, gameId: objectId };
}

export async function listPlayEvents(tenantId: string, gameId: string) {
  const { season, gameId: objectId } = await getGameSeason(tenantId, gameId);
  return PlayEvent.find({ tenantId, season, gameId: objectId })
    .sort({ sequence: 1 })
    .lean();
}

export async function createPlayEvent(
  tenantId: string,
  gameId: string,
  input: CreatePlayEventInput
) {
  const { season, gameId: objectId } = await getGameSeason(tenantId, gameId);
  const lastPlay = await PlayEvent.findOne({ tenantId, season, gameId: objectId })
    .sort({ sequence: -1 })
    .lean<PlayEventDocument>();

  const sequence = lastPlay?.sequence ? lastPlay.sequence + 1 : 1;
  return PlayEvent.create({ tenantId, season, gameId: objectId, sequence, ...input });
}

export async function updatePlayEvent(
  tenantId: string,
  gameId: string,
  playId: string,
  input: UpdatePlayEventInput
) {
  const { season, gameId: objectId } = await getGameSeason(tenantId, gameId);
  if (!mongoose.isValidObjectId(playId)) {
    throw new Error("Invalid playId");
  }

  const playObjectId = new mongoose.Types.ObjectId(playId);
  const existing = await PlayEvent.findOne({ _id: playObjectId, tenantId, season, gameId: objectId })
    .lean<PlayEventDocument>();
  if (!existing) {
    throw new Error("Play not found");
  }

  const merged = {
    sport: input.sport ?? existing.sport,
    quarter: input.quarter ?? existing.quarter,
    clock: input.clock ?? existing.clock,
    down: input.down ?? existing.down,
    distance: input.distance ?? existing.distance,
    yardLine: input.yardLine ?? existing.yardLine,
    playType: input.playType ?? existing.playType,
    players: input.players ?? existing.players,
    yards: input.yards ?? existing.yards,
    touchdown: input.touchdown ?? existing.touchdown,
    turnover: input.turnover ?? existing.turnover,
    notes: input.notes ?? existing.notes
  };

  const validated = createPlayEventSchema.safeParse(merged);
  if (!validated.success) {
    throw new Error("Invalid payload");
  }

  const updated = await PlayEvent.findOneAndUpdate(
    { _id: playObjectId, tenantId, season, gameId: objectId },
    { $set: validated.data },
    { new: true }
  ).lean<PlayEventDocument>();

  if (!updated) {
    throw new Error("Play not found");
  }

  return updated;
}
