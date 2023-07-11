import * as TelegramBot from "node-telegram-bot-api";
import { Message } from "node-telegram-bot-api";

export async function editSendMessage(
  bot: TelegramBot,
  chatId: number,
  text: string,
  messageId?: number,
): Promise<Message | null> {
  if (messageId) {
    try {
      const message = await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
      });
      if (typeof message === "object") {
        return message;
      }
    } catch (err) {
      console.warn("can't edit message", { chatId, messageId, text }, err);
    }
  }
  if (messageId) {
    try {
      await bot.deleteMessage(chatId, messageId);
    } catch (err) {
      console.error(`can't delete message`, { chatId, messageId }, err);
    }
  }
  try {
    const newMessage = await bot.sendMessage(chatId, text, {
      disable_notification: true,
    });
    await bot.pinChatMessage(chatId, newMessage.message_id, {
      disable_notification: true,
    });
    return newMessage;
  } catch (err) {
    console.warn(`Error: `, { chatId, text }, err);
  }
  return null;
}
