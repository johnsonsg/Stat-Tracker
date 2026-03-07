import mongoose, { Schema, type InferSchemaType } from "mongoose";

const TeamSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    season: { type: String, default: null }
  },
  { timestamps: true }
);

TeamSchema.index({ tenantId: 1, name: 1 });

export type TeamDocument = InferSchemaType<typeof TeamSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Team = mongoose.models.Team || mongoose.model("Team", TeamSchema);
