import { z } from "zod";

export const createPlayerSchema = z.object({
  externalPlayerId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  jerseyNumber: z.number().int().optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional()
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
