import { MinecraftServer, PingResponse } from "mcping-js";
import { CONFIG } from "./config";

export function pingMinecraftServer(
  host: string,
  port: number | undefined,
  version: number = CONFIG.defaultProtocolVersion,
  timeout: number = CONFIG.pingTimeoutMs,
): Promise<PingResponse | undefined> {
  return new Promise((resolve, reject) => {
    const server = new MinecraftServer(host, port);
    server.ping(timeout, version, (error, response) => {
      if (error) reject(error);
      resolve(response);
    });
  });
}
