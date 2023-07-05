const TIMEOUT = 10000
const PROTOCOL_VERSION = process.env.PROTOCOL_VERSION || 763 // 1.7.1 from https://wiki.vg/Protocol_version_numbers
const TOKEN = process.env.TG_TOKEN

// Getting this ID from server if user is logging in
const USER_MOCK_ID = "00000000-0000-0000-0000-000000000000"

if (!TOKEN) throw new Error('You need to specify telegram bot token');

const TelegramBot = require('node-telegram-bot-api')
const mcping = require('mcping-js')

const SERVERS_AND_CHATS_TO_NOTIFY = {} // { 'server url': [chatId, ...] }
const CACHED_STATUSES = {} // { 'server url': { online: String, players: String } }
const CHATS_MESSAGES = {} // { 'server url': { chatId: messageId } }

console.log('init telegram bot')
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TOKEN, {polling: true})


bot.setMyCommands([
  { command: '/add', description: 'Add server for live status updates' },
  { command: '/remove', description: 'Delete server from live status updates' },
  { command: '/stop', description: 'Stop live status' },
])

function parseServerStatus(res) {
  const { players: { max, online, sample = [] } } = res
  const playerList = sample
    .filter(player => player.id !== USER_MOCK_ID)
    .map(player => player.name)
    .sort();
  const onlineInfo = `${online}/${max}`
  const playersInfo = playerList.join(', ')

  return {
    online,
    onlineInfo: onlineInfo,
    playersInfo: playersInfo,
    playerList,
  }
}

function cacheStatus(url, online, players) {
  CACHED_STATUSES[url] = {
    online,
    players,
  }
}

async function parseStartMsgUrl(msg) {
  const { entities, chat, text } = msg
  const urlEntity = entities.find(entity => entity.type === 'url') // undefined || { offset: 7, length: 9, type: 'url' }

  if (!urlEntity) {
    throw new Error('You need to specify server url')
  }
  console.log('url entity found')
  const serverUrl = text.substring(urlEntity.offset, urlEntity.offset + urlEntity.length)
  const [host, port] = serverUrl.split(':');
  try {
    await new Promise((resolve, reject) => {
      console.log(`try to connect to server ${serverUrl}`)
      const serverTest = new mcping.MinecraftServer(host, port)

      console.log(`try to ping server ${serverUrl}`)
      serverTest.ping(TIMEOUT, PROTOCOL_VERSION, (err, res) => {
        console.log({ serverUrl, err, res })
        if (err) reject(err)
        else if (res) {
          resolve(res)
        }

        reject(new Error('Server fetch unknown error'))
      })
    })
  } catch (error) {
    throw new Error('Invalid minecraft server')
  }

  console.log('minecraft server ping success')
  return serverUrl
}

async function subscribe(msg) {
  const { chat } = msg

  try {
    const url = await parseStartMsgUrl(msg)
    const subscribedChats = SERVERS_AND_CHATS_TO_NOTIFY[url]
    if (subscribedChats && subscribedChats.find(subscribedChat => subscribedChat === chat.id)) {
      throw new Error(`${url} is already added`)
    }

    if (!subscribedChats) {
      SERVERS_AND_CHATS_TO_NOTIFY[url] = [chat.id]
    } else {
      SERVERS_AND_CHATS_TO_NOTIFY[url].push(chat.id)
    }
    bot.sendMessage(chat.id, `Server ${url} is successfully added`)
    
    if (CACHED_STATUSES[url]) {
      const { online, players } = CACHED_STATUSES[url]
      const text = `${url}\nonline: ${online}${players ? `, players: ${players}` : ''}`
      bot.sendMessage(chat.id, text)
    }
  } catch (error) {
    bot.sendMessage(chat.id, error.message)
  }
  return
}

async function unsubscribe(msg) {
  const { chat } = msg

  try {
    const url = await parseStartMsgUrl(msg)
    const subscribedChats = SERVERS_AND_CHATS_TO_NOTIFY[url]
    if (!subscribedChats || !subscribedChats.find(subscribedChat => subscribedChat === chat.id)) {
      throw new Error(`${url} was not added`)
    }

    SERVERS_AND_CHATS_TO_NOTIFY[url] = subscribedChats.filter(chatId => chatId !== chat.id)
    bot.sendMessage(chat.id, `Server ${url} is successfully removed`)
  } catch (error) {
    bot.sendMessage(chat.id, error.message)
  }
  return
}

function unsubscribeAll(msg) {
  const { chat } = msg

  Object.keys(SERVERS_AND_CHATS_TO_NOTIFY).forEach(url => {
    const chats = SERVERS_AND_CHATS_TO_NOTIFY[url]
    SERVERS_AND_CHATS_TO_NOTIFY[url] = chats.filter(chatId => chatId !== chat.id)
  })

  bot.sendMessage(chat.id, 'Unsubscribe from all servers')
}

bot.on('message', async (msg) => {
  if (!msg?.text) return
 
  if (msg.text.startsWith('/add')) {
    return subscribe(msg)
  }

  if (msg.text.startsWith('/remove')) {
    return unsubscribe(msg)
  }

  if (msg.text === '/stop') {
    return unsubscribeAll(msg)
  }

  return bot.sendMessage(msg.chat.id, 'Unknown command')
});

bot.on('pinned_message', async (msg) => {
  const me = await bot.getMe();
  const isItMyPin = msg.from.id === me.id;
  if (isItMyPin) {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
  }
})

async function updateStatusMessage(url, chatId, text) {
  const messageId = CHATS_MESSAGES[url]?.[chatId]

  if (messageId) {
    try {
      const edited = await bot.editMessageText(text, { chat_id: chatId, message_id: messageId });
      if (edited) {
        return
      }
      await bot.deleteMessage(chatId, messageId)
    } catch (e) {
      console.log(`can't delete message`, { chatId, messageId, e })
    }
  }

  try {
    const message = await bot.sendMessage(chatId, text, { disable_notification: true })
    const pinned = await bot.pinChatMessage(chatId, message.message_id, { disable_notification: true });

    if (!CHATS_MESSAGES[url]) CHATS_MESSAGES[url] = { [chatId]: message.message_id }
    else CHATS_MESSAGES[url][chatId] = message.message_id
  } catch {
    console.log(`can't sent message`, { chatId, text })
  }
}

function onServerUpdate(url, err, res) {
  if (err) {
    console.log(err)
    return
  }

  if (!Object.keys(res).length) {
    console.log('Empry server response')
    return
  }
  console.log(res)
  const { online, onlineInfo, playersInfo, playerList } = parseServerStatus(res)

  if (online === playerList.length && onlineInfo !== CACHED_STATUSES[url]?.online && playersInfo !== CACHED_STATUSES[url]?.players) {
    cacheStatus(url, onlineInfo, playersInfo)

    const text = `${url}\nonline: ${onlineInfo}${playersInfo ? `, players: ${playersInfo}` : ''}`

    SERVERS_AND_CHATS_TO_NOTIFY[url].forEach(chatId => {
      updateStatusMessage(url, chatId, text)
    })
  }
}

setInterval(() => {
  Object.keys(SERVERS_AND_CHATS_TO_NOTIFY).forEach(url => {
    const subscribedChats = SERVERS_AND_CHATS_TO_NOTIFY[url]
    if (subscribedChats.length) {
      const [host, port] = url.split(':');
      const server = new mcping.MinecraftServer(host, port)
      server.ping(TIMEOUT, PROTOCOL_VERSION, (err, res) => onServerUpdate(url, err, res))
    }
  })
}, 2000)
