import { McUrl } from "../models/mc-url";

export function formatUrl(server: McUrl) {
  if (!server.port) return server.host;
  return `${server.host}:${server.port}`;
}
