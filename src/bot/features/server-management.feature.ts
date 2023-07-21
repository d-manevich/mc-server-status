import { Composer } from "grammy";
import type { Context } from "~/bot/context";
import { logHandle } from "~/bot/helpers/logging";
import { CONFIG } from "~/config";
import { parseUrl } from "~/utils/parse-url";
import { pingMinecraftServer } from "~/ping-minecraft-server";
import z from "zod";
import isURL from "validator/lib/isURL";

const composer = new Composer<Context>();

const feature = composer;

feature.command("add", logHandle("command-add"), async (ctx) => {
    if (ctx.match) {
      const [url, versionStr] = ctx.match.split(" ");
      const isValidUrl = z.string().refine((url) => isURL(url, { allow_fragments: false, allow_query_components: false })).safeParse(url).success;
      if (!isValidUrl) {
        await ctx.reply(ctx.t("add_command.incorrect_address"));
        return;
      }

      const version = versionStr ? Number(versionStr) : CONFIG.defaultProtocolVersion;
      try {
        const { host, port } = parseUrl(url);
        const isServerAvailable = await pingMinecraftServer(
          host,
          port,
          version,
        );
        if (!isServerAvailable) {
          await ctx.reply(ctx.t("add_command.server_unavailable"));
        }

        const mcServer = ctx.store.init(url, version);
        const mcChat = mcServer.chats.find((c) => c.chatId === ctx.chat.id);
        if (mcChat) {
          await ctx.reply(ctx.t("add_command.existed_server", { url }));
        }
        mcServer.chats.push({ chatId: ctx.chat.id });
        ctx.store.cache();
        await ctx.reply(ctx.t("add_command.server_added", { url }));
      } catch (error) {
        await ctx.reply(ctx.t("errors.internal"));
        throw error;
      }
    }
  },
);

feature.command("remove", logHandle("command-remove"), (ctx) => {

  },
);

feature.command("stop", logHandle("command-stop"), (ctx) => {

  },
);

feature.command("stat", logHandle("command-stat"), (ctx) => {

  },
);

feature.command("month", logHandle("command-month"), (ctx) => {

  },
);


export { composer as serverManagementFeature };
