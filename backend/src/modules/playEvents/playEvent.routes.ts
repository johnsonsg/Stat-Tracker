import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
	createPlayEventHandler,
	deleteLatestPlayEventHandler,
	listPlayEventsHandler,
	updatePlayEventHandler
} from "./playEvent.controller";
import { requireOrgRole } from "../../middleware/authorization";

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/games/{gameId}/plays:
 *   post:
 *     summary: Record a play event
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
 *               - quarter
 *               - clock
 *               - playType
 *             properties:
 *               sport:
 *                 type: string
 *               quarter:
 *                 type: integer
 *               clock:
 *                 type: string
 *               down:
 *                 type: integer
 *               distance:
 *                 type: integer
 *               yardLine:
 *                 type: integer
 *               playType:
 *                 type: string
 *               players:
 *                 type: object
 *                 properties:
 *                   passerId:
 *                     type: string
 *                   receiverId:
 *                     type: string
 *                   rusherId:
 *                     type: string
 *                   tacklerId:
 *                     type: string
 *                   kickerId:
 *                     type: string
 *                   returnerId:
 *                     type: string
 *               yards:
 *                 type: integer
 *               touchdown:
 *                 type: boolean
 *               turnover:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Play event recorded
 */
router.post("/", requireOrgRole(["org:admin", "org:member"]), asyncHandler(createPlayEventHandler));

/**
 * @openapi
 * /api/games/{gameId}/plays/{playId}:
 *   put:
 *     summary: Update a play event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: playId
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
 *               sport:
 *                 type: string
 *               quarter:
 *                 type: integer
 *               clock:
 *                 type: string
 *               down:
 *                 type: integer
 *               distance:
 *                 type: integer
 *               yardLine:
 *                 type: integer
 *               playType:
 *                 type: string
 *               players:
 *                 type: object
 *               yards:
 *                 type: integer
 *               touchdown:
 *                 type: boolean
 *               turnover:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Play event updated
 */
router.put(
	"/:playId",
	requireOrgRole(["org:admin", "org:member"]),
	asyncHandler(updatePlayEventHandler)
);

/**
 * @openapi
 * /api/games/{gameId}/plays/latest:
 *   delete:
 *     summary: Delete the most recent play event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest play event deleted
 */
router.delete(
	"/latest",
	requireOrgRole(["org:admin", "org:member"]),
	asyncHandler(deleteLatestPlayEventHandler)
);

/**
 * @openapi
 * /api/games/{gameId}/plays:
 *   get:
 *     summary: Get play-by-play
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Play events ordered by sequence
 */
router.get("/", asyncHandler(listPlayEventsHandler));

export default router;
