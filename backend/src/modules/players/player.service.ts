import { Player } from "./player.model";
import type { CreatePlayerInput } from "./player.types";

export async function listPlayers(tenantId: string) {
  return Player.find({ tenantId }).lean();
}

export async function createPlayer(tenantId: string, input: CreatePlayerInput) {
  return Player.create({ tenantId, ...input });
}
