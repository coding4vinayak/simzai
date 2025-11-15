import { NextRequest, NextResponse } from 'next/server';

// SDK documentation route
export async function GET(request: NextRequest) {
  try {
    // Return SDK documentation in various formats
    const sdkDocs = {
      name: 'CRM Agent SDK',
      version: '1.0.0',
      description: 'SDK for connecting external agents to the CRM system',
      endpoints: {
        agents: {
          create: {
            method: 'POST',
            path: '/api/agents',
            description: 'Create a new CRM agent',
            body: {
              name: 'string, required',
              type: 'enum: form, ai, analytics, data, custom',
              description: 'string, optional',
              capabilities: 'array of strings, optional'
            }
          },
          list: {
            method: 'GET',
            path: '/api/agents',
            description: 'Get all CRM agents for the authenticated user'
          }
        },
        apiKeys: {
          create: {
            method: 'POST',
            path: '/api/api-keys',
            description: 'Create a new API key for an agent',
            body: {
              name: 'string, required',
              permissions: 'array of strings, optional, default: ["read", "write"]',
              expiresAt: 'ISO date string, optional'
            }
          },
          list: {
            method: 'GET',
            path: '/api/api-keys',
            description: 'Get all API keys for the authenticated user'
          }
        }
      },
      installation: {
        npm: 'npm install z-ai-web-dev-sdk',
        yarn: 'yarn add z-ai-web-dev-sdk'
      },
      usage: {
        initialization: `
          import { CRMAgent } from 'z-ai-web-dev-sdk';
          
          const agent = new CRMAgent({
            apiKey: 'your-api-key-here',
            baseUrl: 'https://your-crm-domain.com'
          });
        `,
        examples: {
          getCustomers: `
            // Get all customers
            const customers = await agent.customers.list();
          `,
          createCustomer: `
            // Create a new customer
            const newCustomer = await agent.customers.create({
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+1234567890'
            });
          `,
          updateCustomer: `
            // Update customer data
            const updatedCustomer = await agent.customers.update(customerId, {
              name: 'John Smith',
              status: 'active'
            });
          `,
          getInteractions: `
            // Get customer interactions
            const interactions = await agent.interactions.list({
              customerId: 'customer-id-here',
              limit: 10
            });
          `,
          createInteraction: `
            // Create a new interaction
            const newInteraction = await agent.interactions.create({
              customerId: 'customer-id-here',
              type: 'email',
              title: 'Follow up email',
              message: 'Sent product information'
            });
          `
        }
      },
      authentication: {
        method: 'Bearer token',
        header: 'Authorization: Bearer YOUR_API_KEY'
      },
      rateLimiting: {
        requestsPerMinute: 1000,
        burstLimit: 5000
      },
      errorHandling: {
        format: {
          error: 'string - Error message',
          code: 'string - Error code',
          details: 'object - Additional error details'
        },
        commonErrors: {
          401: 'Unauthorized - Invalid or missing API key',
          403: 'Forbidden - Insufficient permissions',
          429: 'Rate limited - Too many requests',
          500: 'Internal server error'
        }
      },
      webhooks: {
        description: 'Receive real-time notifications about CRM events',
        supportedEvents: [
          'customer.created',
          'customer.updated', 
          'customer.deleted',
          'interaction.created',
          'interaction.updated',
          'task.created',
          'invoice.created'
        ],
        setup: `
          // Set up a webhook endpoint
          app.post('/webhook', async (req, res) => {
            const event = req.body;
            const signature = req.headers['x-crm-signature'];
            
            // Verify the signature to ensure the request is from CRM
            if (await verifySignature(event, signature)) {
              // Process the event
              await handleCRMEvent(event);
              res.status(200).send('OK');
            } else {
              res.status(401).send('Unauthorized');
            }
          });
        `
      }
    };

    return NextResponse.json(sdkDocs);
  } catch (error) {
    console.error('Error generating SDK docs:', error);
    return NextResponse.json(
      { error: 'Failed to generate SDK documentation' },
      { status: 500 }
    );
  }
}

// Health check for the SDK service
export async function HEAD(request: NextRequest) {
  try {
    // Check if the service is running
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-SDK-Version': '1.0.0',
        'X-Status': 'operational'
      }
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Status': 'degraded'
      }
    });
  }
}