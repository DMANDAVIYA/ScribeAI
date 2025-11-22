import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Create demo user
    const user = await prisma.user.upsert({
        where: { id: "demo-user-id" },
        update: {},
        create: {
            id: "demo-user-id",
            email: "demo@scribeai.com",
            name: "Demo User",
            password: "demo-password-hash", // In production, this should be properly hashed
        },
    });

    console.log("✅ Demo user created:", user);
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
