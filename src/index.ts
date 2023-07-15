import {
  getServerStatusMessage,
  getPlayersStat,
} from "./get-server-status-message";
import { PingResponse } from "mcping-js";
import * as TelegramBot from "node-telegram-bot-api";
import { pingMinecraftServer } from "./ping-minecraft-server";
import { CONFIG } from "./config";
import { editSendMessage } from "./edit-send-message";
import { parseServerStatus } from "./parse-server-status";
import { parseUrl } from "./utils/parse-url";
import { McServer } from "./models/mc-server";
import * as fs from "fs";
import { McStore } from "./mc-store";
import { delay } from "./delay";

function cacheStore(store: McStore) {
  try {
    fs.writeFileSync(CONFIG.cache.filePath, store.serialize(), {
      encoding: "utf8",
    });
  } catch (err) {
    console.error(err);
  }
}

function start() {
  if (!CONFIG.token) throw new Error("You need to specify telegram bot token");

  const store = new McStore();
  try {
    store.deserialize(
      fs.readFileSync(CONFIG.cache.filePath, {
        encoding: "utf8",
      }),
    );
  } catch (err) {
    console.warn(err);
  }

  console.log("init telegram bot");
  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(CONFIG.token, { polling: true });

  bot.setMyCommands([
    { command: "/add", description: "Add server for live status updates" },
    {
      command: "/remove",
      description: "Delete server from live status updates",
    },
    { command: "/stop", description: "Stop live status" },
    { command: "/stat", description: "All time online stats" },
    { command: "/month", description: "Online stats for this month" },
  ]);

  bot.onText(/\/add (.+)/, async (msg, match) => {
    if (match?.[1]) {
      await subscribe(
        msg.chat.id,
        match[1],
        match[2] ? Number(match[2]) : CONFIG.defaultProtocolVersion,
      );
    }
  });

  bot.onText(/\/remove (.+)/, async (msg, match) => {
    if (match?.[1]) {
      await unsubscribe(msg.chat.id, match[1]);
    }
  });

  bot.onText(/\/stop/, async (msg) => {
    await unsubscribeAll(msg.chat.id);
  });

  bot.onText(/\/month/, async (msg) => {
    const servers = store.getAll(msg.chat.id);
    for (const server of servers) {
      void bot.sendMessage(
        msg.chat.id,
        [
          "*Online stats for this month*",
          getPlayersStat(server.players, Infinity),
        ].join("\n"),
        { parse_mode: "Markdown" },
      );
    }
  });

  bot.onText(/\/stat/, async (msg) => {
    const servers = store.getAll(msg.chat.id);
    for (const server of servers) {
      void bot.sendMessage(
        msg.chat.id,
        [
          "*All time online stats*",
          getPlayersStat(server.players, Infinity),
        ].join("\n"),
        { parse_mode: "Markdown" },
      );
    }
  });

  bot.on("pinned_message", async (msg) => {
    const me = await bot.getMe();
    const isItMyPin = msg.from?.id === me.id;
    if (isItMyPin) {
      try {
        await bot.deleteMessage(msg.chat.id, msg.message_id);
      } catch (e) {
        console.error("Could not delete message ", msg.message_id);
        if (e instanceof Error) {
          console.error(e.message);
        }
      }
    }
  });

  async function subscribe(
    chatId: number,
    url: string,
    version: number = CONFIG.defaultProtocolVersion,
  ) {
    try {
      const { host, port } = parseUrl(url);
      try {
        const isServerAvailable = await pingMinecraftServer(
          host,
          port,
          version,
        );
        if (!isServerAvailable) {
          throw new Error("Invalid minecraft server");
        }
      } catch (error) {
        throw new Error("Invalid minecraft server");
      }
      const mcServer = store.init(url, version);
      const mcChat = mcServer.chats.find((c) => c.chatId === chatId);
      if (mcChat) {
        throw new Error(`${url} is already added`);
      }
      mcServer.chats.push({ chatId });
      cacheStore(store);
      await bot.sendMessage(chatId, `Server ${url} is successfully added`);
    } catch (error) {
      if (error instanceof Error) {
        await bot.sendMessage(chatId, error.message);
      }
    }
    return;
  }

  async function unsubscribe(chatId: number, url: string) {
    try {
      const mcServer = store.get(url, chatId);
      if (!mcServer) {
        throw new Error(`${url} was not added`);
      }
      if (mcServer.chats.length === 1) {
        store.del(mcServer);
      } else {
        mcServer.chats.splice(
          mcServer.chats.findIndex((c) => c.chatId === chatId),
          1,
        );
      }
      cacheStore(store);
      await bot.sendMessage(chatId, `Server ${url} is successfully removed`);
    } catch (error) {
      if (error instanceof Error) {
        await bot.sendMessage(chatId, error.message);
      }
    }
  }

  async function unsubscribeAll(chatId: number) {
    const mcServers = store.getAll(chatId);
    for (const mcServer of mcServers) {
      store.del(mcServer);
    }
    cacheStore(store);
    await bot.sendMessage(chatId, "Unsubscribe from all servers");
  }

  async function onServerUpdate(
    server: McServer,
    res?: PingResponse,
    err?: unknown,
  ) {
    if (err) {
      console.error(err);
    }
    if (!res || !Object.keys(res).length) {
      console.error("Empty server response");
    }
    const oldServerStatusMessage = getServerStatusMessage(server);
    const newServerStatus = parseServerStatus(res, server);
    server.maxPlayers = newServerStatus.maxPlayers;
    server.players = newServerStatus.players;
    server.hasError = !!err;
    const serverStatusMessage = getServerStatusMessage(server);
    if (serverStatusMessage !== oldServerStatusMessage) {
      await Promise.allSettled(
        server.chats.map(async (c) => {
          const message = await editSendMessage(
            bot,
            c.chatId,
            serverStatusMessage,
            c.messageId,
          );
          if (message) {
            // TODO: Notify the channel if it failed to update or send a message?
            c.messageId = message.message_id;
          }
        }),
      );
    }
  }

  // Not just an interval to make the next requests only after getting the results of the current one
  async function pingAll() {
    await delay(CONFIG.minecraftPollingIntervalMs);
    await Promise.allSettled(
      store.getAll().map(async (s) => {
        try {
          const res = await pingMinecraftServer(s.host, s.port, s.version);
          await onServerUpdate(s, res);
        } catch (err) {
          await onServerUpdate(s, undefined, err);
        }
      }),
    );
    await pingAll();
  }

  void pingAll();

  setInterval(() => {
    cacheStore(store);
  }, CONFIG.cache.intervalMs);
}

start();
