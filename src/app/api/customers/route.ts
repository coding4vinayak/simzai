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
  assignedTo: z.string().optional(),
});

// Middleware to get authenticated user
async function getAuthUser(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, isActive: true },
  });

  return user?.isActive ? decoded : null;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const status = searchParams.get('status');
    const tags = searchParams.get('tags');
    const assignedTo = searchParams.get('assignedTo');
    const source = searchParams.get('source');
    const priority = searchParams.get('priority');
    const industry = searchParams.get('industry');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Users can only see their assigned customers (or all if admin)
    if (authUser.role !== 'admin') {
      where.assignedTo = authUser.userId;
    }
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { mobile: { contains: query, mode: 'insensitive' } },
        { website: { contains: query, mode: 'insensitive' } },
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

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (source) {
      where.source = source;
    }

    if (priority) {
      where.priority = priority;
    }

    if (industry) {
      where.industry = industry;
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          emails: {
            orderBy: { sentAt: 'desc' },
            take: 5,
          },
          services: {
            where: { status: 'active' },
            take: 10,
          },
          goods: {
            where: { status: 'delivered' },
            take: 10,
          },
          _count: {
            select: {
              interactions: true,
              tasks: true,
              emails: true,
              services: true,
              goods: true,
            },
          },
        },
      }),
      db.customer.count({ where }),
    ]);

    // Parse tags JSON for response
    const customersWithParsedData = customers.map(customer => ({
      ...customer,
      tags: customer.tags ? JSON.parse(customer.tags) : [],
    }));

    return NextResponse.json({
      customers: customersWithParsedData,
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
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
        assignedTo: validatedData.assignedTo || null,
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