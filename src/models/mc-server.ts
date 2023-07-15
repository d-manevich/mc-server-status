import { McUrl } from "./mc-url";

export interface PlayerStatus {
  id: string;
  name: string;
  isOnline: boolean;
  lastOnline: string;
  onlineByMonth: { [YearMonth in string]: number }; // yyyy-m
}

export interface McChat {
  chatId: number;
  messageId?: number;
}

export interface McServer extends McUrl {
  version: number;
  maxPlayers: number;
  players: PlayerStatus[];
  chats: McChat[];
  hasError?: boolean;
}
