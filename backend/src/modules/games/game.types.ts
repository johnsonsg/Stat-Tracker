import { z } from "zod";

export const createGameSchema = z.object({
  opponent: z.string().min(1),
  gameDate: z.coerce.date(),
  homeAway: z.enum(["home", "away"]),
  season: z.string().min(1),
  status: z.enum(["scheduled", "in_progress", "final"]).optional()
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
