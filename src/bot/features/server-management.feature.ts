import { Composer } from "grammy";
import type { Context } from "~/bot/context";
import { logHandle } from "~/bot/helpers/logging";
import { CONFIG } from "~/config";
import { parseUrl } from "~/utils/parse-url";
import { pingMinecraftServer } from "~/ping-minecraft-server";
import z from "zod";
import isURL from "validator/lib/isURL";
import { getPlayersStat } from "~/get-server-status-message";

const composer = new Composer<Context>();

const feature = composer;

feature.command("add", logHandle("command-add"), async (ctx) => {
  if (ctx.match) {
    const [url, versionString] = ctx.match.split(" ");
    const isValidUrl = z
      .string()
      .refine((_url) =>
        isURL(_url, {
          allow_fragments: false,
          allow_query_components: false,
        }),
      )
      .safeParse(url).success;
    if (!isValidUrl) {
      await ctx.reply(ctx.t("add_command.incorrect_address"));
      return;
    }

    const version = versionString
      ? Number(versionString)
      : CONFIG.defaultProtocolVersion;
    try {
      const { host, port } = parseUrl(url);
      const isServerAvailable = await pingMinecraftServer(host, port, version);
      if (!isServerAvailable) {
        await ctx.reply(ctx.t("add_command.server_unavailable"));
      }

      const mcServer = ctx.store.init(url, version);
      const mcChat = mcServer.chats.find((c) => c.chatId === ctx.chat.id);
      if (mcChat) {
        await ctx.reply(ctx.t("add_command.server_existed", { url }));
        return;
      }
      mcServer.chats.push({ chatId: ctx.chat.id });
      ctx.store.cache();
      await ctx.reply(ctx.t("add_command.server_added", { url }));
    } catch (error) {
      await ctx.reply(ctx.t("errors.internal"));
      throw error;
    }
  }
});

feature.command("remove", logHandle("command-remove"), async (ctx) => {
  const url = ctx.match;
  if (url) {
    const mcServer = ctx.store.get(url, ctx.chat.id);
    if (!mcServer) {
      await ctx.reply(ctx.t("remove_command.server_not_added", { url }));
      return;
    }
    if (mcServer.chats.length === 1) {
      ctx.store.del(mcServer);
    } else {
      mcServer.chats.splice(
        mcServer.chats.findIndex((c) => c.chatId === ctx.chat.id),
        1,
      );
    }
    ctx.store.cache();
    await ctx.reply(ctx.t("remove_command.server_removed", { url }));
  }
});

feature.command("stop", logHandle("command-stop"), async (ctx) => {
  const servers = ctx.store.getAll(ctx.chat.id);
  for (const server of servers) {
    ctx.store.del(server);
  }
  ctx.store.cache();
  await ctx.reply(ctx.t("stop_command.all_servers_removed"));
});

feature.command("stat", logHandle("command-stat"), async (ctx) => {
  // TODO: this command equals to /month command. Fix it
  const servers = ctx.store.getAll(ctx.chat.id);
  for (const server of servers) {
    // respect the rate limit
    // eslint-disable-next-line no-await-in-loop
    await ctx.reply(
      [
        ctx.t("stat_command.stats_header"),
        getPlayersStat(server.players, Number.POSITIVE_INFINITY),
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  }
});

feature.command("month", logHandle("command-month"), async (ctx) => {
  const servers = ctx.store.getAll(ctx.chat.id);
  for (const server of servers) {
    // respect the rate limit
    // eslint-disable-next-line no-await-in-loop
    await ctx.reply(
      [
        ctx.t("month_command.stats_header"),
        getPlayersStat(server.players, Number.POSITIVE_INFINITY),
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  }
});

export { composer as serverManagementFeature };
