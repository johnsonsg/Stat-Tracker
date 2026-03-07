import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStatsFromPlays } from "./statEngine.service";

test("computeStatsFromPlays credits QB + receiver on pass TD", () => {
  const plays = [
    {
      playType: "pass",
      yards: 24,
      touchdown: true,
      players: {
        passerId: "qb-1",
        receiverId: "wr-1"
      }
    }
  ];

  const { teamTotals, playerTotals } = computeStatsFromPlays(plays);
  assert.equal(teamTotals.pointsFor, 6);
  assert.equal(teamTotals.totalYards, 24);
  assert.equal(playerTotals.get("qb-1")?.passing, 24);
  assert.equal(playerTotals.get("qb-1")?.tds, 1);
  assert.equal(playerTotals.get("wr-1")?.receiving, 24);
  assert.equal(playerTotals.get("wr-1")?.tds, 1);
});

test("computeStatsFromPlays tracks interceptions on turnovers", () => {
  const plays = [
    {
      playType: "pass",
      yards: 0,
      turnover: true,
      players: {
        passerId: "qb-2",
        tacklerId: "db-1"
      }
    }
  ];

  const { teamTotals, playerTotals } = computeStatsFromPlays(plays);
  assert.equal(teamTotals.turnovers, 1);
  assert.equal(playerTotals.get("db-1")?.interceptions, 1);
});

test("computeStatsFromPlays counts penalties without adding yards", () => {
  const plays = [
    {
      playType: "penalty",
      yards: 15
    }
  ];

  const { teamTotals } = computeStatsFromPlays(plays);
  assert.equal(teamTotals.penalties, 1);
  assert.equal(teamTotals.totalYards, 0);
});
