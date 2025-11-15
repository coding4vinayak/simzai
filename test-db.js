const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Try to create a test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'test@simplecrm.com',
        password: 'hashed_password',
        role: 'admin',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    
    console.log('Test user created:', testUser);
    
    // Clean up
    await prisma.user.delete({
      where: { email: 'test@simplecrm.com' },
    });
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Database test failed:', error.message, error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();