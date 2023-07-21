import { autoChatAction } from "@grammyjs/auto-chat-action";
import { hydrate } from "@grammyjs/hydrate";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { autoRetry } from "@grammyjs/auto-retry";
import { limit } from "@grammyjs/ratelimiter";
import { apiThrottler } from "@grammyjs/transformer-throttler";
import { BotConfig, StorageAdapter, Bot as TelegramBot } from "grammy";
import { Context, createContextConstructor } from "~/bot/context";
import { metrics } from "~/bot/middlewares/metrics.middleware";
import { isMultipleLocales } from "~/bot/i18n";
import type { Container } from "~/container";
import { updateChatAndUsers } from "~/bot/middlewares/update-chat-and-users.middleware";
import { updateLogger } from "~/bot/middlewares/update-logger.middleware";
import { session } from "~/bot/middlewares/session.middleware";
import { setScope } from "~/bot/middlewares/set-scope.middleware";
import { i18n } from "~/bot/middlewares/i18n.middleware";
import { botAdminFeature } from "~/bot/features/bot-admin.feature";
import { welcomeFeature } from "~/bot/features/welcome.feature";
import { errorFeature } from "~/bot/features/error.feature";
import { languageFeature } from "~/bot/features/language.feature";
import { unhandledFeature } from "~/bot/features/unhandled.feature";
import { errorHandler } from "~/bot/handlers/error.handler";
import { serverManagementFeature } from "~/bot/features/server-management.feature";

type Dependencies = {
  container: Container;
  sessionStorage: StorageAdapter<unknown>;
};

export const createBot = (
  token: string,
  { container, sessionStorage }: Dependencies,
  botConfig?: Omit<BotConfig<Context>, "ContextConstructor">,
) => {
  const { config } = container;
  const bot = new TelegramBot(token, {
    ...botConfig,
    ContextConstructor: createContextConstructor(container),
  });

  // Middlewares

  bot.api.config.use(autoRetry());
  bot.api.config.use(apiThrottler());
  bot.api.config.use(parseMode("HTML"));

  if (config.isDev) {
    bot.use(updateLogger());
  }

  bot.use(metrics());
  bot.use(limit());
  bot.use(autoChatAction());
  bot.use(hydrateReply);
  bot.use(hydrate());
  bot.use(session(sessionStorage));
  bot.use(setScope());
  bot.use(updateChatAndUsers());
  bot.use(i18n());

  // Handlers

  bot.use(botAdminFeature);
  bot.use(welcomeFeature);
  bot.use(serverManagementFeature);
  bot.use(errorFeature);

  if (isMultipleLocales) {
    bot.use(languageFeature);
  }

  bot.use(unhandledFeature);

  bot.catch(errorHandler);

  return bot;
};

export type Bot = ReturnType<typeof createBot>;
