const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function verifyUser() {
  try {
    const user = await db.user.findFirst({
      where: { email: 'admin@simplecrm.com' },
      select: { id: true, email: true, name: true, isActive: true }
    });
    console.log('User found:', user);
    
    const agent = await db.agent.findFirst({
      where: { name: 'Default Agent' },
      select: { id: true, name: true, type: true }
    });
    console.log('Agent found:', agent);
    
    const apiKey = await db.apiKey.findFirst({
      where: { name: 'Default API Key' },
      select: { id: true, name: true, key: true }
    });
    console.log('API Key found:', apiKey);
  } finally {
    await db.$disconnect();
  }
}

verifyUser().catch(console.error);