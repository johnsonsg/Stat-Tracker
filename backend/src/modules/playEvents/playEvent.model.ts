import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PlayEventSchema = new Schema(
	{
		tenantId: { type: String, required: true, index: true },
		sport: { type: String, default: "football" },
		season: { type: Number, required: true, index: true },
		gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true, index: true },
		sequence: { type: Number, required: true },
		quarter: { type: Number, required: true },
		clock: { type: String, required: true },
		down: { type: Number },
		distance: { type: Number },
		yardLine: { type: Number },
		playType: { type: String, required: true, index: true },
		players: {
			passerId: String,
			receiverId: String,
			rusherId: String,
			tacklerId: String,
			kickerId: String,
			returnerId: String
		},
		yards: { type: Number, default: 0 },
		touchdown: { type: Boolean, default: false },
		turnover: { type: Boolean, default: false },
		notes: { type: String }
	},
	{
		timestamps: {
			createdAt: true,
			updatedAt: false
		}
	}
);

PlayEventSchema.index({ tenantId: 1, season: 1, gameId: 1, sequence: 1 });
PlayEventSchema.index({ gameId: 1, sequence: 1 });

export type PlayEventDocument = InferSchemaType<typeof PlayEventSchema> & {
	_id: mongoose.Types.ObjectId;
};

export const PlayEvent =
	(mongoose.models.PlayEvent as mongoose.Model<PlayEventDocument>) ||
	mongoose.model<PlayEventDocument>("PlayEvent", PlayEventSchema);
