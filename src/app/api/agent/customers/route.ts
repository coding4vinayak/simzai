import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  revenue: z.number().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(['lead', 'prospect', 'active', 'inactive', 'churned']).default('lead'),
  source: z.string().optional(),
  value: z.number().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});

// Middleware to get agent from API key
async function getAgentFromApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7);
  
  const agent = await db.agent.findFirst({
    where: {
      isActive: true,
      apiKeys: {
        some: {
          key: apiKey,
          isActive: true,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return agent;
}

export async function GET(request: NextRequest) {
  try {
    const agent = await getAgentFromApiKey(request);
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const status = searchParams.get('status');
    const tags = searchParams.get('tags');
    const source = searchParams.get('source');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = {
        contains: JSON.stringify(tagArray),
      };
    }

    if (source) {
      where.source = source;
    }

    if (priority) {
      where.priority = priority;
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.customer.count({ where }),
    ]);

    // Parse tags JSON for response
    const customersWithParsedTags = customers.map(customer => ({
      ...customer,
      tags: customer.tags ? (() => {
        try {
          return JSON.parse(customer.tags);
        } catch (e) {
          console.error('Error parsing customer tags:', e);
          return [];
        }
      })() : [],
    }));

    return NextResponse.json({
      customers: customersWithParsedTags,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await getAgentFromApiKey(request);
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCustomerSchema.parse(body);

    // Create customer
    const customer = await db.customer.create({
      data: {
        ...validatedData,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
      },
    });

    // Log activity
    await db.agentActivity.create({
      data: {
        agentId: agent.id,
        type: 'create_customer',
        action: 'create_customer',
        data: JSON.stringify({ customerId: customer.id, name: customer.name }),
        status: 'success',
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}