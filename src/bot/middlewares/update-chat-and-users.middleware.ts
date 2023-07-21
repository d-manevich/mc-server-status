import { Context } from "~/bot/context";
import { Middleware } from "grammy";
import { Prisma } from "@prisma/client";

export const updateChatAndUsers = (): Middleware<Context> => {
  return async (ctx, next) => {
    const { message, prisma, logger } = ctx;
    if (!message?.chat) {
      return next();
    }
    const queries: Prisma.PrismaPromise<unknown>[] = [];

    if (message.from?.id === ctx.me.id) {
      // saving bot message
      queries.push(prisma.botMessage.upsert({
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
          botId: ctx.me.id,
          date: new Date(message.date * 1000),
        },
        update: {},
      }));
    } else {
      const { chat, from } = message;
      const chatDto: Prisma.ChatCreateInput = {
        id: chat.id,
        type: chat.type,
      };
      queries.push(
        prisma.chat.upsert({
          where: {
            id: chat.id,
          },
          create: chatDto,
          update: {},
        }),
      );
      queries.push(
        prisma.user.update({
          where: ctx.prisma.user.byTelegramId(from.id),
          data: {
            chats: {
              connect: {
                id: chat.id,
              },
            },
          },
        }),
      );

      await prisma.$transaction(queries);

      return next();
    }
  };
};

function saveBotMessage() {

}