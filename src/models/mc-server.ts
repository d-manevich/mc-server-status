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

export interface McServer {
  host: string;
  port?: number;
  version: number;
  maxPlayers: number;
  players: PlayerStatus[];
  chats: McChat[];
  hasError?: boolean;
}
