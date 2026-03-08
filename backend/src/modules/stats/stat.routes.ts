import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { getTenantId } from "../../utils/getTenant";
import { requireOrgRole } from "../../middleware/authorization";
import {
  getTeamGameStats,
  listPlayerGameStats,
  recomputeGameStats,
  upsertPlayerGameStats,
  upsertTeamGameStats
} from "./statEngine.service";

const router = Router();

const playerGameSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  passing: z.number().int().nonnegative().optional(),
  rushing: z.number().int().nonnegative().optional(),
  receiving: z.number().int().nonnegative().optional(),
  tackles: z.number().int().nonnegative().optional(),
  sacks: z.number().int().nonnegative().optional(),
  interceptions: z.number().int().nonnegative().optional(),
  tds: z.number().int().nonnegative().optional()
});

const teamGameSchema = z.object({
  gameId: z.string().min(1),
  pointsFor: z.number().int().nonnegative().optional(),
  pointsAgainst: z.number().int().nonnegative().optional(),
  totalYards: z.number().int().nonnegative().optional(),
  penalties: z.number().int().nonnegative().optional(),
  turnovers: z.number().int().nonnegative().optional()
});

/**
 * @openapi
 * /api/stats/player-game:
 *   post:
 *     summary: Upsert player game stats
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *               - playerId
 *             properties:
 *               gameId:
 *                 type: string
 *               playerId:
 *                 type: string
 *               passing:
 *                 type: integer
 *               rushing:
 *                 type: integer
 *               receiving:
 *                 type: integer
 *               tackles:
 *                 type: integer
 *               sacks:
 *                 type: integer
 *               interceptions:
 *                 type: integer
 *               tds:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Player game stats upserted
 */
router.post(
  "/player-game",
  requireOrgRole(["org:admin", "org:member"]),
  asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);

    const parsed = playerGameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { gameId, playerId, ...stats } = parsed.data;
    const result = await upsertPlayerGameStats(tenantId, gameId, playerId, stats);
    return res.json(result);
  })
);

/**
 * @openapi
 * /api/stats/player-game:
 *   get:
 *     summary: Get player game stats
 *     parameters:
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         required: true
 *         description: Game identifier
 *     responses:
 *       200:
 *         description: Array of player game stats
 */
router.get(
  "/player-game",
  asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);

    const gameId = typeof req.query.gameId === "string" ? req.query.gameId : "";
    if (!gameId) {
      return res.status(400).json({ error: "gameId is required" });
    }

    let stats = await listPlayerGameStats(tenantId, gameId);
    if (stats.length === 0) {
      await recomputeGameStats(tenantId, gameId);
      stats = await listPlayerGameStats(tenantId, gameId);
    }
    return res.json(stats);
  })
);

/**
 * @openapi
 * /api/stats/team-game:
 *   post:
 *     summary: Upsert team game stats
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *             properties:
 *               gameId:
 *                 type: string
 *               pointsFor:
 *                 type: integer
 *               pointsAgainst:
 *                 type: integer
 *               totalYards:
 *                 type: integer
 *               penalties:
 *                 type: integer
 *               turnovers:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Team game stats upserted
 */
router.post(
  "/team-game",
  requireOrgRole(["org:admin", "org:member"]),
  asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);

    const parsed = teamGameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { gameId, ...stats } = parsed.data;
    const result = await upsertTeamGameStats(tenantId, gameId, stats);
    return res.json(result);
  })
);

/**
 * @openapi
 * /api/stats/team-game:
 *   get:
 *     summary: Get team game stats
 *     parameters:
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         required: true
 *         description: Game identifier
 *     responses:
 *       200:
 *         description: Team game stats
 */
router.get(
  "/team-game",
  asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);

    const gameId = typeof req.query.gameId === "string" ? req.query.gameId : "";
    if (!gameId) {
      return res.status(400).json({ error: "gameId is required" });
    }

    const stats = await getTeamGameStats(tenantId, gameId);
    if (!stats) {
      return res.status(404).json({ error: "Stats not found" });
    }

    return res.json(stats);
  })
);

export default router;
