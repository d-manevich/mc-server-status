import { Update, UserFromGetMe } from "@grammyjs/types";
import { UserPayload } from "@prisma/client";
import { type Api, Context as DefaultContext, SessionFlavor } from "grammy";
import type { Container } from "~/container";
import { Logger } from "~/logger";

import { AutoChatActionFlavor } from "@grammyjs/auto-chat-action";
import { HydrateFlavor } from "@grammyjs/hydrate";
import { I18nFlavor } from "@grammyjs/i18n";
import { ParseModeFlavor } from "@grammyjs/parse-mode";
import { PrismaClientX } from "~/prisma";
import { McStore } from "~/mc-store";

type ScopeUser = Omit<
  UserPayload<PrismaClientX["$extends"]["extArgs"]>["scalars"],
  "updatedAt" | "createdAt" | "chatId"
>;

export interface ContextScope {
  user?: ScopeUser;
  me?: ScopeUser; // bot
}

type ExtendedContextFlavor = {
  container: Container;
  prisma: PrismaClientX;
  logger: Logger;
  scope: ContextScope;
  store: McStore; // TODO replace with DB
};

export type ContextScopeWith<P extends keyof ContextScope> = Record<
  "scope",
  Record<P, NonNullable<ContextScope[P]>>
>;

type SessionData = {
  // field?: string;
};

export type Context = ParseModeFlavor<
  HydrateFlavor<
    DefaultContext &
      ExtendedContextFlavor &
      SessionFlavor<SessionData> &
      I18nFlavor &
      AutoChatActionFlavor
  >
>;

export function createContextConstructor(container: Container) {
  return class extends DefaultContext implements ExtendedContextFlavor {
    container: Container;

    prisma: PrismaClientX;

    logger: Logger;

    scope: ContextScope;

    store: McStore;

    constructor(update: Update, api: Api, me: UserFromGetMe) {
      super(update, api, me);

      this.container = container;
      this.prisma = container.prisma;
      this.logger = container.logger.child({
        update_id: this.update.update_id,
      });
      this.scope = {};
      this.store = container.store;
    }
  } as unknown as new (update: Update, api: Api, me: UserFromGetMe) => Context;
}
