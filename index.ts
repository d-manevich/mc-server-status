import {
  getServerStatusMessage,
  ServerStatus,
} from "./src/update-server-status";
import { MinecraftServer, PingResponse } from "mcping-js";
import * as TelegramBot from "node-telegram-bot-api";
import type { Message } from "node-telegram-bot-api";

const TIMEOUT = 10000;
const MINECRAFT_POLLING_INTERVAL_MS = 2000;

const PROTOCOL_VERSION: number = process.env.PROTOCOL_VERSION
  ? Number(process.env.PROTOCOL_VERSION)
  : 763; // 1.7.1 from https://wiki.vg/Protocol_version_numbers
const TOKEN = process.env.TG_TOKEN;

// Getting this ID from server if user is logging in
const USER_MOCK_ID: string = "00000000-0000-0000-0000-000000000000";

if (!TOKEN) throw new Error("You need to specify telegram bot token");

const SERVERS_AND_CHATS_TO_NOTIFY: Record<string, number[]> = {}; // { 'server url': [chatId, ...] }
const CACHED_STATUSES = new Map<string, ServerStatus>();
const CHATS_MESSAGES: Record<string, Map<number, number>> = {}; // { 'server url': { chatId: messageId } }

console.log("init telegram bot");
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TOKEN, { polling: true });

bot.setMyCommands([
  { command: "/add", description: "Add server for live status updates" },
  { command: "/remove", description: "Delete server from live status updates" },
  { command: "/stop", description: "Stop live status" },
]);

function parseServerStatus(
  res: PingResponse,
  prevStatus?: ServerStatus,
): ServerStatus {
  const {
    players: { max, sample = [] },
  } = res;
  const online = sample
    .filter((player) => player.id !== USER_MOCK_ID)
    .map((player) => ({
      ...player,
      lastOnline: new Date(),
    }));
  const offline = [
    ...(prevStatus?.online || []),
    ...(prevStatus?.offline || []),
  ].filter((p) => online.every((onlinePlayer) => onlinePlayer.id !== p.id));
  return {
    server: {
      max,
    },
    online,
    offline,
  };
}

function parseUrlForHostAndPort(serverUrl: string) {
  const [host, port] = serverUrl.split(":");
  let portNumber: number | undefined = +port;
  if (portNumber <= 0 || isNaN(portNumber)) {
    portNumber = undefined;
  }
  return { host, port: portNumber };
}

function parseTelegramMessageForServerUrl(msg: TelegramBot.Message) {
  const { entities, text } = msg;
  const urlEntity = entities?.find((entity) => entity.type === "url"); // undefined || { offset: 7, length: 9, type: 'url' }

  if (!urlEntity) {
    throw new Error("You need to specify server url");
  }
  if (!text) {
    throw new Error("You need to specify text");
  }
  const serverUrl = text.substring(
    urlEntity.offset,
    urlEntity.offset + urlEntity.length,
  );
  if (!serverUrl) {
    throw new Error("Incorrect server URL: " + serverUrl);
  }
  return serverUrl;
}

function isMinecraftServerAvailable(
  serverUrl: string,
  host: string,
  port: number | undefined,
) {
  return new Promise<boolean>((resolve, reject) => {
    console.log(`trying to connect to server ${serverUrl}`);

    const serverTest = new MinecraftServer(host, port);

    console.log(`trying to ping server ${serverUrl}`);
    serverTest.ping(TIMEOUT, PROTOCOL_VERSION, (err, res) => {
      console.log({ serverUrl, err, res });
      if (err) resolve(false);
      else if (res) {
        resolve(true);
      }

      reject(new Error("Server fetch unknown error"));
    });
  });
}

async function parseStartMsgUrl(msg: Message) {
  const url = parseTelegramMessageForServerUrl(msg);
  const { host, port } = parseUrlForHostAndPort(url);

  return { url, host, port };
}

async function subscribe(msg: Message) {
  const { chat } = msg;

  try {
    const { url, host, port } = await parseStartMsgUrl(msg);
    try {
      const isServerAvailable = await isMinecraftServerAvailable(
        url,
        host,
        port,
      );
      if (!isServerAvailable) {
        throw new Error("Invalid minecraft server");
      }
    } catch (error) {
      throw new Error("Invalid minecraft server");
    }

    const subscribedChats = SERVERS_AND_CHATS_TO_NOTIFY[url];
    if (subscribedChats?.find((subscribedChat) => subscribedChat === chat.id)) {
      throw new Error(`${url} is already added`);
    }

    if (!subscribedChats) {
      SERVERS_AND_CHATS_TO_NOTIFY[url] = [chat.id];
    } else {
      SERVERS_AND_CHATS_TO_NOTIFY[url].push(chat.id);
    }
    await bot.sendMessage(chat.id, `Server ${url} is successfully added`);

    let cachedStatus = CACHED_STATUSES.get(url);
    if (cachedStatus) {
      await bot.sendMessage(chat.id, getServerStatusMessage(url, cachedStatus));
    }
  } catch (error) {
    if (error instanceof Error) {
      await bot.sendMessage(chat.id, error.message);
    }
  }
  return;
}

