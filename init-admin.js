import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function createDefaultUser() {
  try {
    console.log('Creating default admin user...');

    // Check if admin user already exists
    const existingAdmin = await db.user.findFirst({
      where: {
        email: 'admin@simplecrm.com'
      }
    });

    if (existingAdmin) {
      console.log('Admin user already exists, updating...');
      await db.user.update({
        where: { id: existingAdmin.id },
        data: {
          name: 'Admin User',
          email: 'admin@simplecrm.com',
          password: await bcrypt.hash('admin123', 12), // Use the same 12 rounds as in the app
          role: 'admin',
          isActive: true
        }
      });
      console.log('Updated existing admin user with ID:', existingAdmin.id);
      return;
    }

    // Create a new admin user
    const adminUser = await db.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@simplecrm.com',
        password: await bcrypt.hash('admin123', 12), // In a real app, use a strong, unique password
        role: 'admin',
        isActive: true
      }
    });

    console.log('Successfully created admin user with ID:', adminUser.id);
    console.log('Email: admin@simplecrm.com');
    console.log('Password: admin123');

    // Also create a default agent for the admin user
    const defaultAgent = await db.agent.create({
      data: {
        name: 'Default Agent',
        type: 'ai',
        description: 'Default AI Agent for the system',
        capabilities: JSON.stringify(['read', 'write', 'admin']),
        config: JSON.stringify({ default: true }),
        userId: adminUser.id
      }
    });

    console.log('Successfully created default agent with ID:', defaultAgent.id);

    // Create an API key for the default agent
    const apiKey = await db.apiKey.create({
      data: {
        name: 'Default API Key',
        key: 'sk_default_api_key_for_testing_12345', // In production, generate a secure random key
        permissions: JSON.stringify(['read', 'write', 'admin']),
        userId: adminUser.id,
        agentId: defaultAgent.id,
        isActive: true
      }
    });

    console.log('Successfully created API key:', apiKey.key);
    console.log('\nYou can now log in with:');
    console.log('Email: admin@simplecrm.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating default user:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

createDefaultUser().catch(console.error);