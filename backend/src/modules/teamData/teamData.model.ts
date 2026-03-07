import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PlayerSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    number: { type: String, required: true },
    position: { type: String, required: true }
  },
  { _id: false }
);

const ScheduleGameSchema = new Schema(
  {
    id: { type: String, required: true },
    opponent: { type: String, required: true },
    dateTime: { type: String, required: true },
    location: { type: String, required: true }
  },
  { _id: false }
);

const TeamDataSchema = new Schema(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    teamName: { type: String, default: null },
    players: { type: [PlayerSchema], default: [] },
    schedule: { type: [ScheduleGameSchema], default: [] }
  },
  { timestamps: true }
);

export type TeamDataDocument = InferSchemaType<typeof TeamDataSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TeamData = mongoose.models.TeamData || mongoose.model("TeamData", TeamDataSchema);
