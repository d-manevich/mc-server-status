import { PingResponse } from "mcping-js";
import { APP_CONFIG } from "./app-config";
import { McServer } from "./models/mc-server";

export function parseServerStatus(
  res: PingResponse,
  mcServer?: McServer,
): Pick<McServer, "players" | "maxPlayers"> {
  const {
    players: { max: maxPlayers, sample = [] },
  } = res;
  const pingPlayers = sample.filter(
    (player) => player.id !== APP_CONFIG.userMockId,
  );
  const players = mcServer?.players.map((p) => ({ ...p })) || [];
  const currentYearMonthHash =
    new Date().getFullYear() + "-" + new Date().getMonth();
  for (const player of players) {
    const pingPlayerIdx = pingPlayers.findIndex((p) => p.id === player.id);
    pingPlayers.splice(pingPlayerIdx, 1);
    if (pingPlayerIdx !== -1) {
      player.isOnline = true;
      player.onlineByMonth[currentYearMonthHash] =
        (player.onlineByMonth[currentYearMonthHash] || 0) +
        APP_CONFIG.minecraftPollingIntervalMs;
      player.lastOnline = new Date();
    } else {
      player.isOnline = false;
    }
  }
  players.push(
    ...pingPlayers.map((p) => ({
      ...p,
      isOnline: true,
      lastOnline: new Date(),
      onlineByMonth: {
        [currentYearMonthHash]: APP_CONFIG.minecraftPollingIntervalMs,
      },
    })),
  );
  return {
    players,
    maxPlayers,
  };
}
