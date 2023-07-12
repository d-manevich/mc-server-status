import { McServer } from "./models/mc-server";
import { getServerUrl } from "./get-server-url";
import { parseUrlForHostAndPort } from "./utils/parse-url-for-host-and-port";

function getServerHash(server: Pick<McServer, "host" | "port" | "version">) {
  return getServerUrl(server) + server.version;
}

export class McStore {
  private servers = new Map<string, McServer>();

  init(url: string, version: number) {
    const { host, port } = parseUrlForHostAndPort(url);
    const hash = getServerHash({ host, port, version });
    if (!this.servers.has(hash))
      this.servers.set(hash, {
        host,
        port,
        version,
        maxPlayers: 0,
        players: [],
        chats: [],
      });
    return this.servers.get(hash) as McServer;
  }

  get(url: string, chatId: number) {
    const { host, port } = parseUrlForHostAndPort(url);
    return Array.from(this.servers.values()).find(
      (s) =>
        s.host === host &&
        s.port === port &&
        s.chats.some((c) => c.chatId === chatId),
    );
  }

  getAll(chatId?: number) {
    if (!chatId) {
      return Array.from(this.servers.values());
    }
    return Array.from(this.servers.values()).filter((s) =>
      s.chats.some((c) => c.chatId === chatId),
    );
  }

  del({ host, port, version }: McServer) {
    const hash = getServerHash({ host, port, version });
    this.servers.delete(hash);
  }

  serialize() {
    return JSON.stringify(Array.from(this.servers));
  }

  deserialize(data: string) {
    try {
      this.servers = new Map(JSON.parse(data));
    } catch (err) {
      console.warn(err);
    }
  }
}
