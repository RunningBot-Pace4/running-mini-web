import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { DEFAULT_HOME_CONTENT, HOME_CONTENT_KEY } from "../lib/site-content";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.ADMIN_NAME || "Admin";

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "ADMIN",
    },
    create: {
      email,
      name,
      role: "ADMIN",
      passwordHash: await hashPassword(password),
    },
  });

  await prisma.siteContent.upsert({
    where: { key: HOME_CONTENT_KEY },
    update: {},
    create: {
      key: HOME_CONTENT_KEY,
      ...DEFAULT_HOME_CONTENT,
    },
  });

  console.log(`Admin ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
