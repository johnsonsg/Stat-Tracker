import { Router } from "express";
import gameRoutes from "../modules/games/game.routes";
import playEventRoutes from "../modules/playEvents/playEvent.routes";
import statRoutes from "../modules/stats/stat.routes";

const router = Router();

router.use("/games", gameRoutes);
router.use("/games/:gameId/plays", playEventRoutes);
router.use("/stats", statRoutes);

export default router;
