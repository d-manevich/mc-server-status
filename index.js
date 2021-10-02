const TIMEOUT = 10000
const PROTOCOL_VERSION = 756 // 1.7.1 from https://wiki.vg/Protocol_version_numbers
const SERVER_LINK = 'vas3k.mcserver.us'
const TOKEN = '2010523624:AAEdIItSqt2Ufo6SvWD2J8Ymygcj6p3Tl9k'

const TelegramBot = require('node-telegram-bot-api')
const mcping = require('mcping-js')

console.log('init telegram bot')
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TOKEN, {polling: true});

function startBot(msg) {
  const chatId = msg.chat.id

  const server = new mcping.MinecraftServer(SERVER_LINK)

  let cachedOnline = ''
  let cachedPlayers = ''

  function logPlayers(err, res) {
    const { players: { max, online, sample = [] } } = res
    const playerNames = sample.map(player => player.name);
    const onlineInfo = `${online}/${max}`
    const playersInfo = playerNames.join(', ')

    if (onlineInfo !== cachedOnline && playersInfo !== cachedPlayers) {
      cachedOnline = onlineInfo
      cachedPlayers = playersInfo

      console.log({ online: onlineInfo, players: playersInfo })
      const text = `online: ${onlineInfo}${playersInfo ? `, players: ${playersInfo}` : ''}`
      bot.sendMessage(chatId, text)
    }
  }

  setInterval(() => {
    server.ping(TIMEOUT, PROTOCOL_VERSION, logPlayers)
  }, 2000)

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message')
}

bot.setMyCommands([
  { command: '/start', description: 'Start live status for server adress' },
  { command: '/stop', description: 'Stop live status' },
])

bot.on('message', async (msg) => {
  console.log(msg)
  if (!msg?.text) return
 
  if (msg.text.startsWith('/start')) {
    return startBot(msg)
  }

  if (msg.text === '/stop') {
    return
  }

  return bot.sendMessage(msg.chat.id, 'Unknown command')
});
