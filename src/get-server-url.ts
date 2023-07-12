import { McServer } from "./models/mc-server";

export function getServerUrl(server: Pick<McServer, "host" | "port">) {
  if (!server.port) return server.host;
  return `${server.host}:${server.port}`;
}
