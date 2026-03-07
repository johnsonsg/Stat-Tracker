import { z } from "zod";

export const createPlayEventSchema = z.object({
	sport: z.string().optional(),
	quarter: z.number().int().min(1),
	clock: z.string().min(1),
	down: z.number().int().min(1).optional(),
	distance: z.number().int().min(0).optional(),
	yardLine: z.number().int().min(0).optional(),
	playType: z.string().min(1),
	players: z
		.object({
			passerId: z.string().optional(),
			receiverId: z.string().optional(),
			rusherId: z.string().optional(),
			tacklerId: z.string().optional(),
			kickerId: z.string().optional(),
			returnerId: z.string().optional()
		})
		.optional(),
	yards: z.number().int().optional(),
	touchdown: z.boolean().optional(),
	turnover: z.boolean().optional(),
	notes: z.string().optional()
});

export type CreatePlayEventInput = z.infer<typeof createPlayEventSchema>;

export const updatePlayEventSchema = createPlayEventSchema.partial();

export type UpdatePlayEventInput = z.infer<typeof updatePlayEventSchema>;
