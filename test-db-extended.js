const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client
const prisma = new PrismaClient();

async function checkDatabaseLocation() {
  try {
    console.log('Testing database operations...');

    // Try to count users (this will create the table if needed)
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

    // Try to find the user back
    const foundUser = await prisma.user.findUnique({
      where: { email: 'test@simplecrm.com' }
    });

    console.log('Found user:', foundUser);

    // Clean up - delete the test user
    await prisma.user.delete({
      where: { email: 'test@simplecrm.com' },
    });

    console.log('Cleanup successful');

    // Check if the users table exists by querying SQLite directly if possible
    const allUsers = await prisma.user.findMany();
    console.log('All users after cleanup:', allUsers.length);

  } catch (error) {
    console.error('Error during database test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseLocation();