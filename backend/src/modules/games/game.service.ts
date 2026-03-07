import { Game } from "./game.model";
import type { CreateGameInput } from "./game.types";

export async function listGames(tenantId: string, season?: string) {
  return Game.find({ tenantId, ...(season ? { season } : {}) }).lean();
}

export async function createGame(tenantId: string, input: CreateGameInput) {
  return Game.create({ tenantId, ...input });
}
