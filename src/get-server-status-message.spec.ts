import { beforeEach, describe, expect, it } from "vitest";
import { getServerStatusMessage } from "./get-server-status-message";
import { McServer } from "./models/mc-server";
import { CONFIG } from "./config";

describe("getServerStatusMessage", () => {
  let serverStatusStub = getServerStatusStub();
  beforeEach(() => {
    serverStatusStub = getServerStatusStub();
    CONFIG.thresholdToShowOfflinePlayersMs = 60 * 60_000;
  });

  it("offline + online", () => {
    const result = getServerStatusMessage(serverStatusStub);
    expect(result).toMatchInlineSnapshot(`
      "*test.goodmc.org* *2/30*
      🟢player1
      🟢player2
      ⚪player5 ~ less than a minute ago
      ⚪player3 ~ 1 minute ago
      ⚪player4 ~ 30 minutes ago
      
      *Top 3 online this month*
      🥇 player1 ~ less than a minute
      🥈 player2 ~ less than a minute
      🥉 player3 ~ less than a minute"
    `);
  });

  it("no online no offline", () => {
    serverStatusStub.players = [];
    const result = getServerStatusMessage(serverStatusStub);
    expect(result).toMatchInlineSnapshot(`
      "*test.goodmc.org* *0/30*"
    `);
  });

  it("offline only", () => {
    serverStatusStub.players = serverStatusStub.players.filter(
      (p) => !p.isOnline,
    );
    const result = getServerStatusMessage(serverStatusStub);
    expect(result).toMatchInlineSnapshot(`
      "*test.goodmc.org* *0/30*
      ⚪player5 ~ less than a minute ago
      ⚪player3 ~ 1 minute ago
      ⚪player4 ~ 30 minutes ago

      *Top 3 online this month*
      🥇 player3 ~ less than a minute
      🥈 player4 ~ less than a minute
      🥉 player5 ~ less than a minute"
    `);
  });

  it("online only", () => {
    serverStatusStub.players = serverStatusStub.players.filter(
      (p) => p.isOnline,
    );
    const result = getServerStatusMessage(serverStatusStub);
    expect(result).toMatchInlineSnapshot(`
      "*test.goodmc.org* *2/30*
      🟢player1
      🟢player2

      *Top 3 online this month*
      🥇 player1 ~ less than a minute
      🥈 player2 ~ less than a minute"
    `);
  });

  it("is offline", () => {
    serverStatusStub.hasError = true;
    serverStatusStub.players.forEach((p) => (p.isOnline = false));
    const result = getServerStatusMessage(serverStatusStub);
    expect(result).toMatchInlineSnapshot(`
      "🛑 *test.goodmc.org* is offline
      ⚪player1 ~ less than a minute ago
      ⚪player2 ~ less than a minute ago
      ⚪player5 ~ less than a minute ago
      ⚪player3 ~ 1 minute ago
      ⚪player4 ~ 30 minutes ago
      
      *Top 3 online this month*
      🥇 player1 ~ less than a minute
      🥈 player2 ~ less than a minute
      🥉 player3 ~ less than a minute"
    `);
  });
});

function getServerStatusStub(): McServer {
  const _30minsAgo = new Date();
  _30minsAgo.setMinutes(new Date().getMinutes() - 30);
  const _1minAgo = new Date();
  _1minAgo.setMinutes(new Date().getMinutes() - 1);
  const _2hoursAgo = new Date();
  _2hoursAgo.setHours(new Date().getHours() - 2);

  return {
    maxPlayers: 30,
    chats: [],
    host: "test.goodmc.org",
    version: 1,
    players: [
      {
        lastOnline: new Date().toISOString(),
        name: "player1",
        id: "aaa",
        isOnline: true,
        onlineByMonth: {},
      },
      {
        lastOnline: new Date().toISOString(),
        name: "player2",
        id: "bbb",
        isOnline: true,
        onlineByMonth: {},
      },
      {
        lastOnline: _1minAgo.toISOString(),
        name: "player3",
        id: "basd",
        isOnline: false,
        onlineByMonth: {},
      },
      {
        lastOnline: _30minsAgo.toISOString(),
        name: "player4",
        id: "ccc",
        isOnline: false,
        onlineByMonth: {},
      },
      {
        lastOnline: new Date().toISOString(),
        name: "player5",
        id: "sasd",
        isOnline: false,
        onlineByMonth: {},
      },
      {
        lastOnline: _2hoursAgo.toISOString(),
        name: "player6",
        id: "sasdas",
        isOnline: false,
        onlineByMonth: {},
      },
    ],
  };
}
