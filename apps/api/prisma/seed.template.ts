import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TEMPLATE FILE - Replace with actual character data
// This file shows the structure for bot personalities
// The actual seed.ts file contains proprietary character data
// and should not be committed to version control

const personalities = [
  {
    name: 'Example Bot',
    description: 'An example bot personality for template purposes',
    prompt: `You are an example bot. Replace this with your actual character prompt.
    
    Your personality:
    • Add character traits here
    • Define speaking style
    • Set behavioral patterns
    
    Remember to:
    • Stay in character
    • Be helpful and engaging
    • Follow content guidelines`,
    isActive: true,
    isFeatured: false,
    avatar: '/avatars/example-bot.svg',
  },
  // Add more bot personalities following the same structure
];

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    await prisma.botPersonality.deleteMany();

    // Create bot personalities
    for (const personality of personalities) {
      await prisma.botPersonality.create({
        data: personality,
      });
    }

    // Create a global chat room if it doesn't exist
    const globalChat = await prisma.chat.findFirst({
      where: { type: 'GLOBAL' },
    });

    if (!globalChat) {
      await prisma.chat.create({
        data: {
          name: 'Global Chat',
          type: 'GLOBAL',
        },
      });
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch(error => {
      console.error('Failed to disconnect from database:', error);
    });
  });
