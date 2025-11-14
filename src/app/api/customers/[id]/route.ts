import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
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
  status: z.enum(['lead', 'prospect', 'active', 'inactive', 'churned']).optional(),
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const customer = await db.customer.findUnique({
      where: { id: params.id },
      include: {
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        emails: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
        services: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        goods: {
          where: { status: 'delivered' },
          orderBy: { orderDate: 'desc' },
          take: 10,
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (authUser.role !== 'admin' && customer.assignedTo !== authUser.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse tags JSON for response
    const customerWithParsedData = {
      ...customer,
      tags: customer.tags ? JSON.parse(customer.tags) : [],
    };

    return NextResponse.json(customerWithParsedData);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if customer exists and user has access
    const existingCustomer = await db.customer.findUnique({
      where: { id: params.id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (authUser.role !== 'admin' && existingCustomer.assignedTo !== authUser.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    // Update customer
    const updatedCustomer = await db.customer.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : existingCustomer.tags,
      },
      include: {
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Parse tags JSON for response
    const customerWithParsedData = {
      ...updatedCustomer,
      tags: updatedCustomer.tags ? JSON.parse(updatedCustomer.tags) : [],
    };

    return NextResponse.json(customerWithParsedData);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if customer exists and user has access
    const existingCustomer = await db.customer.findUnique({
      where: { id: params.id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check access permissions (only admins can delete)
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete customers' },
        { status: 403 }
      );
    }

    await db.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}