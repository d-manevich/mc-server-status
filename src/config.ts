import "dotenv/config";
import * as path from "path";

import "dotenv/config";
import { API_CONSTANTS } from "grammy";
import z from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  LOG_LEVEL: z.enum([
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
    "silent",
  ]),
  DATABASE_URL: z.string(),
  BOT_SERVER_HOST: z.string().default("0.0.0.0"),
  BOT_SERVER_PORT: z.coerce.number().positive().default(80),
  BOT_ALLOWED_UPDATES: z.preprocess(
    (v: unknown) => {
      try {
        return JSON.parse(String(v));
      } catch {
        /* empty */
      }
    },
    z.array(z.enum(API_CONSTANTS.ALL_UPDATE_TYPES)),
  ),
  BOT_TOKEN: z.string(),
  BOT_WEBHOOK: z.string().url().optional(),
  BOT_ADMIN_USER_ID: z.coerce.number().finite(),
  SENTRY_DSN: z.string().optional(),
});

const parseConfig = (environment: NodeJS.ProcessEnv) => {
  const config = configSchema.parse(environment);

  return {
    ...config,
    isDev: config.NODE_ENV === "development",
    isProd: config.NODE_ENV === "production",
  };
};

export type Config = ReturnType<typeof parseConfig>;

export const config = parseConfig(process.env);

export const CONFIG = {
  pingTimeoutMs: 5_000,
  minecraftPollingIntervalMs: 2_000,
  defaultProtocolVersion: process.env.PROTOCOL_VERSION
    ? Number(process.env.PROTOCOL_VERSION)
    : 763, // 1.7.1 from https://wiki.vg/Protocol_version_numbers
  token: process.env.TG_TOKEN,
  userMockId: "00000000-0000-0000-0000-000000000000", // Getting this ID from server if user is logging in
  thresholdToShowOfflinePlayersMs: 24 * 60 * 60_000,
  cache: {
    filePath: path.join(process.cwd(), "store-cache.json"),
    intervalMs: 60_000,
  },
};
