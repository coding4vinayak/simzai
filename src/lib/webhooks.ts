import { db } from '@/lib/db';
import { createHmac } from 'crypto';

export interface WebhookEvent {
  event: string;
  data: any;
  userId?: string;
}

export async function triggerWebhooks(eventData: WebhookEvent) {
  try {
    const { event, data, userId } = eventData;

    // Get active webhooks that listen to this event
    const webhooks = await db.webhook.findMany({
      where: {
        isActive: true,
      },
    });

    // Filter webhooks based on type and events
    const relevantWebhooks = webhooks.filter(webhook => {
      const events = JSON.parse(webhook.events);
      
      // API webhooks: only trigger for specific events
      if (webhook.type === 'api') {
        return events.includes(event);
      }
      
      // Continuous webhooks: trigger for all events
      if (webhook.type === 'continuous') {
        return true;
      }
      
      return false;
    });

    // Trigger webhooks asynchronously
    const webhookPromises = relevantWebhooks.map(async (webhook) => {
      try {
        const payload = {
          event,
          data,
          timestamp: new Date().toISOString(),
          webhook: {
            id: webhook.id,
            name: webhook.name,
            type: webhook.type,
          },
          userId,
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

        // Log webhook trigger
        await db.agentLog.create({
          data: {
            agentName: 'Webhook System',
            action: `Trigger webhook: ${webhook.name}`,
            payload: JSON.stringify({ event, webhookId: webhook.id, status: response.status }),
            status: response.ok ? 'success' : 'failed',
            userId,
          },
        });

        return response.ok;
      } catch (error) {
        console.error(`Webhook ${webhook.id} failed:`, error);
        
        // Log webhook failure
        await db.agentLog.create({
          data: {
            agentName: 'Webhook System',
            action: `Webhook failed: ${webhook.name}`,
            payload: JSON.stringify({ event, webhookId: webhook.id, error: error.message }),
            status: 'failed',
            userId,
          },
        });
        
        return false;
      }
    });

    const results = await Promise.allSettled(webhookPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    return {
      triggered: relevantWebhooks.length,
      successful,
      failed: relevantWebhooks.length - successful,
    };
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    throw error;
  }
}

// Webhook event types
export const WEBHOOK_EVENTS = {
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
  INTERACTION_CREATED: 'interaction.created',
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  USER_CREATED: 'user.created',
  USER_LOGIN: 'user.login',
  API_KEY_CREATED: 'api_key.created',
  WEBHOOK_TRIGGERED: 'webhook.triggered',
  DATA_EXPORTED: 'data.exported',
  DATA_IMPORTED: 'data.imported',
} as const;