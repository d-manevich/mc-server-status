import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // you will write your Prisma Client Upserts here
}

try {
  await main();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error);
} finally {
  await prisma.$disconnect();
}
