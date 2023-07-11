import { PingResponse } from "mcping-js";
import { APP_CONFIG } from "./app-config";

export interface PlayerStatus {
  id: string;
  name: string;
  lastOnline: Date;
}

export interface ServerStatus {
  online: PlayerStatus[];
  offline: PlayerStatus[];
  server: {
    max: number;
  };
}

export function parseServerStatus(
  res: PingResponse,
  prevStatus?: ServerStatus,
): ServerStatus {
  const {
    players: { max, sample = [] },
  } = res;
  const online = sample
    .filter((player) => player.id !== APP_CONFIG.userMockId)
    .map((player) => ({
      ...player,
      lastOnline: new Date(),
    }));
  const offline = [
    ...(prevStatus?.online || []),
    ...(prevStatus?.offline || []),
  ].filter((p) => online.every((onlinePlayer) => onlinePlayer.id !== p.id));
  return {
    server: {
      max,
    },
    online,
    offline,
  };
}
