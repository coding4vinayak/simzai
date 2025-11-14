import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { createHmac } from 'crypto';

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Middleware to check admin role
async function checkAdmin(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true, isActive: true },
  });

  return user?.role === 'admin' && user.isActive ? decoded : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const webhook = await db.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const response = {
      ...webhook,
      events: JSON.parse(webhook.events),
      secret: webhook.secret ? `${webhook.secret.substring(0, 8)}...` : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, url, events, secret, isActive } = updateWebhookSchema.parse(body);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = JSON.stringify(events);
    if (secret !== undefined) updateData.secret = secret;
    if (isActive !== undefined) updateData.isActive = isActive;

    const webhook = await db.webhook.update({
      where: { id: params.id },
      data: updateData,
    });

    const response = {
      ...webhook,
      events: JSON.parse(webhook.events),
      secret: webhook.secret ? `${webhook.secret.substring(0, 8)}...` : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await db.webhook.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Test webhook by sending a test payload
    const webhook = await db.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const testPayload = {
      event: 'test',
      data: {
        message: 'This is a test webhook from SimpleCRM',
        timestamp: new Date().toISOString(),
      },
      webhook: {
        id: webhook.id,
        name: webhook.name,
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SimpleCRM-Webhook/1.0',
    };

    if (webhook.secret) {
      const signature = createHmac('sha256', webhook.secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
    });

    // Update last trigger time
    await db.webhook.update({
      where: { id: params.id },
      data: { lastTrigger: new Date() },
    });

    return NextResponse.json({
      message: 'Test webhook sent',
      success: response.ok,
      status: response.status,
      payload: testPayload,
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}