import type { Request, Response } from "express";
import { getTenantId } from "../../utils/getTenant";
import { createGameSchema } from "./game.types";
import { createGame, listGames } from "./game.service";

export async function listGamesHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const games = await listGames(tenantId);
  return res.json(games);
}

export async function createGameHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);

  const parsed = createGameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const game = await createGame(tenantId, parsed.data);
  return res.status(201).json(game);
}
