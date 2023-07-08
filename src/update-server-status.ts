import { formatDistance, differenceInMinutes } from "date-fns";

const THRESHOLD_TO_SHOW_OFFLINE_PLAYERS_MINS = 60;

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
      THRESHOLD_TO_SHOW_OFFLINE_PLAYERS_MINS,
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

export function getServerStatusMessage(url: string, status?: ServerStatus) {
  if (!status) return "";
  const { online, offline, server } = status;
  return `${url}
Online: ${online.length}/${server.max}
${getPlayerListSection(online, offline)}`;
}