async function unsubscribe(msg: Message) {
  const { chat } = msg;

  try {
    const { url } = await parseStartMsgUrl(msg);
    const subscribedChats = SERVERS_AND_CHATS_TO_NOTIFY[url];
    if (
      !subscribedChats ||
      !subscribedChats.find((subscribedChat) => subscribedChat === chat.id)
    ) {
      throw new Error(`${url} was not added`);
    }

    SERVERS_AND_CHATS_TO_NOTIFY[url] = subscribedChats.filter(
      (chatId) => chatId !== chat.id,
    );
    await bot.sendMessage(chat.id, `Server ${url} is successfully removed`);
  } catch (error) {
    if (error instanceof Error) {
      await bot.sendMessage(chat.id, error.message);
    }
  }
  return;
}

async function unsubscribeAll(msg: Message) {
  const { chat } = msg;

  Object.keys(SERVERS_AND_CHATS_TO_NOTIFY).forEach((url) => {
    const chats = SERVERS_AND_CHATS_TO_NOTIFY[url];
    SERVERS_AND_CHATS_TO_NOTIFY[url] = chats.filter(
      (chatId) => chatId !== chat.id,
    );
  });

  await bot.sendMessage(chat.id, "Unsubscribe from all servers");
}

bot.on("message", async (msg) => {
  if (!msg?.text) return;

  if (msg.text.startsWith("/add")) {
    return subscribe(msg);
  }

  if (msg.text.startsWith("/remove")) {
    return unsubscribe(msg);
  }

  if (msg.text === "/stop") {
    return unsubscribeAll(msg);
  }

  return bot.sendMessage(msg.chat.id, "Unknown command");
});

bot.on("pinned_message", async (msg) => {
  const me = await bot.getMe();
  const isItMyPin = msg.from?.id === me.id;
  if (isItMyPin) {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
  }
});

async function editMessage(
  chatId: number,
  messageId: number | undefined,
  text: string,
) {
  if (!messageId) {
    return false;
  }
  try {
    const editedMessageResult = await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
    });
    return !!editedMessageResult;
  } catch (err) {
    console.log("can't edit message", { chatId, messageId, text }, err);
  }
  return false;
}

async function updateStatusMessage(url: string, chatId: number, text: string) {
  if (!CHATS_MESSAGES[url]) {
    CHATS_MESSAGES[url] = new Map();
  }
  const server = CHATS_MESSAGES[url];
  const messageId = server.get(chatId);
  let messageWasEdited = await editMessage(chatId, messageId, text);
  try {
    if (messageId && !messageWasEdited) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (err) {
        console.error(`can't delete message`, { chatId, messageId }, err);
      }
    }
    if (!messageId || !messageWasEdited) {
      const newMessage = await bot.sendMessage(chatId, text, {
        disable_notification: true,
      });
      server.set(chatId, newMessage.message_id);
      await bot.pinChatMessage(chatId, newMessage.message_id, {
        disable_notification: true,
      });
    }
  } catch (err) {
    console.error(`Error: `, { chatId, text }, err);
  }
}

const CACHED_MESSAGES = new Map<string, string>();
function onServerUpdate(url: string, err?: Error, res?: PingResponse) {
  if (err) {
    console.error(err);
    return;
  }

  if (!res || !Object.keys(res).length) {
    console.error("Empty server response");
    return;
  }
  const prevStatus = CACHED_STATUSES.get(url);
  const status = parseServerStatus(res, prevStatus);
  const currentServerStatusMessage = getServerStatusMessage(url, status);
  if (currentServerStatusMessage !== CACHED_MESSAGES.get(url)) {
    CACHED_STATUSES.set(url, status);
    CACHED_MESSAGES.set(url, currentServerStatusMessage);

    SERVERS_AND_CHATS_TO_NOTIFY[url].forEach((chatId) => {
      void updateStatusMessage(url, chatId, currentServerStatusMessage);
    });
  }
}

setInterval(() => {
  Object.keys(SERVERS_AND_CHATS_TO_NOTIFY).forEach((url) => {
    const subscribedChats = SERVERS_AND_CHATS_TO_NOTIFY[url];
    if (subscribedChats.length) {
      const [host, port] = url.split(":");
      const server = new MinecraftServer(host, Number(port));
      server.ping(TIMEOUT, PROTOCOL_VERSION, (err, res) =>
        onServerUpdate(url, err, res),
      );
    }
  });
}, MINECRAFT_POLLING_INTERVAL_MS);
