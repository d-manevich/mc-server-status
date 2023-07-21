import { PingResponse } from "mcping-js";
import { CONFIG } from "./config";
import { McServer } from "./models/mc-server";

export function getYearMonthHash(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function parseServerStatus(
  pingResponse?: PingResponse,
  mcServer?: McServer,
): Pick<McServer, "players" | "maxPlayers"> {
  if (!pingResponse) {
    return {
      players: (mcServer?.players || []).map((p) => ({
        ...p,
        isOnline: false,
      })),
      maxPlayers: mcServer?.maxPlayers || 0,
    };
  }
  const {
    players: { max: maxPlayers, sample = [] },
  } = pingResponse;
  const pingPlayers = sample.filter(
    (player) => player.id !== CONFIG.userMockId,
  );
  const players = mcServer?.players.map((p) => ({ ...p })) || [];
  const currentYearMonthHash = getYearMonthHash();
  for (const player of players) {
    const pingPlayerIndex = pingPlayers.findIndex((p) => p.id === player.id);
    pingPlayers.splice(pingPlayerIndex, 1);
    if (pingPlayerIndex === -1) {
      player.isOnline = false;
    } else {
      player.isOnline = true;
      player.onlineByMonth[currentYearMonthHash] =
        (player.onlineByMonth[currentYearMonthHash] || 0) +
        CONFIG.minecraftPollingIntervalMs;
      player.lastOnline = new Date().toISOString();
    }
  }
  players.push(
    ...pingPlayers.map((p) => ({
      ...p,
      isOnline: true,
      lastOnline: new Date().toISOString(),
      onlineByMonth: {
        [currentYearMonthHash]: CONFIG.minecraftPollingIntervalMs,
      },
    })),
  );
  return {
    players,
    maxPlayers,
  };
}
