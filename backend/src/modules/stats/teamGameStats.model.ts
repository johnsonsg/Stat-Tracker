import mongoose, { Schema, type InferSchemaType } from "mongoose";

const TeamGameStatsSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    pointsFor: { type: Number, default: 0 },
    pointsAgainst: { type: Number, default: 0 },
    totalYards: { type: Number, default: 0 },
    penalties: { type: Number, default: 0 },
    turnovers: { type: Number, default: 0 }
  },
  { timestamps: true }
);

TeamGameStatsSchema.index({ tenantId: 1, gameId: 1 }, { unique: true });

export type TeamGameStatsDocument = InferSchemaType<typeof TeamGameStatsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TeamGameStats =
  mongoose.models.TeamGameStats || mongoose.model("TeamGameStats", TeamGameStatsSchema);
