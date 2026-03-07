import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createTeamHandler, listTeamsHandler } from "./team.controller";

const router = Router();

router.get("/", asyncHandler(listTeamsHandler));
router.post("/", asyncHandler(createTeamHandler));

export default router;
