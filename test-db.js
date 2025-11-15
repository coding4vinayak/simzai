// Testing database functionality directly with Prisma client
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function testDatabase() {
  console.log('Testing database connectivity...');
  
  try {
    // First, create a test user
    const testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword123', // In real app, this would be properly hashed
      }
    });
    console.log(`✓ Successfully created test user with ID: ${testUser.id}`);
    
    // Test database connection by querying agents
    const agents = await db.agent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✓ Successfully retrieved ${agents.length} agents from database`);
    
    // Test creating a new agent
    const newAgent = await db.agent.create({
      data: {
        name: 'Test Agent',
        type: 'test',
        description: 'A test agent for verification',
        capabilities: JSON.stringify(['read', 'write']),
        config: JSON.stringify({ test: true }),
        userId: testUser.id // Use the actual user ID we created
      }
    });
    console.log(`✓ Successfully created test agent with ID: ${newAgent.id}`);
    
    // Test retrieving the created agent
    const retrievedAgent = await db.agent.findUnique({
      where: { id: newAgent.id }
    });
    console.log(`✓ Successfully retrieved test agent: ${retrievedAgent?.name}`);
    
    // Test API keys
    const apiKeys = await db.apiKey.findMany({
      take: 5
    });
    console.log(`✓ Successfully retrieved ${apiKeys.length} API keys from database`);
    
    // Test customers
    const customers = await db.customer.findMany({
      take: 5
    });
    console.log(`✓ Successfully retrieved ${customers.length} customers from database`);
    
    // Test creating a customer
    const newCustomer = await db.customer.create({
      data: {
        name: 'Test Customer',
        email: 'customer@example.com',
        status: 'lead',
        tags: JSON.stringify(['test', 'prospect'])
      }
    });
    console.log(`✓ Successfully created test customer with ID: ${newCustomer.id}`);
    
    // Test retrieving the customer
    const retrievedCustomer = await db.customer.findUnique({
      where: { id: newCustomer.id }
    });
    console.log(`✓ Successfully retrieved test customer: ${retrievedCustomer?.name}`);
    
    // Test creating an API key
    const newApiKey = await db.apiKey.create({
      data: {
        name: 'Test API Key',
        key: 'test_api_key_12345',
        permissions: JSON.stringify(['read', 'write']),
        userId: testUser.id
      }
    });
    console.log(`✓ Successfully created test API key with ID: ${newApiKey.id}`);
    
    // Clean up: delete the test API key
    await db.apiKey.delete({
      where: { id: newApiKey.id }
    });
    console.log('✓ Successfully cleaned up test API key');
    
    // Clean up: delete the test customer
    await db.customer.delete({
      where: { id: newCustomer.id }
    });
    console.log('✓ Successfully cleaned up test customer');
    
    // Clean up: delete the test agent
    await db.agent.delete({
      where: { id: newAgent.id }
    });
    console.log('✓ Successfully cleaned up test agent');
    
    // Clean up: delete the test user
    await db.user.delete({
      where: { id: testUser.id }
    });
    console.log('✓ Successfully cleaned up test user');
    
    console.log('\n🎉 All database tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testDatabase();