import {
  formatDistance,
  formatDistanceToNow,
  differenceInMilliseconds,
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
  players.sort((a, b) => +new Date(b.lastOnline) - +new Date(a.lastOnline));
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
      Math.abs(differenceInMilliseconds(new Date(p.lastOnline), new Date())) <
      CONFIG.thresholdToShowOfflinePlayersMs,
  );
  if (!filteredOffline.length) {
    return "";
  }
  const sortedPlayers = sortPlayersByLastOnline(filteredOffline);
  return `${sortedPlayers.map(formatOfflinePlayer).join("\n")}`;
}

function getPlayerListSection(server: McServer) {
  const online = server.players.filter((p) => p.isOnline);
  const offline = server.players.filter((p) => !p.isOnline);
  return `${[
    [
      server.hasError ? "🛑" : "",
      `*${getServerUrl(server)}*`,
      server.hasError
        ? "is offline"
        : `*${online.length}/${server.maxPlayers}*`,
    ]
      .filter(Boolean)
      .join(" "),
    getOnlineSection(online),
    getOfflineSection(offline),
  ]
    .filter(Boolean)
    .join("\n")}`;
}

export function getPlayersStat(
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
        `${medals[idx] || ` *${idx + 1}.* `} ${
          p.player.name
        } ~ ${formatDistanceToNow(new Date(Date.now() - p.online))}`,
    )
    .join("\n");
}

export function getPlayersStatSection(server: McServer) {
  return server.players.length
    ? ["*Top 3 online this month*", getPlayersStat(server.players)].join("\n")
    : null;
}

export function getServerStatusMessage(server: McServer) {
  if (!server) return "";
  return [getPlayerListSection(server), getPlayersStatSection(server)]
    .filter((v) => v !== null)
    .join("\n\n");
}
