import { randomUUID } from "node:crypto";
import { TeamData, type TeamDataDocument } from "./teamData.model";
import type { CreatePlayerInput, CreateScheduleInput, TeamDataInput } from "./teamData.types";

export async function getTeamData(tenantId: string) {
  const data = await TeamData.findOne({ tenantId }).lean<TeamDataDocument>();
  if (!data) {
    return { teamName: null, players: [], schedule: [] };
  }
  return data;
}

export async function updateTeamData(tenantId: string, input: TeamDataInput) {
  const data = await TeamData.findOneAndUpdate(
    { tenantId },
    { $set: input, $setOnInsert: { players: [], schedule: [] } },
    { new: true, upsert: true }
  ).lean<TeamDataDocument>();

  if (!data) {
    return { teamName: input.teamName ?? null, players: [], schedule: [] };
  }
  return data;
}

export async function addPlayer(tenantId: string, input: CreatePlayerInput) {
  const player = { id: randomUUID(), ...input };
  const data = await TeamData.findOneAndUpdate(
    { tenantId },
    { $push: { players: player }, $setOnInsert: { teamName: null, schedule: [] } },
    { new: true, upsert: true }
  ).lean<TeamDataDocument>();

  return { player, data };
}

export async function updatePlayer(
  tenantId: string,
  playerId: string,
  input: CreatePlayerInput
) {
  const existing = await TeamData.findOne({ tenantId }).lean<TeamDataDocument>();
  if (!existing) {
    throw new Error("Team data not found");
  }

  const playerIndex = existing.players.findIndex((player) => player.id === playerId);
  if (playerIndex === -1) {
    throw new Error("Player not found");
  }

  await TeamData.updateOne(
    { tenantId, "players.id": playerId },
    {
      $set: {
        "players.$.name": input.name,
        "players.$.number": input.number,
        "players.$.position": input.position
      }
    }
  );

  const updated = await TeamData.findOne({ tenantId }).lean<TeamDataDocument>();
  const player = updated?.players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error("Player not found");
  }

  return player;
}

export async function removePlayer(tenantId: string, playerId: string) {
  const data = await TeamData.findOneAndUpdate(
    { tenantId },
    { $pull: { players: { id: playerId } } },
    { new: true }
  ).lean<TeamDataDocument>();

  if (!data) {
    throw new Error("Team data not found");
  }

  return data.players;
}

export async function addScheduleGame(tenantId: string, input: CreateScheduleInput) {
  const scheduleGame = { id: randomUUID(), ...input };
  const data = await TeamData.findOneAndUpdate(
    { tenantId },
    { $push: { schedule: scheduleGame }, $setOnInsert: { teamName: null, players: [] } },
    { new: true, upsert: true }
  ).lean<TeamDataDocument>();

  return { scheduleGame, data };
}

export async function updateScheduleGame(
  tenantId: string,
  gameId: string,
  input: CreateScheduleInput
) {
  const existing = await TeamData.findOne({ tenantId }).lean<TeamDataDocument>();
  if (!existing) {
    throw new Error("Team data not found");
  }

  const gameIndex = existing.schedule.findIndex((game) => game.id === gameId);
  if (gameIndex === -1) {
    throw new Error("Schedule game not found");
  }

  await TeamData.updateOne(
    { tenantId, "schedule.id": gameId },
    {
      $set: {
        "schedule.$.opponent": input.opponent,
        "schedule.$.dateTime": input.dateTime,
        "schedule.$.location": input.location
      }
    }
  );

  const updated = await TeamData.findOne({ tenantId }).lean<TeamDataDocument>();
  const scheduleGame = updated?.schedule.find((item) => item.id === gameId);
  if (!scheduleGame) {
    throw new Error("Schedule game not found");
  }

  return scheduleGame;
}

export async function removeScheduleGame(tenantId: string, gameId: string) {
  const data = await TeamData.findOneAndUpdate(
    { tenantId },
    { $pull: { schedule: { id: gameId } } },
    { new: true }
  ).lean<TeamDataDocument>();

  if (!data) {
    throw new Error("Team data not found");
  }

  return data.schedule;
}
