import * as path from "path";

export const APP_CONFIG = {
  timeout: 10000,
  minecraftPollingIntervalMs: 2000,
  defaultProtocolVersion: process.env.PROTOCOL_VERSION
    ? Number(process.env.PROTOCOL_VERSION)
    : 763, // 1.7.1 from https://wiki.vg/Protocol_version_numbers
  token: process.env.TG_TOKEN,
  userMockId: "00000000-0000-0000-0000-000000000000", // Getting this ID from server if user is logging in
  thresholdToShowOfflinePlayersMins: 60,
  cache: {
    filePath: path.join(process.cwd(), "store-cache.json"),
    intervalMs: 60_000,
  },
};
