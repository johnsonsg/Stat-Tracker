import type { Request, Response } from "express";
import { getTenantId } from "../../utils/getTenant";
import { z } from "zod";
import { createGameSchema } from "./game.types";
import { createGame, listGames, updateGameStatus } from "./game.service";
import { emitGameEvent, getSocketServer } from "../../websocket/socketServer";

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

const updateStatusSchema = z.object({
  status: z.enum(["scheduled", "live", "finished"])
});

export async function updateGameStatusHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const gameId = req.params.gameId;

  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const game = await updateGameStatus(tenantId, gameId, parsed.data.status);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  const io = getSocketServer();
  if (io) {
    const event =
      parsed.data.status === "live"
        ? "gameStarted"
        : parsed.data.status === "finished"
        ? "gameFinished"
        : "gameStatusChanged";
    emitGameEvent(io, gameId, event, { gameId, status: parsed.data.status });
  }

  return res.json(game);
}
