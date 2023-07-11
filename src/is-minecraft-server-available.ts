import { MinecraftServer } from "mcping-js";
import { APP_CONFIG } from "./app-config";

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
      APP_CONFIG.timeout,
      APP_CONFIG.protocolVersion,
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
