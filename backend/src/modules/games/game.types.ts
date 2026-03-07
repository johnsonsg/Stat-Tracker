import { z } from "zod";

export const createGameSchema = z.object({
  season: z.number().int().min(2000),
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  gameDate: z.coerce.date(),
  status: z.enum(["scheduled", "live", "finished"]).optional(),
  score: z
    .object({
      home: z.number().int().nonnegative().optional(),
      away: z.number().int().nonnegative().optional()
    })
    .optional()
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
