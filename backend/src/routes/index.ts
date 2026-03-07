import { Router } from "express";
import gameRoutes from "../modules/games/game.routes";
import playerRoutes from "../modules/players/player.routes";
import statRoutes from "../modules/stats/stat.routes";

const router = Router();

router.use("/games", gameRoutes);
router.use("/players", playerRoutes);
router.use("/stats", statRoutes);

export default router;
