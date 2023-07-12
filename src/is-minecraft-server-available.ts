import { MinecraftServer } from "mcping-js";
import { CONFIG } from "./config";

export function isMinecraftServerAvailable(
  serverUrl: string,
  host: string,
  port: number | undefined,
) {
  return new Promise<boolean>((resolve, reject) => {
    console.log(`trying to connect to server ${serverUrl}`);

    const serverTest = new MinecraftServer(host, port);

    console.log(`trying to ping server ${serverUrl}`);
    serverTest.ping(
      CONFIG.timeout,
      CONFIG.defaultProtocolVersion,
      (err, res) => {
        console.log({ serverUrl, err, res });
        if (err) resolve(false);
        else if (res) {
          resolve(true);
        }

        reject(new Error("Server fetch unknown error"));
      },
    );
  });
}
