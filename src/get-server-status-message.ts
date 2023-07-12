import {
  formatDistance,
  differenceInMinutes,
  formatDistanceToNow,
} from "date-fns";
import { CONFIG } from "./config";
import { McServer, PlayerStatus } from "./models/mc-server";
import { getServerUrl } from "./get-server-url";
import { getYearMonthHash } from "./parse-server-status";

function formatOnlinePlayer(player: PlayerStatus) {
  return `🟢${player.name}`;
}

function formatOfflinePlayer(player: PlayerStatus) {
  const formattedDuration = formatDistance(
    new Date(player.lastOnline),
    new Date(),
    {
      addSuffix: true,
    },
  );

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
      Math.abs(differenceInMinutes(new Date(p.lastOnline), new Date())) <
      CONFIG.thresholdToShowOfflinePlayersMins,
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

export function getPlayersStatSection(
  players: PlayerStatus[],
  count = 3,
  isAllTime = false,
) {
  const currentYearMonth = getYearMonthHash();
  const medals = ["🥇", "🥈", "🥉"];
  return players
    .map((player) => ({
      player,
      online:
        (isAllTime
          ? Object.values(player.onlineByMonth).reduce((sum, v) => sum + v, 0)
          : player.onlineByMonth[currentYearMonth]) || 0,
    }))
    .sort((a, b) => b.online - a.online)
    .slice(0, count)
    .map(
      (p, idx) =>
        `${medals[idx] || `${idx + 1}.`} ${
          p.player.name
        } ~ ${formatDistanceToNow(new Date(Date.now() - p.online))}`,
    )
    .join("\n");
}

export function getServerStatusMessage(server: McServer) {
  if (!server) return "";
  const online = server.players.filter((p) => p.isOnline);
  const offline = server.players.filter((p) => !p.isOnline);
  return [
    `*${getServerUrl(server)}* *${online.length}/${server.maxPlayers}*`,
    getPlayerListSection(online, offline),
    "",
    "*Top 3 online this month*",
    getPlayersStatSection(server.players),
  ].join("\n");
}
