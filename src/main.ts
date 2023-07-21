#!/usr/bin/env tsx

import { Role } from "@prisma/client";
import { onShutdown } from "node-graceful-shutdown";
import { createBot } from "~/bot";
import { createAppContainer } from "~/container";
import { createServer } from "~/server";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import * as Sentry from "@sentry/node";
import { getSentryConfig } from "~/sentry.config";
import { CONFIG } from "~/config";
import { pingMinecraftServer } from "~/ping-minecraft-server";
import { McServer } from "~/models/mc-server";
import { PingResponse } from "mcping-js";
import { getServerStatusMessage } from "~/get-server-status-message";
import { parseServerStatus } from "~/parse-server-status";
import { editSendMessage } from "~/edit-send-message";
import { delay } from "~/delay";

const container = createAppContainer();

try {
  const { config, store, logger, prisma } = container;

  if (config.SENTRY_DSN) {
    Sentry.init(getSentryConfig(container));
  }

  const bot = createBot(config.BOT_TOKEN, {
    container,
    sessionStorage: new PrismaAdapter(prisma.session),
  });
  await bot.init();

  const server = await createServer(bot, container);

  // Graceful shutdown
  onShutdown(async () => {
    logger.info("shutting down...");

    await bot.stop();
    await server.close();
  });

  await prisma.$connect();

  // update bot owner role
  await prisma.user.upsert({
    where: { telegramId: config.BOT_ADMIN_USER_ID },
    create: {
      telegramId: config.BOT_ADMIN_USER_ID,
      role: Role.OWNER,
    },
    update: {
      role: Role.OWNER,
    },
  });

  // TODO refactor
  const onServerUpdate = async (
    mcServer: McServer,
    pingResponse?: PingResponse,
    error?: unknown,
  ) => {
    if (error) {
      Sentry.captureException(error);
    }
    if (!pingResponse || Object.keys(pingResponse).length === 0) {
      Sentry.captureException(new Error("Empty server response"));
    }
    const oldServerStatusMessage = getServerStatusMessage(mcServer);
    const newServerStatus = parseServerStatus(pingResponse, mcServer);
    // eslint-disable-next-line no-param-reassign
    mcServer.maxPlayers = newServerStatus.maxPlayers;
    // eslint-disable-next-line no-param-reassign
    mcServer.players = newServerStatus.players;
    // eslint-disable-next-line no-param-reassign
    mcServer.hasError = !!error;
    const serverStatusMessage = getServerStatusMessage(mcServer);
    if (serverStatusMessage !== oldServerStatusMessage) {
      await Promise.allSettled(
        mcServer.chats.map(async (c) => {
          const message = await editSendMessage(
            bot,
            container,
            c.chatId,
            serverStatusMessage,
            c.messageId,
          );
          if (message) {
            // TODO: Notify the channel if it failed to update or send a message?
            // eslint-disable-next-line no-param-reassign
            c.messageId = message.message_id;
          }
        }),
      );
    }
  };

  // Not just an interval to make the next requests only after getting the results of the current one
  const pingAll = async () => {
    await delay(CONFIG.minecraftPollingIntervalMs);
    await Promise.allSettled(
      store.getAll().map(async (s) => {
        try {
          const response = await pingMinecraftServer(s.host, s.port, s.version);
          await onServerUpdate(s, response);
        } catch (error) {
          await onServerUpdate(s, undefined, error);
        }
      }),
    );
    await pingAll();
  };

  pingAll();

  setInterval(() => {
    store.cache();
  }, CONFIG.cache.intervalMs);
  // TODO end refactor

  if (config.isProd) {
    await server.listen({
      host: config.BOT_SERVER_HOST,
      port: config.BOT_SERVER_PORT,
    });
  }
  // eslint-disable-next-line unicorn/prefer-ternary
  if (config.BOT_WEBHOOK) {
    await bot.api.setWebhook(config.BOT_WEBHOOK, {
      allowed_updates: config.BOT_ALLOWED_UPDATES,
    });
  } else {
    await bot.start({
      allowed_updates: config.BOT_ALLOWED_UPDATES,
      onStart: ({ username }) =>
        logger.info({
          msg: "bot running...",
          username,
        }),
    });
  }
} catch (error) {
  container.logger.error(error);
  process.exit(1);
}
