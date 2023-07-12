import { PingResponse } from "mcping-js";
import { CONFIG } from "./config";
import { McServer } from "./models/mc-server";

export function getYearMonthHash(date = new Date()) {
  return date.getFullYear() + "-" + date.getMonth();
}

export function parseServerStatus(
  res: PingResponse,
  mcServer?: McServer,
): Pick<McServer, "players" | "maxPlayers"> {
  const {
    players: { max: maxPlayers, sample = [] },
  } = res;
  const pingPlayers = sample.filter(
    (player) => player.id !== CONFIG.userMockId,
  );
  const players = mcServer?.players.map((p) => ({ ...p })) || [];
  const currentYearMonthHash = getYearMonthHash();
  for (const player of players) {
    const pingPlayerIdx = pingPlayers.findIndex((p) => p.id === player.id);
    pingPlayers.splice(pingPlayerIdx, 1);
    if (pingPlayerIdx !== -1) {
      player.isOnline = true;
      player.onlineByMonth[currentYearMonthHash] =
        (player.onlineByMonth[currentYearMonthHash] || 0) +
        CONFIG.minecraftPollingIntervalMs;
      player.lastOnline = new Date().toISOString();
    } else {
      player.isOnline = false;
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
