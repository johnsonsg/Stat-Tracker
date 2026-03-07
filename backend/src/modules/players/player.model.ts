import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PlayerSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    externalPlayerId: { type: String, default: null },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    jerseyNumber: { type: Number, default: null },
    position: { type: String, default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

PlayerSchema.index({ tenantId: 1, lastName: 1 });

export type PlayerDocument = InferSchemaType<typeof PlayerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Player = mongoose.models.Player || mongoose.model("Player", PlayerSchema);
