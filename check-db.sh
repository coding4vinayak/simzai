#!/bin/bash

echo "🔍 Checking CRM Database State"
echo "================================"

# Check if database file exists
if [ -f "/home/z/my-project/db/custom.db" ]; then
    echo "✅ Database file exists"
else
    echo "❌ Database file not found"
    exit 1
fi

# Check if we can run database queries
echo "📊 Testing database connection..."

# Try to create a simple test script
cat > /tmp/test-db.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient({
  datasources: {
    db: {
      provider: 'sqlite',
      url: 'file:./db/custom.db',
    },
  },
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if tables exist
    const tables = await prisma.\$queryRaw\`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';\`;
    console.log('📋 Tables found:', tables);
    
    // Check user count
    const userCount = await prisma.user.count();
    console.log('👥 Total users:', userCount);
    
    // Check admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' }
    });
    console.log('👑 Admin users:', adminUsers.length);
    
    if (adminUsers.length > 0) {
      console.log('📧 Admin user details:');
      adminUsers.forEach(user => {
        console.log(\`  - ${user.name} (${user.email}) - Active: ${user.isActive}\`);
      });
    }
    
    console.log('✅ Database connection successful!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

checkDatabase();
EOF

# Run the test
cd /home/z/my-project && node /tmp/test-db.js

echo ""
echo "🌐 Next Steps:"
echo "1. If users exist, go to: http://localhost:3000/login"
echo "2. If no users, go to: http://localhost:3000/init"
echo "3. To check database state: http://localhost:3000/api/check-db"
echo ""