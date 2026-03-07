import mongoose, { Schema, type InferSchemaType } from "mongoose";

const GameSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    season: { type: Number, required: true, index: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    gameDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "finished"],
      default: "scheduled",
      index: true
    },
    score: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

GameSchema.index({ tenantId: 1, season: 1, gameDate: -1 });

export type GameDocument = InferSchemaType<typeof GameSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);
