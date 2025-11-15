# CRM Agent SDK

The CRM Agent SDK allows you to connect external services and applications to your CRM system. This SDK provides a simple interface for accessing customer data, creating interactions, managing tasks, and more.

## Installation

```bash
npm install z-ai-web-dev-sdk
```

or

```bash
yarn add z-ai-web-dev-sdk
```

## Quick Start

```typescript
import { CRMAgent } from 'z-ai-web-dev-sdk';

// Initialize the CRM agent with your API key
const agent = new CRMAgent({
  apiKey: 'your-api-key-here',
  baseUrl: 'https://your-crm-domain.com', // Optional, defaults to localhost:3000
  timeout: 30000 // Optional, defaults to 30 seconds
});

// Test the connection
const isConnected = await agent.ping();
console.log('Connected to CRM:', isConnected);

// Get all customers
const customers = await agent.customers.list();
console.log('Customers:', customers);

// Create a new customer
const newCustomer = await agent.customers.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  status: 'lead'
});

console.log('New customer created:', newCustomer);
```

## API Reference

### Customers

#### List all customers
```typescript
const customers = await agent.customers.list({
  limit: 10,
  offset: 0,
  status: 'active' // Optional filter
});
```

#### Get a specific customer
```typescript
const customer = await agent.customers.get('customer-id');
```

#### Create a customer
```typescript
const newCustomer = await agent.customers.create({
  name: 'Jane Smith',
  email: 'jane@example.com',
  status: 'lead'
});
```

#### Update a customer
```typescript
const updatedCustomer = await agent.customers.update('customer-id', {
  name: 'Jane Doe',
  status: 'active'
});
```

#### Delete a customer
```typescript
await agent.customers.delete('customer-id');
```

### Interactions

#### List interactions
```typescript
const interactions = await agent.interactions.list({
  customerId: 'customer-id', // Optional, leave out to get all
  limit: 10
});
```

#### Create an interaction
```typescript
const newInteraction = await agent.interactions.create({
  customerId: 'customer-id',
  type: 'email',
  title: 'Welcome Email',
  message: 'Welcome to our service!'
});
```

### Tasks

#### List tasks
```typescript
const tasks = await agent.tasks.list({
  customerId: 'customer-id', // Optional
  status: 'pending',         // Optional
  limit: 10
});
```

#### Create a task
```typescript
const newTask = await agent.tasks.create({
  customerId: 'customer-id',
  type: 'follow-up',
  status: 'pending',
  runAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
});
```

## Authentication

The SDK uses Bearer token authentication with your API key. Make sure to keep your API key secure and never expose it in client-side code.

## Error Handling

All methods return promises and will reject with an error if the API call fails:

```typescript
try {
  const customer = await agent.customers.get('non-existent-id');
} catch (error) {
  console.error('Failed to get customer:', error.message);
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. The SDK includes helper methods to check your remaining requests:

```typescript
const rateLimit = await agent.getRateLimit();
console.log(`Remaining requests: ${rateLimit.remaining}`);
```

## Webhooks

To receive real-time notifications about CRM events, set up a webhook endpoint that listens for POST requests from the CRM. Supported events include:

- `customer.created`
- `customer.updated`
- `customer.deleted`
- `interaction.created`
- `interaction.updated`
- `task.created`
- `invoice.created`

## Support

If you have any questions or issues with the SDK, please contact our support team at support@crm.example.com or open an issue on our GitHub repository.