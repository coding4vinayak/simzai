# Agent SDK Documentation

## Overview

The Agent SDK allows external applications to connect to your CRM system and perform operations on behalf of agents. This enables building different types of agents like forms, AI assistants, data analytics tools, and custom integrations.

## Authentication

All Agent SDK requests must include an API key in the Authorization header:

```
Authorization: Bearer YOUR_AGENT_API_KEY
```

## Base URL

```
https://your-crm-domain.com/api/agent
```

## Available Endpoints

### 1. Get Agent Information
```
GET /api/agent
```

**Response:**
```json
{
  "agent": {
    "id": "agent_id",
    "name": "Agent Name",
    "type": "form",
    "description": "Form submission agent",
    "capabilities": ["read", "write", "create_customer"],
    "config": {"auto_assign": true},
    "isActive": true,
    "lastSeen": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "user_id",
      "name": "Agent User",
      "email": "agent@example.com"
    }
  },
  "user": {
    "id": "user_id",
    "name": "Agent User", 
    "email": "agent@example.com"
  }
}
```

### 2. Create API Key
```
POST /api/agent
```

**Request Body:**
```json
{
  "name": "My API Key",
  "permissions": ["read", "write"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "apiKey": {
    "id": "key_id",
    "name": "My API Key",
    "key": "sk_abc123...",
    "permissions": ["read", "write"],
    "expiresAt": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "message": "API key created successfully"
}
```

### 3. Get Customers
```
GET /api/agent/customers?query=search&status=active&tags=premium,lead
```

**Query Parameters:**
- `query`: Search customers by name, email, company
- `status`: Filter by status (lead, prospect, active, inactive, churned)
- `tags`: Filter by tags (comma-separated)
- `source`: Filter by lead source
- `priority`: Filter by priority (high, medium, low)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)

**Response:**
```json
{
  "customers": [
    {
      "id": "customer_id",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Corp",
      "status": "active",
      "tags": ["premium", "enterprise"],
      "priority": "high",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### 4. Create Customer
```
POST /api/agent/customers
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "mobile": "+0987654321",
  "company": "Tech Solutions Inc",
  "address": "123 Main St, City, State",
  "website": "https://techsolutions.com",
  "industry": "Technology",
  "size": "medium",
  "revenue": 500000,
  "tags": ["enterprise", "software"],
  "notes": "Key decision maker in organization",
  "status": "prospect",
  "source": "referral",
  "value": 25000,
  "priority": "high"
}
```

**Response:**
```json
{
  "id": "new_customer_id",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "status": "prospect",
  "tags": ["enterprise", "software"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Agent Types

### Form Agent
- **Purpose**: Handle form submissions, surveys, and data entry
- **Capabilities**: `["read", "write", "create_customer"]`
- **Use Case**: Web forms, lead capture forms, survey tools
- **Example**: Contact form bot, survey automation tool

### AI Agent
- **Purpose**: Intelligent customer interactions and analysis
- **Capabilities**: `["read", "write", "analyze", "ai_insights"]`
- **Use Case**: AI chatbot, customer support assistant, lead scoring system
- **Example**: Customer service AI, sales assistant

### Analytics Agent
- **Purpose**: Data analysis and reporting
- **Capabilities**: `["read", "analytics", "export", "reports"]`
- **Use Case**: Business intelligence tool, dashboard integration
- **Example**: Analytics dashboard, reporting service

### Data Agent
- **Purpose**: Bulk data operations and integrations
- **Capabilities**: `["read", "write", "import", "export", "sync"]`
- **Use Case**: Data migration tool, ETL service, integration platform
- **Example**: Data import/export service, CRM integration

### Custom Agent
- **Purpose**: Specialized business logic
- **Capabilities**: Custom based on configuration
- **Use Case**: Industry-specific solutions, custom workflows
- **Example**: Real estate agent, healthcare CRM tool

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (validation error)
- **401**: Unauthorized (invalid API key)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **500**: Internal server error

Error responses include:
```json
{
  "error": "Error description"
}
```

## Rate Limiting

- API keys are limited to 100 requests per minute
- Exceeding limits will result in 429 status code
- Rate limit resets every minute

## Security

- All API requests are logged
- Suspicious activity will trigger alerts
- API keys can be revoked at any time
- Use HTTPS for all production deployments

## SDK Examples

### JavaScript/Node.js Example
```javascript
class CRMAgent {
  constructor(apiKey, baseUrl = 'https://your-crm-domain.com/api/agent') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getAgentInfo() {
    const response = await fetch(`${this.baseUrl}/agent`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async createCustomer(customerData) {
    const response = await fetch(`${this.baseUrl}/agent/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async getCustomers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${this.baseUrl}/agent/customers?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

// Usage
const agent = new CRMAgent('your-api-key');
await agent.getAgentInfo();
await agent.createCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Acme Corp'
});
```

### Python Example
```python
import requests
import json

class CRMAgent:
    def __init__(self, api_key, base_url='https://your-crm-domain.com/api/agent'):
        self.api_key = api_key
        self.base_url = base_url

    def get_agent_info(self):
        response = requests.get(
            f'{self.base_url}/agent',
            headers={'Authorization': f'Bearer {self.api_key}'}
        )
        
        if response.status_code != 200:
            raise Exception(f'HTTP {response.status_code}: {response.text}')
        
        return response.json()

    def create_customer(self, customer_data):
        response = requests.post(
            f'{self.base_url}/agent/customers',
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            },
            json=customer_data
        )
        
        if response.status_code != 201:
            raise Exception(f'HTTP {response.status_code}: {response.text}')
        
        return response.json()

# Usage
agent = CRMAgent('your-api-key')
agent_info = agent.get_agent_info()
agent.create_customer({
    'name': 'John Doe',
    'email': 'john@example.com',
    'company': 'Acme Corp'
})
```

## Webhooks

Agents can configure webhooks to receive real-time notifications:
- Customer created/updated
- API key generated/revoked
- Agent activity alerts
- Custom events via agent configuration

Configure webhooks in your agent dashboard or via API to receive instant notifications about customer activities and agent actions.