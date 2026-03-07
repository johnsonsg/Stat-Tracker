import { z } from "zod";

export const teamDataSchema = z.object({
  teamName: z.string().min(1).optional()
});

export const playerSchema = z.object({
  name: z.string().min(1),
  number: z.string().min(1),
  position: z.string().min(1)
});

export const scheduleSchema = z.object({
  opponent: z.string().min(1),
  dateTime: z.string().min(1),
  location: z.string().min(1)
});

export type TeamDataInput = z.infer<typeof teamDataSchema>;
export type CreatePlayerInput = z.infer<typeof playerSchema>;
export type CreateScheduleInput = z.infer<typeof scheduleSchema>;
