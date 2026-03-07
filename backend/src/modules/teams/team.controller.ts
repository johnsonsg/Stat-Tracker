import type { Request, Response } from "express";
import { getTenantId } from "../../utils/getTenant";
import { createTeamSchema } from "./team.types";
import { createTeam, listTeams } from "./team.service";

export async function listTeamsHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const teams = await listTeams(tenantId);
  return res.json(teams);
}

export async function createTeamHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);

  const parsed = createTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const team = await createTeam(tenantId, parsed.data);
  return res.status(201).json(team);
}
