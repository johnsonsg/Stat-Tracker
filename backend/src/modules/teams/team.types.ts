import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1),
  season: z.string().optional()
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
