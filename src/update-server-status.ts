import { formatDuration, differenceInMinutes } from "date-fns";

interface PlayerStatus {
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

function formatOnlinePlayer(player: PlayerStatus) {
  return player.name;
}

function formatOfflinePlayer(player: PlayerStatus) {
  const minutes = Math.abs(differenceInMinutes(player.lastOnline, new Date()));
  return `${player.name} ~ ${
    minutes < 1 ? "a few seconds" : formatDuration({ minutes })
  } ago`;
}

export function getServerStatusMessage(url: string, status: ServerStatus) {
  if (!status) return "";
  const offline = status.offline
    .filter((p) => Math.abs(differenceInMinutes(p.lastOnline, new Date())) < 60)
    .sort(
      (a, b) => a.lastOnline.getMilliseconds() - b.lastOnline.getMilliseconds(),
    );
  return `${url}\nOnline: ${status.online.length}/${status.server.max}${
    status.online.length || offline.length
      ? `\n\nPlayers:\n` +
        (status.online.sort((a, b) => a.name.localeCompare(b.name)).length
          ? status.online.map(formatOnlinePlayer).join("\n")
          : "-") +
        (offline.length
          ? `\n\n${offline.map(formatOfflinePlayer).join("\n")}`
          : "")
      : ""
  }`;
}
