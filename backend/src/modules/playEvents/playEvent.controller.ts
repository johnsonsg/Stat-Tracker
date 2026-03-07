import mongoose from "mongoose";
import type { Request, Response } from "express";
import { getTenantId } from "../../utils/getTenant";
import { updatePlayEventSchema, createPlayEventSchema } from "./playEvent.types";
import { createPlayEvent, listPlayEvents, updatePlayEvent } from "./playEvent.service";
import { recomputeGameStats } from "../stats/statEngine.service";

export async function listPlayEventsHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const gameId = req.params.gameId;
  if (!mongoose.isValidObjectId(gameId)) {
    return res.status(400).json({ error: "Invalid gameId" });
  }
  try {
    const plays = await listPlayEvents(tenantId, gameId);
    return res.json(plays);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load plays";
    const status = message === "Game not found" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
}

export async function createPlayEventHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const gameId = req.params.gameId;
  if (!mongoose.isValidObjectId(gameId)) {
    return res.status(400).json({ error: "Invalid gameId" });
  }

  const parsed = createPlayEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const play = await createPlayEvent(tenantId, gameId, parsed.data);
    return res.status(201).json(play);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record play";
    const status = message === "Game not found" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
}

export async function updatePlayEventHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const gameId = req.params.gameId;
  const playId = req.params.playId;
  if (!mongoose.isValidObjectId(gameId)) {
    return res.status(400).json({ error: "Invalid gameId" });
  }

  const parsed = updatePlayEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const play = await updatePlayEvent(tenantId, gameId, playId, parsed.data);
    await recomputeGameStats(tenantId, gameId);
    return res.json(play);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update play";
    const status = message === "Game not found" ? 404 : message === "Play not found" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
}
