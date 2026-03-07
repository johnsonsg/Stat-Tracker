import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { listPlayEventsHandler } from "./playEvent.controller";

const router = Router();

router.get("/", asyncHandler(listPlayEventsHandler));

export default router;
