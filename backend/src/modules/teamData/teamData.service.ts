import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import type { CreatePlayerInput, CreateScheduleInput, TeamDataInput } from "./teamData.types";
import { TenantSettings, type TenantSettingsDocument } from "./tenantSettings.model";

type TenantPlayer = NonNullable<TenantSettingsDocument["players"]>[number];
type TenantScheduleGame = NonNullable<NonNullable<TenantSettingsDocument["schedule"]>["games"]>[number];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const mapPlayer = (player: TenantPlayer) => ({
  id: player.id,
  name: player.name,
  number: player.number,
  position: player.position,
  positionGroup: player.positionGroup ?? []
});

const mapScheduleGame = (game: TenantScheduleGame) => ({
  id: game.id,
  opponent: game.opponent,
  dateTime: game.dateTime,
  location: game.location
});

const buildTenantPlayer = (input: CreatePlayerInput) => {
  const slug = slugify(input.name) || randomUUID();
  return {
    accolades: [],
    bio: "",
    headshotLastError: null,
    headshotOriginalKey: "",
    headshotProcessedKey: "",
    headshotStatus: "",
    headshotUploadId: "",
    height: "",
    hudlUrl: "",
    id: randomUUID(),
    image: new mongoose.Types.ObjectId(),
    name: input.name,
    number: input.number,
    position: input.position,
    positionGroup: [input.position],
    slug,
    sortOrder: 0,
    spotlight: false,
    stats: "",
    weight: "",
    year: ""
  };
};

const buildTenantScheduleGame = (input: CreateScheduleInput) => ({
  id: randomUUID(),
  opponent: input.opponent,
  dateTime: input.dateTime,
  location: input.location,
  outcome: "",
  result: "",
  status: "scheduled"
});

export async function getTeamData(tenantId: string) {
  const data = await TenantSettings.findOne({ tenantId }).lean<TenantSettingsDocument>();
  if (!data) {
    return { teamName: null, brandLogo: null, players: [], schedule: [] };
  }
  return {
    teamName: data.metadata?.teamName ?? null,
    brandLogo: (data as { brand?: { brandLogo?: string } }).brand?.brandLogo ?? null,
    players: (data.players ?? []).map(mapPlayer),
    schedule: (data.schedule?.games ?? []).map(mapScheduleGame)
  };
}

export async function updateTeamData(tenantId: string, input: TeamDataInput) {
  const updates: Record<string, unknown> = {};
  if (typeof input.teamName === "string") {
    updates["metadata.teamName"] = input.teamName;
  }

  const data = await TenantSettings.findOneAndUpdate(
    { tenantId },
    { $set: updates },
    { new: true }
  ).lean<TenantSettingsDocument>();

  if (!data) {
    return { teamName: input.teamName ?? null, brandLogo: null, players: [], schedule: [] };
  }
  return {
    teamName: data.metadata?.teamName ?? null,
    brandLogo: (data as { brand?: { brandLogo?: string } }).brand?.brandLogo ?? null,
    players: (data.players ?? []).map(mapPlayer),
    schedule: (data.schedule?.games ?? []).map(mapScheduleGame)
  };
}

export async function addPlayer(tenantId: string, input: CreatePlayerInput) {
  const existing = await TenantSettings.findOne({ tenantId }).lean<TenantSettingsDocument>();
  if (!existing) {
    throw new Error("Team data not found");
  }

  const player = buildTenantPlayer(input);
  await TenantSettings.updateOne({ tenantId }, { $push: { players: player } });
  return { player: mapPlayer(player), data: existing };
}

export async function updatePlayer(
  tenantId: string,
  playerId: string,
  input: CreatePlayerInput
) {
  const existing = await TenantSettings.findOne({ tenantId }).lean<TenantSettingsDocument>();
  if (!existing) {
    throw new Error("Team data not found");
  }

  const playerIndex = existing.players.findIndex((player) => player.id === playerId);
  if (playerIndex === -1) {
    throw new Error("Player not found");
  }

  await TenantSettings.updateOne(
    { tenantId, "players.id": playerId },
    {
      $set: {
        "players.$.name": input.name,
        "players.$.number": input.number,
        "players.$.position": input.position,
        "players.$.positionGroup": [input.position]
      }
    }
  );

  const updated = await TenantSettings.findOne({ tenantId }).lean<TenantSettingsDocument>();
  const player = updated?.players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error("Player not found");
  }

  return mapPlayer(player);
}

export async function removePlayer(tenantId: string, playerId: string) {
  const data = await TenantSettings.findOneAndUpdate(
    { tenantId },
    { $pull: { players: { id: playerId } } },
    { new: true }
  ).lean<TenantSettingsDocument>();

  if (!data) {
    throw new Error("Team data not found");
  }

  return (data.players ?? []).map(mapPlayer);
}

export async function addScheduleGame(tenantId: string, input: CreateScheduleInput) {
  const existing = await TenantSettings.findOne({ tenantId }).lean<TenantSettingsDocument>();
  if (!existing) {
    throw new Error("Team data not found");
  }

  const scheduleGame = buildTenantScheduleGame(input);
  await TenantSettings.updateOne({ tenantId }, { $push: { "schedule.games": scheduleGame } });
  return { scheduleGame: mapScheduleGame(scheduleGame), data: existing };
}

export async function updateScheduleGame(
  tenantId: string,
  gameId: string,
  input: CreateScheduleInput
) {
  const existing = await TenantSettings.findOne({ tenantId }).lean<TenantSettingsDocument>();
  if (!existing) {
    throw new Error("Team data not found");
  }

  const gameIndex = existing.schedule?.games?.findIndex((game) => game.id === gameId) ?? -1;
  if (gameIndex === -1) {
    throw new Error("Schedule game not found");
  }

  await TenantSettings.updateOne(
    { tenantId, "schedule.games.id": gameId },
    {
      $set: {
        "schedule.games.$.opponent": input.opponent,
        "schedule.games.$.dateTime": input.dateTime,
        "schedule.games.$.location": input.location
      }
    }
  );

  const updated = await TenantSettings.findOne({ tenantId }).lean<TenantSettingsDocument>();
  const scheduleGame = updated?.schedule?.games?.find((item) => item.id === gameId);
  if (!scheduleGame) {
    throw new Error("Schedule game not found");
  }

  return mapScheduleGame(scheduleGame);
}

export async function removeScheduleGame(tenantId: string, gameId: string) {
  const data = await TenantSettings.findOneAndUpdate(
    { tenantId },
    { $pull: { "schedule.games": { id: gameId } } },
    { new: true }
  ).lean<TenantSettingsDocument>();

  if (!data) {
    throw new Error("Team data not found");
  }

  return (data.schedule?.games ?? []).map(mapScheduleGame);
}
