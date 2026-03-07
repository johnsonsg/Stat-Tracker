import { Router } from "express";
import { listLeaderboards } from "./leaderboard.service";

const router = Router();

router.get("/", (_req, res) => {
  res.json(listLeaderboards());
});

export default router;
