import mongoose, { Schema, type InferSchemaType } from "mongoose";

const GameSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    opponent: { type: String, required: true },
    gameDate: { type: Date, required: true },
    homeAway: { type: String, enum: ["home", "away"], required: true },
    season: { type: String, required: true },
    status: { type: String, enum: ["scheduled", "in_progress", "final"], default: "scheduled" }
  },
  { timestamps: true }
);

GameSchema.index({ tenantId: 1, season: 1 });

export type GameDocument = InferSchemaType<typeof GameSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);
