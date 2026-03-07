import { Game } from "./game.model";
import type { CreateGameInput } from "./game.types";

export async function listGames(tenantId: string) {
  return Game.find({ tenantId }).lean();
}

export async function createGame(tenantId: string, input: CreateGameInput) {
  return Game.create({ tenantId, ...input });
}

export async function updateGameStatus(
  tenantId: string,
  gameId: string,
  status: "scheduled" | "live" | "finished"
) {
  return Game.findOneAndUpdate(
    { _id: gameId, tenantId },
    { $set: { status } },
    { new: true }
  ).lean();
}
