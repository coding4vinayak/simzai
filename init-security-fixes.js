// Testing database functionality directly with Prisma client
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function initializeSecurityFixes() {
  console.log('Initializing security fixes and default admin user...');
  
  try {
    // First, let's make sure the default admin user exists with a proper password hash
    const defaultEmail = 'admin@simplecrm.com';
    
    // Check if admin user already exists
    let adminUser = await db.user.findUnique({
      where: { email: defaultEmail }
    });
    
    if (adminUser) {
      console.log('Admin user exists, updating with a proper password hash...');
      
      // Update the admin user with properly hashed password (admin123)
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser = await db.user.update({
        where: { id: adminUser.id },
        data: {
          password: hashedPassword,
          name: 'Admin User',
          email: defaultEmail,
          role: 'admin',
          isActive: true
        }
      });
    } else {
      // Create a new admin user with properly hashed password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser = await db.user.create({
        data: {
          name: 'Admin User',
          email: defaultEmail,
          password: hashedPassword,
          role: 'admin',
          isActive: true
        }
      });
      console.log(`✓ Created admin user with ID: ${adminUser.id}`);
    }
    
    // Create a default agent for the admin user
    let defaultAgent = await db.agent.findFirst({
      where: { 
        name: 'Default Agent',
        userId: adminUser.id 
      }
    });
    
    if (!defaultAgent) {
      defaultAgent = await db.agent.create({
        data: {
          name: 'Default Agent',
          type: 'ai',
          description: 'Default AI Agent for the system',
          capabilities: JSON.stringify(['read', 'write', 'admin']),
          config: JSON.stringify({ default: true }),
          userId: adminUser.id
        }
      });
      console.log(`✓ Created default agent with ID: ${defaultAgent.id}`);
    } else {
      console.log(`✓ Default agent already exists with ID: ${defaultAgent.id}`);
    }
    
    // Create a default API key for the default agent
    // Generate a new API key with proper hashing
    const apiKeyString = `crm_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    const hashedApiKey = await bcrypt.hash(apiKeyString, 12);
    const lookupKey = apiKeyString.substring(0, 8);
    
    const defaultApiKey = await db.apiKey.create({
      data: {
        name: 'Default API Key',
        key: hashedApiKey, // Store hashed key
        lookupKey: lookupKey, // Store lookup key for efficient retrieval
        permissions: JSON.stringify(['read', 'write', 'admin']),
        userId: adminUser.id,
        agentId: defaultAgent.id,
        isActive: true
      }
    });
    
    console.log(`✓ Created secure API key: ${apiKeyString.substring(0, 12)}...`);
    console.log('\nImportant: The default admin credentials are:');
    console.log('Email: admin@simplecrm.com');
    console.log('Password: admin123');
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the initialization
initializeSecurityFixes();