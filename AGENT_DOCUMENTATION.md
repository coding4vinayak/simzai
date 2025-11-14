# 🚀 AGENT SDK DOCUMENTATION 🚀

## 📋 OVERVIEW

The Agent SDK provides a comprehensive REST API for external applications to integrate with your CRM system. This enables building different types of agents like forms, AI assistants, analytics tools, and custom integrations.

## 🔐 AUTHENTICATION

All API requests must include an API key in the Authorization header:

```http
Authorization: Bearer YOUR_AGENT_API_KEY
```

### API Key Generation

API keys are created in the agent dashboard and have the following properties:
- **Unique identifier**: `sk_` + 32 random characters
- **Permissions**: Configurable (read, write, create_customer, delete_customer, etc.)
- **Expiration**: Optional expiration date
- **Activity tracking**: All API calls are logged with the agent

## 🌐 BASE URL

```
https://your-crm-domain.com/api/agent
```

## 📊 AVAILABLE ENDPOINTS

### Agent Management

#### Get Agent Information
```http
GET /api/agent
Authorization: Bearer YOUR_AGENT_API_KEY
```

**Response:**
```json
{
  "agent": {
    "id": "agent_id",
    "name": "Agent Name",
    "type": "form|ai|analytics|data|custom",
    "description": "Agent description",
    "capabilities": ["read", "write", "create_customer"],
    "config": {"auto_assign": true},
    "isActive": true,
    "lastSeen": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00Z",
    "user": {
      "id": "user_id",
      "name": "Agent User",
      "email": "agent@example.com"
    }
  }
}
```

#### Create Agent
```http
POST /api/agent
Authorization: Bearer YOUR_AGENT_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My Form Agent",
  "type": "form",
  "description": "Handles web form submissions",
  "capabilities": ["read", "write", "create_customer"],
  "config": {"webhook_url": "https://my-app.com/webhook"}
}
```

**Response:**
```json
{
  "agent": {
    "id": "new_agent_id",
    "name": "My Form Agent",
    "type": "form",
    "description": "Handles web form submissions",
    "capabilities": ["read", "write", "create_customer"],
    "config": {"webhook_url": "https://my-app.com/webhook"}
  },
  "message": "Agent created successfully"
}
```

#### Create API Key
```http
POST /api/agent
Authorization: Bearer YOUR_AGENT_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Analytics API Key",
  "permissions": ["read", "analytics", "export"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "apiKey": {
    "id": "key_id",
    "name": "Analytics API Key",
    "key": "sk_abc123...",
    "permissions": ["read", "analytics", "export"],
    "expiresAt": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-01T00:00Z"
  },
  "message": "API key created successfully"
}
```

### Customer Data Access

#### Get Customers
```http
GET /api/agent/customers?query=search&status=active&tags=premium,lead
Authorization: Bearer YOUR_AGENT_API_KEY
```

**Response:**
```json
{
  "customers": [
    {
      "id": "customer_id",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "tags": ["premium", "lead"],
      "createdAt": "2024-01-01T00:00Z"
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

#### Create Customer
```http
POST /api/agent/customers
Authorization: Bearer YOUR_AGENT_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Tech Solutions Inc",
  "tags": ["enterprise", "software"],
  "status": "prospect"
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
  "createdAt": "2024-01-01T00:00Z"
}
```

## 🔧 AGENT TYPES

### Form Agent
- **Purpose**: Handle web form submissions, surveys, data entry
- **Capabilities**: `["read", "write", "create_customer"]`
- **Use Cases**: Contact forms, lead capture forms, survey tools
- **Configuration**: Webhook URLs, form field mapping, auto-assignment rules

### AI Agent
- **Purpose**: Intelligent customer interactions, automated responses
- **Capabilities**: `["read", "write", "analyze", "ai_insights"]`
- **Use Cases**: Customer support chatbot, sales assistant, lead scoring
- **Configuration**: AI model settings, response templates, automation rules

### Analytics Agent
- **Purpose**: Data analysis and business intelligence
- **Capabilities**: `["read", "analytics", "export", "reports"]`
- **Use Cases**: Dashboard integrations, reporting tools, business analytics
- **Configuration**: Data sources, report templates, KPI tracking

### Data Agent
- **Purpose**: Bulk data operations and ETL processes
- **Capabilities**: `["read", "write", "import", "export", "sync"]`
- **Use Cases**: Data migration tools, ETL services, integration platforms
- **Configuration**: Data mapping rules, sync schedules, transformation logic

### Custom Agent
- **Purpose**: Specialized business logic and workflows
- **Capabilities**: Custom based on configuration
- **Use Cases**: Industry-specific solutions, custom workflows, unique business processes
- **Configuration**: Custom logic definitions, workflow builders, integration settings

## 🛡️ ERROR HANDLING

### HTTP Status Codes
- **200**: Success
- **201**: Created successfully
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid or missing API key)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

### Error Response Format
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional error information"
}
```

