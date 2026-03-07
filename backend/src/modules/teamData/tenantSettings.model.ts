import mongoose, { Schema, type InferSchemaType } from "mongoose";

const TenantSettingsSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    metadata: {
      teamName: { type: String }
    },
    players: { type: [Schema.Types.Mixed], default: [] },
    schedule: {
      games: { type: [Schema.Types.Mixed], default: [] }
    }
  },
  {
    collection: "tenant-settings",
    strict: false,
    timestamps: true
  }
);

export type TenantSettingsDocument = InferSchemaType<typeof TenantSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TenantSettings =
  mongoose.models.TenantSettings || mongoose.model("TenantSettings", TenantSettingsSchema);
