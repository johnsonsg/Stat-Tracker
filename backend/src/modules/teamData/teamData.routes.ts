import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  addPlayerHandler,
  addScheduleGameHandler,
  getTeamDataHandler,
  removePlayerHandler,
  removeScheduleGameHandler,
  updatePlayerHandler,
  updateScheduleGameHandler,
  updateTeamDataHandler
} from "./teamData.controller";
import { requireOrgRole } from "../../middleware/authorization";

const router = Router();

router.get("/team-data", asyncHandler(getTeamDataHandler));
router.put("/team-data", requireOrgRole(["org:admin", "org:member"]), asyncHandler(updateTeamDataHandler));

router.post("/team/players", requireOrgRole(["org:admin", "org:member"]), asyncHandler(addPlayerHandler));
router.put("/team/players/:playerId", requireOrgRole(["org:admin", "org:member"]), asyncHandler(updatePlayerHandler));
router.delete(
  "/team/players/:playerId",
  requireOrgRole(["org:admin", "org:member"]),
  asyncHandler(removePlayerHandler)
);

router.post(
  "/team/schedule",
  requireOrgRole(["org:admin", "org:member"]),
  asyncHandler(addScheduleGameHandler)
);
router.put(
  "/team/schedule/:gameId",
  requireOrgRole(["org:admin", "org:member"]),
  asyncHandler(updateScheduleGameHandler)
);
router.delete(
  "/team/schedule/:gameId",
  requireOrgRole(["org:admin", "org:member"]),
  asyncHandler(removeScheduleGameHandler)
);

export default router;
