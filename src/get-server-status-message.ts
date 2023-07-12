import { formatDistance, differenceInMinutes } from "date-fns";
import { APP_CONFIG } from "./app-config";
import { McServer, PlayerStatus } from "./models/mc-server";
import { getServerUrl } from "./get-server-url";

function formatOnlinePlayer(player: PlayerStatus) {
  return `🟢${player.name}`;
}

function formatOfflinePlayer(player: PlayerStatus) {
  const formattedDuration = formatDistance(player.lastOnline, new Date(), {
    addSuffix: true,
  });

  return `⚪${player.name} ~ ${formattedDuration}`;
}

function sortPlayersByLastOnline(players: PlayerStatus[]) {
  players.sort((a, b) => +b.lastOnline - +a.lastOnline);
  return players;
}
function getOnlineSection(online: PlayerStatus[]) {
  if (!online.length) {
    return "";
  }
  online.sort((a, b) => a.name.localeCompare(b.name));

  return online.map(formatOnlinePlayer).join("\n");
}

function getOfflineSection(offline: PlayerStatus[]) {
  const filteredOffline = offline.filter(
    (p) =>
      Math.abs(differenceInMinutes(p.lastOnline, new Date())) <
      APP_CONFIG.thresholdToShowOfflinePlayersMins,
  );
  if (!filteredOffline.length) {
    return "";
  }
  const sortedPlayers = sortPlayersByLastOnline(filteredOffline);
  return `${sortedPlayers.map(formatOfflinePlayer).join("\n")}`;
}

function getPlayerListSection(online: PlayerStatus[], offline: PlayerStatus[]) {
  return online.length || offline.length
    ? `${[getOnlineSection(online), getOfflineSection(offline)]
        .filter(Boolean)
        .join("\n")}`
    : "";
}

export function getServerStatusMessage(server: McServer) {
  if (!server) return "";
  const online = server.players.filter((p) => p.isOnline);
  const offline = server.players.filter((p) => !p.isOnline);
  return [
    getServerUrl(server),
    `Online: ${online.length}/${server.maxPlayers}`,
    getPlayerListSection(online, offline),
  ].join("\n");
}
