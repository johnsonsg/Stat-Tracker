import type { Request, Response } from "express";
import { getTenantId } from "../../utils/getTenant";
import {
  addPlayer,
  addScheduleGame,
  getTeamData,
  removePlayer,
  removeScheduleGame,
  updatePlayer,
  updateScheduleGame,
  updateTeamData
} from "./teamData.service";
import { playerSchema, scheduleSchema, teamDataSchema } from "./teamData.types";
import { TenantSettings, type TenantSettingsDocument } from "./tenantSettings.model";

export async function getTeamDataHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const data = await getTeamData(tenantId);
  return res.json(data);
}

export async function getTeamDataDebugHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const data = await TenantSettings.findOne({ tenantId }).lean<TenantSettingsDocument>();

  return res.json({
    tenantId,
    hasTenantSettings: Boolean(data),
    teamName: data?.metadata?.teamName ?? null,
    playersCount: Array.isArray(data?.players) ? data.players.length : 0,
    scheduleCount: Array.isArray(data?.schedule?.games) ? data.schedule.games.length : 0
  });
}

export async function updateTeamDataHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const parsed = teamDataSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const data = await updateTeamData(tenantId, parsed.data);
  return res.json(data);
}

export async function addPlayerHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const parsed = playerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const result = await addPlayer(tenantId, parsed.data);
  return res.status(201).json(result.player);
}

export async function updatePlayerHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const playerId = req.params.playerId;
  const parsed = playerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const player = await updatePlayer(tenantId, playerId, parsed.data);
    return res.json(player);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update player";
    const status = message === "Player not found" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
}

export async function removePlayerHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const playerId = req.params.playerId;
  try {
    const players = await removePlayer(tenantId, playerId);
    return res.json(players);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove player";
    const status = message === "Team data not found" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
}

export async function addScheduleGameHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const result = await addScheduleGame(tenantId, parsed.data);
  return res.status(201).json(result.scheduleGame);
}

export async function updateScheduleGameHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const gameId = req.params.gameId;
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const scheduleGame = await updateScheduleGame(tenantId, gameId, parsed.data);
    return res.json(scheduleGame);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update schedule";
    const status = message === "Schedule game not found" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
}

export async function removeScheduleGameHandler(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const gameId = req.params.gameId;
  try {
    const schedule = await removeScheduleGame(tenantId, gameId);
    return res.json(schedule);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove schedule";
    const status = message === "Team data not found" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
}
