import { Player } from "../modules/players/player.model";

export const playerRepository = {
  findByTenant(tenantId: string) {
    return Player.find({ tenantId }).lean();
  }
};