## 📝 RATE LIMITING

- **100 requests per minute** per API key
- **Rate limit headers** included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1692528000
```

- **429 status code** when rate limit exceeded

## 🔐 SECURITY FEATURES

### API Key Security
- **Unique identifiers**: Cryptographically secure key generation
- **Permission scoping**: Fine-grained access control
- **Activity logging**: All API calls tracked with IP, user agent, and timestamp
- **Key revocation**: Instant API key deactivation
- **Expiration management**: Automatic key expiration handling

### Data Protection
- **Input validation**: All inputs validated and sanitized
- **SQL injection protection**: Parameterized queries
- **Data encryption**: Sensitive data protection at rest and in transit

## 🚀 QUICK START GUIDE

### 1. Create Agent
```bash
curl -X POST https://your-crm-domain.com/api/agent \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Form Agent",
    "type": "form",
    "description": "Handles web form submissions"
  }'
```

### 2. Create API Key
```bash
curl -X POST https://your-crm-domain.com/api/agent \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Analytics Key",
    "permissions": ["read", "analytics"]
  }'
```

### 3. Get Agent Info
```bash
curl -X GET https://your-crm-domain.com/api/agent \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 4. Get Customers
```bash
curl -X GET "https://your-crm-domain.com/api/agent/customers?status=active" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 📚 SDK EXAMPLES

### JavaScript SDK
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

### Python SDK
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

## 🌐 INTEGRATION EXAMPLES

### Web Form Integration
```javascript
// Handle form submission and send to CRM
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const agent = new CRMAgent('your-api-key');
  
  try {
    const response = await agent.createCustomer({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      company: formData.get('company')
    });
    
    if (response.ok) {
      alert('Customer created successfully!');
      document.getElementById('contactForm').reset();
    } else {
      alert('Error creating customer: ' + response.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error occurred');
  }
});
```

### AI Chatbot Integration
```javascript
// AI-powered customer support
const agent = new CRMAgent('your-api-key');

async function handleCustomerMessage(message) {
  // Get customer context
  const customers = await agent.getCustomers({ status: 'active' });
  
  // Send to AI for intelligent response
  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful customer support assistant.' },
        { role: 'user', content: message },
        { role: 'system', content: `Customer context: ' + JSON.stringify(customers) }
      ]
    }
  });
  
  // Send AI response to customer
  await agent.createCustomer({
    name: 'AI Assistant Response',
    type: 'ai',
    description: 'AI generated customer interaction',
    notes: JSON.stringify(aiResponse.choices[0].message)
  });
}
```

## 🔧 BEST PRACTICES

### 1. Security First
- Always validate API keys
- Use HTTPS for production
- Implement rate limiting
- Log all API activities
- Never expose API keys in client-side code

### 2. Error Handling
- Always check HTTP status codes
- Implement retry logic for transient errors
- Provide meaningful error messages
- Log errors for debugging

### 3. Performance
- Implement caching for frequently accessed data
- Use connection pooling for high-volume applications
- Monitor API usage and optimize queries

### 4. Documentation
- Keep documentation up-to-date
- Provide working code examples
- Include authentication examples
- Document all endpoints and parameters

### 5. Testing
- Test with sample data before production
- Use sandbox environment for development
- Monitor API performance and usage

## 📞 SUPPORT

For technical support, documentation, and questions:
- **Email**: support@your-crm-domain.com
- **Documentation**: Available at `/AGENT_SDK_DOCUMENTATION.md`
- **Examples**: Code samples in multiple languages
- **Community**: Developer forums and knowledge base

---

**Start building powerful agent integrations today!** 🚀