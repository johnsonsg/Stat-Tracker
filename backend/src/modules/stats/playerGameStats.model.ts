import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PlayerGameStatsSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    playerId: { type: String, required: true },
    passing: { type: Number, default: 0 },
    rushing: { type: Number, default: 0 },
    receiving: { type: Number, default: 0 },
    tackles: { type: Number, default: 0 },
    sacks: { type: Number, default: 0 },
    interceptions: { type: Number, default: 0 },
    tds: { type: Number, default: 0 }
  },
  { timestamps: true }
);

PlayerGameStatsSchema.index({ tenantId: 1, gameId: 1, playerId: 1 }, { unique: true });

export type PlayerGameStatsDocument = InferSchemaType<typeof PlayerGameStatsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PlayerGameStats =
  mongoose.models.PlayerGameStats || mongoose.model("PlayerGameStats", PlayerGameStatsSchema);
