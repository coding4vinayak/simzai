# SimpleCRM - Customer Relationship Management System

A comprehensive CRM system built with Next.js 15, TypeScript, and Prisma ORM.

## 🚀 Quick Start

### 1. First-Time Setup

If you're running the system for the first time, visit:
```
http://localhost:3000/init
```

This will create a default admin user with the following credentials:
- **Email**: `admin@simplecrm.com`
- **Password**: `admin123`

### 2. Login

After setup, login at:
```
http://localhost:3000/login
```

### 3. Access Dashboard

Once logged in, you'll be redirected to the dashboard at:
```
http://localhost:3000/
```

## 📋 Features

### Core CRM Features
- **Customer Management**: Create, view, update, and delete customers
- **Interactions**: Track calls, emails, WhatsApp, notes, and tasks
- **Task Management**: Automation and follow-up scheduling
- **Sales Pipeline**: Visual status tracking
- **Real-time Dashboard**: Live statistics and activity feeds

### Advanced Features
- **User Management**: Multi-user support with role-based access
- **API Keys**: Secure API access for integrations
- **Agent System**: Connect external services with the Agent SDK
  - **Agent Types**: Form agents, AI agents, Analytics agents, Data collection agents
  - **SDK Integration**: Comprehensive SDK for easy external service integration
  - **2-way Connection**: Agents can both read from and write to CRM database
  - **Secure Access**: API key-based authentication for agents
- **Webhooks**: Real-time data synchronization
- **Import/Export**: CSV and JSON data import/export
- **Settings**: Comprehensive system configuration
- **Backup & Redundancy**: Automated and manual backup with integrity monitoring
  - **Database Backups**: Full database backup and restore functionality
  - **Data Integrity Checks**: Regular checksum validation of critical data
  - **Redundancy Monitoring**: Real-time status of backup and data integrity
  - **Automated Scheduling**: Configurable backup scheduling with retention policies

### Security Features
- **JWT Authentication**: Secure token-based authentication with database session validation
- **Rate Limiting**: Protection against brute force attacks (max 5 login attempts per 15 min)
- **Role-Based Access**: Admin vs User permissions with proper authorization
- **Password Security**: bcrypt for secure password hashing with strength validation (8+ chars, upper/lower/digit)
- **Session Management**: Database-backed sessions with expiration validation
- **API Key Security**: API keys stored with bcrypt hashing and efficient lookup mechanism
- **Default Password Protection**: Forced password change on first login with default credentials
- **User Enumeration Prevention**: Timing attack protection using consistent bcrypt operations
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options via middleware
- **CSRF Protection**: Stateless token validation for form submissions
- **Secure Password Change**: Current password verification required for password updates
- **Input Validation**: Comprehensive Zod schema validation on all endpoints

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API

### Backend
- **Database**: SQLite with Prisma ORM (easily migratable to PostgreSQL)
- **API**: RESTful API with comprehensive endpoints
- **Authentication**: JWT-based with secure sessions

### Database Schema
- **Customers**: Core customer data with tags and status
- **Interactions**: Timeline of all customer interactions
- **Tasks**: Automation and follow-up management
- **Invoices**: Billing and payment tracking
- **Agent Logs**: AI agent activity tracking
- **Users**: User management with roles
- **API Keys**: Secure API access management with bcrypt hashing and lookupKey for efficient retrieval
- **Sessions**: Database-backed session management with expiration validation
- **Webhooks**: Real-time data synchronization
- **Settings**: System configuration storage
- **Import/Export**: Data migration history

## 📱 Pages

### Public Pages
- `/init` - System initialization (first-time setup)
- `/login` - User authentication

### Authenticated Pages
- `/` - Dashboard with real-time statistics
- `/customers` - Customer management with search and filtering
- `/customers/[id]` - Detailed customer view with timeline
- `/tasks` - Task management and automation
- `/agents` - Agent activity monitoring
- `/settings` - System configuration (admin only)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Backup & Redundancy
- `GET /api/backup` - Get backup service status and list jobs
- `POST /api/backup` - Create new database backup
- `PUT /api/backup` - Restore from backup file
- `GET /api/backup?action=list` - List all backup files
- `GET /api/backup?action=download&name=filename` - Download backup file
- `GET /api/backup?action=jobs` - List backup jobs
- `GET /api/monitor/redundancy` - Get redundancy status and integrity checks
- `POST /api/monitor/redundancy` - Perform manual data integrity check

### Customers
- `GET /api/customers` - List customers with pagination
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer
- `GET /api/customers/[id]/interactions` - Get customer interactions
- `POST /api/customers/[id]/interactions` - Add customer interaction

### Tasks
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task status

### Users (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### API Keys
- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Create new API key
- `GET /api/api-keys/[id]` - Get API key details
- `PUT /api/api-keys/[id]` - Update API key
- `DELETE /api/api-keys/[id]` - Delete API key

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create new webhook
- `GET /api/webhooks/[id]` - Get webhook details
- `PUT /api/webhooks/[id]` - Update webhook
- `DELETE /api/webhooks/[id]` - Delete webhook
- `POST /api/webhooks/[id]` - Test webhook

### Data Management
- `GET /api/import-export` - List import/export history
- `POST /api/import-export` - Create import/export job
- `GET /api/import-export/[id]/download` - Download exported file
- `DELETE /api/import-export/[id]` - Delete import/export job

### Settings
- `GET /api/settings` - Get system settings
- `POST /api/settings` - Create new setting
- `PUT /api/settings` - Update multiple settings

### System
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/init-admin` - Check if admin user exists
- `POST /api/init-admin` - Create default admin user

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push database schema
npm run db:generate  # Generate Prisma client
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
```

### Database
The system uses SQLite by default for development. To migrate to PostgreSQL:
1. Update the `provider` in `prisma/schema.prisma` to `postgresql`
2. Update the `DATABASE_URL` to your PostgreSQL connection string
3. Run `npm run db:push`

## 🎯 Production Deployment

### Database Migration
1. Set up PostgreSQL database
2. Update environment variables
3. Run `npm run db:push`
4. Deploy the application

### Security Considerations
- Change the default admin password immediately
- Use strong JWT secrets in production
- Enable HTTPS in production
- Regularly update dependencies
- Implement rate limiting for API endpoints

## 📊 Monitoring

The system includes comprehensive logging and monitoring:
- Database query logging
- API request/response tracking
- Error handling and reporting
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Examine the database schema
- Test the import/export functionality

---

**SimpleCRM** - A powerful yet simple CRM solution for modern businesses.