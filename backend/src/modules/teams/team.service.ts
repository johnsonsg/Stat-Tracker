import { Team } from "./team.model";
import type { CreateTeamInput } from "./team.types";

export async function listTeams(tenantId: string) {
  return Team.find({ tenantId }).lean();
}

export async function createTeam(tenantId: string, input: CreateTeamInput) {
  return Team.create({ tenantId, ...input });
}
