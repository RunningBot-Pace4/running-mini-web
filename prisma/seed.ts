import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { DEFAULT_HOME_CONTENT, HOME_CONTENT_KEY } from "../lib/site-content";
import { DEFAULT_SCORE_SETTING, SCORE_SETTING_KEY } from "../lib/score-config";
import { DEFAULT_MEMBER_TIERS } from "../lib/member-progress";

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

  await prisma.scoreSetting.upsert({
    where: { key: SCORE_SETTING_KEY },
    update: {},
    create: {
      key: SCORE_SETTING_KEY,
      ...DEFAULT_SCORE_SETTING,
    },
  });



  for (const tier of DEFAULT_MEMBER_TIERS) {
    await prisma.tierBenefit.upsert({
      where: { tier: tier.key },
      update: {},
      create: {
        tier: tier.key,
        minPoints: tier.minPoints,
        benefit: tier.benefit,
        discount: tier.discount,
      },
    });
  }

  const sampleRewards = [
    {
      name: "Club Finisher Voucher",
      type: "VOUCHER" as const,
      description: "Sample RM10 club voucher. Edit or hide this from Admin → Redemptions.",
      costPoints: 80,
      minTier: "SILVER" as const,
      stockQuantity: 20,
      voucherCode: "ADMIN TO ISSUE",
    },
    {
      name: "Training Day Sticker Pack",
      type: "ITEM" as const,
      description: "Sample small item reward for active members.",
      costPoints: 40,
      minTier: "BRONZE" as const,
      stockQuantity: 50,
      voucherCode: null,
    },
  ];

  for (const reward of sampleRewards) {
    const exists = await prisma.reward.findFirst({ where: { name: reward.name } });
    if (!exists) {
      await prisma.reward.create({ data: { ...reward, isActive: true } });
    }
  }

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
