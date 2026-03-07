import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createGameHandler, listGamesHandler } from "./game.controller";
import { requireOrgRole } from "../../middleware/authorization";

const router = Router();

/**
 * @openapi
 * /api/games:
 *   get:
 *     summary: List games
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         required: false
 *         description: Season identifier to filter by
 *     responses:
 *       200:
 *         description: Array of games
 */
router.get("/", asyncHandler(listGamesHandler));

/**
 * @openapi
 * /api/games:
 *   post:
 *     summary: Create a game
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - opponent
 *               - gameDate
 *               - homeAway
 *               - season
 *             properties:
 *               opponent:
 *                 type: string
 *               gameDate:
 *                 type: string
 *                 format: date-time
 *               homeAway:
 *                 type: string
 *                 enum: [home, away]
 *               season:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, in_progress, final]
 *     responses:
 *       201:
 *         description: Game created
 */
router.post("/", requireOrgRole(["org:admin", "org:member"]), asyncHandler(createGameHandler));

export default router;
