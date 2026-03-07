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
 *               - season
 *               - homeTeam
 *               - awayTeam
 *               - gameDate
 *             properties:
 *               season:
 *                 type: integer
 *               homeTeam:
 *                 type: string
 *               awayTeam:
 *                 type: string
 *               gameDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [scheduled, live, finished]
 *               score:
 *                 type: object
 *                 properties:
 *                   home:
 *                     type: integer
 *                   away:
 *                     type: integer
 *     responses:
 *       201:
 *         description: Game created
 */
router.post("/", requireOrgRole(["org:admin", "org:member"]), asyncHandler(createGameHandler));

export default router;
