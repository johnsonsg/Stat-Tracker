import { Game } from "../modules/games/game.model";

export const gameRepository = {
  findByTenant(tenantId: string) {
    return Game.find({ tenantId }).lean();
  }
};
