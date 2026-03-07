import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createPlayerHandler, listPlayersHandler } from "./player.controller";
import { requireOrgRole } from "../../middleware/authorization";

const router = Router();

/**
 * @openapi
 * /api/players:
 *   get:
 *     summary: List players
 *     responses:
 *       200:
 *         description: Array of players
 */
router.get("/", asyncHandler(listPlayersHandler));

/**
 * @openapi
 * /api/players:
 *   post:
 *     summary: Create a player
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               externalPlayerId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               jerseyNumber:
 *                 type: integer
 *               position:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Player created
 */
router.post("/", requireOrgRole(["org:admin", "org:member"]), asyncHandler(createPlayerHandler));

export default router;
