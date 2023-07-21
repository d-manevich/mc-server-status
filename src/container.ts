import { config } from "~/config";
import { createLogger } from "~/logger";
import { createPrisma } from "~/prisma";
import { createMcStore, McStore } from "~/mc-store";

export const createAppContainer = () => {
  const logger = createLogger(config);
  const prisma = createPrisma(logger);
  const store = createMcStore();

  return {
    config,
    logger,
    prisma,
    store
  };
};

export type Container = ReturnType<typeof createAppContainer>;
