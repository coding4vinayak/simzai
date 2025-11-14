import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { randomBytes, createHmac } from 'crypto';

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['api', 'continuous']).default('api'),
  events: z.array(z.string()),
  secret: z.string().optional(),
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

function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [webhooks, total] = await Promise.all([
      db.webhook.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.webhook.count(),
    ]);

    // Parse events JSON and mask secret
    const webhooksWithParsedEvents = webhooks.map(webhook => ({
      ...webhook,
      events: JSON.parse(webhook.events),
      secret: webhook.secret ? `${webhook.secret.substring(0, 8)}...` : null,
    }));

    return NextResponse.json({
      webhooks: webhooksWithParsedEvents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, url, type, events, secret } = createWebhookSchema.parse(body);

    const webhookSecret = secret || generateWebhookSecret();

    const webhook = await db.webhook.create({
      data: {
        name,
        url,
        type,
        events: JSON.stringify(events),
        secret: webhookSecret,
      },
    });

    const response = {
      ...webhook,
      events: JSON.parse(webhook.events),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

export async function POST_WEBHOOK(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    // Get active webhooks that listen to this event
    const webhooks = await db.webhook.findMany({
      where: {
        isActive: true,
        events: {
          contains: event,
        },
      },
    });

    // Trigger webhooks asynchronously
    const webhookPromises = webhooks.map(async (webhook) => {
      try {
        const events = JSON.parse(webhook.events);
        if (!events.includes(event)) return;

        const payload = {
          event,
          data,
          timestamp: new Date().toISOString(),
          webhook: {
            id: webhook.id,
            name: webhook.name,
          },
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'SimpleCRM-Webhook/1.0',
        };

        // Add signature if secret is configured
        if (webhook.secret) {
          const signature = createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex');
          headers['X-Webhook-Signature'] = `sha256=${signature}`;
        }

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        // Update last trigger time
        await db.webhook.update({
          where: { id: webhook.id },
          data: { lastTrigger: new Date() },
        });

        return response.ok;
      } catch (error) {
        console.error(`Webhook ${webhook.id} failed:`, error);
        return false;
      }
    });

    await Promise.allSettled(webhookPromises);

    return NextResponse.json({
      message: 'Webhooks triggered successfully',
      triggered: webhooks.length,
    });
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to trigger webhooks' },
      { status: 500 }
    );
  }
}