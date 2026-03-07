import type { Request, Response } from "express";
import { getTenantId } from "../../utils/getTenant";
import { createPlayerSchema } from "./player.types";
import { createPlayer, listPlayers } from "./player.service";

export async function listPlayersHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const players = await listPlayers(tenantId);
  return res.json(players);
}

export async function createPlayerHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);

  const parsed = createPlayerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const player = await createPlayer(tenantId, parsed.data);
  return res.status(201).json(player);
}
