import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
	createGameHandler,
	listGamesHandler,
	updateGameScoreHandler,
	updateGameStatusHandler
} from "./game.controller";
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

/**
 * @openapi
 * /api/games/{gameId}/status:
 *   put:
 *     summary: Update game status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, live, finished]
 *     responses:
 *       200:
 *         description: Game status updated
 */
router.put(
	"/:gameId/status",
	requireOrgRole(["org:admin", "org:member"]),
	asyncHandler(updateGameStatusHandler)
);

/**
 * @openapi
 * /api/games/{gameId}/score:
 *   put:
 *     summary: Update game score
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               home:
 *                 type: integer
 *               away:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Game score updated
 */
router.put(
  "/:gameId/score",
  requireOrgRole(["org:admin", "org:member"]),
  asyncHandler(updateGameScoreHandler)
);

export default router;
