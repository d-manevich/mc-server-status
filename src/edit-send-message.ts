import type { Bot } from "~/bot";
import { Message } from "@grammyjs/types";
import { Container } from "~/container";

export async function editSendMessage(
  bot:Bot,
  container: Container,
  chatId: number,
  text: string,
  messageId?: number,
): Promise<Message | null> {
  if (messageId) {
    try {
      const message = await bot.api.editMessageText(chatId, messageId, text, {
        parse_mode: "Markdown",
      });
      if (typeof message === "object") {
        return message;
      }
    } catch (err) {
      container.logger.warn("can't edit message", { chatId, messageId, text }, err);
    }
  }
  if (messageId) {
    try {
      await bot.api.deleteMessage(chatId, messageId);
    } catch (err) {
      container.logger.error("can't delete message", { chatId, messageId }, err);
    }
  }
  try {
    const message = await bot.api.sendMessage(chatId, text, {
      disable_notification: true,
      parse_mode: "Markdown",
    });
    const pinnedMessageMessage = await bot.api.pinChatMessage(chatId, message.message_id, {
      disable_notification: true,
    });
    container.prisma.botMessage.upsert({
      where: {
        messageId_chatId: {
          messageId: message.message_id,
          chatId: message.chat.id,
        },
      },
      create: {
        messageId: message.message_id,
        chatId: message.chat.id,
        text: message.text,
        botId: bot.botInfo.id,
        date: new Date(message.date * 1000),
        pinned: pinnedMessageMessage
      },
      update: {}
    });
    return message;
  } catch (err) {
    container.logger.warn("Error", { chatId, text }, err);
  }
  return null;
}
