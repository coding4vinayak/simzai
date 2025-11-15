// crm-agent-sdk.ts - CRM Agent SDK for developers
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface CRMAgentConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  address?: string;
  website?: string;
  industry?: string;
  size?: string;
  revenue?: number;
  tags?: string;
  notes?: string;
  status: string;
  source?: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id: string;
  customerId: string;
  type: string;
  title?: string;
  message: string;
  direction?: string;
  nextFollowup?: Date;
  createdAt: Date;
}

export interface Task {
  id: string;
  customerId: string;
  type: string;
  status: string;
  runAt: Date;
  createdAt: Date;
}

// Main CRMAgent class
export class CRMAgent {
  private api: AxiosInstance;
  private config: CRMAgentConfig;

  constructor(config: CRMAgentConfig) {
    this.config = {
      baseUrl: 'http://localhost:3000', // Default to local development
      timeout: 30000, // 30 seconds
      ...config
    };

    // Create axios instance with default configuration
    this.api = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    // Add request interceptor to include API key
    this.api.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${this.config.apiKey}`;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('CRM Agent SDK Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Customer-related methods
  public customers = {
    /**
     * Get all customers
     */
    list: async (params?: { limit?: number; offset?: number; status?: string }): Promise<Customer[]> => {
      const response = await this.api.get('/api/customers', { params });
      return response.data.customers || response.data;
    },

    /**
     * Get a specific customer by ID
     */
    get: async (id: string): Promise<Customer> => {
      const response = await this.api.get(`/api/customers/${id}`);
      return response.data.customer || response.data;
    },

    /**
     * Create a new customer
     */
    create: async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
      const response = await this.api.post('/api/customers', customerData);
      return response.data.customer || response.data;
    },

    /**
     * Update an existing customer
     */
    update: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
      const response = await this.api.put(`/api/customers/${id}`, customerData);
      return response.data.customer || response.data;
    },

    /**
     * Delete a customer
     */
    delete: async (id: string): Promise<void> => {
      await this.api.delete(`/api/customers/${id}`);
    }
  };

  // Interaction-related methods
  public interactions = {
    /**
     * Get all interactions for a customer or all interactions
     */
    list: async (params?: { customerId?: string; limit?: number; offset?: number }): Promise<Interaction[]> => {
      const response = await this.api.get('/api/interactions', { params });
      return response.data.interactions || response.data;
    },

    /**
     * Get a specific interaction by ID
     */
    get: async (id: string): Promise<Interaction> => {
      const response = await this.api.get(`/api/interactions/${id}`);
      return response.data.interaction || response.data;
    },

    /**
     * Create a new interaction
     */
    create: async (interactionData: Omit<Interaction, 'id' | 'createdAt'>): Promise<Interaction> => {
      const response = await this.api.post('/api/interactions', interactionData);
      return response.data.interaction || response.data;
    },

    /**
     * Update an existing interaction
     */
    update: async (id: string, interactionData: Partial<Interaction>): Promise<Interaction> => {
      const response = await this.api.put(`/api/interactions/${id}`, interactionData);
      return response.data.interaction || response.data;
    },

    /**
     * Delete an interaction
     */
    delete: async (id: string): Promise<void> => {
      await this.api.delete(`/api/interactions/${id}`);
    }
  };

  // Task-related methods
  public tasks = {
    /**
     * Get all tasks
     */
    list: async (params?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Task[]> => {
      const response = await this.api.get('/api/tasks', { params });
      return response.data.tasks || response.data;
    },

    /**
     * Get a specific task by ID
     */
    get: async (id: string): Promise<Task> => {
      const response = await this.api.get(`/api/tasks/${id}`);
      return response.data.task || response.data;
    },

    /**
     * Create a new task
     */
    create: async (taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
      const response = await this.api.post('/api/tasks', taskData);
      return response.data.task || response.data;
    },

    /**
     * Update an existing task
     */
    update: async (id: string, taskData: Partial<Task>): Promise<Task> => {
      const response = await this.api.put(`/api/tasks/${id}`, taskData);
      return response.data.task || response.data;
    },

    /**
     * Delete a task
     */
    delete: async (id: string): Promise<void> => {
      await this.api.delete(`/api/tasks/${id}`);
    }
  };

  // Agent-specific methods
  public agent = {
    /**
     * Get agent information
     */
    info: async (): Promise<any> => {
      const response = await this.api.get('/api/agents/me');
      return response.data;
    },

    /**
     * Update agent status
     */
    updateStatus: async (status: { isActive: boolean; lastSeen?: Date }): Promise<any> => {
      const response = await this.api.put('/api/agents/status', status);
      return response.data;
    }
  };

  /**
   * Test the connection to the CRM
   */
  public async ping(): Promise<boolean> {
    try {
      const response = await this.api.get('/api/health');
      return response.status === 200;
    } catch (error) {
      console.error('Ping failed:', error);
      return false;
    }
  }

  /**
   * Get API rate limit information
   */
  public async getRateLimit(): Promise<{ remaining: number; reset: Date }> {
    // This would typically be returned in API response headers
    // For now, we'll return a mock response
    return {
      remaining: 1000,
      reset: new Date(Date.now() + 60000) // 1 minute from now
    };
  }
}

// Export a default function for easy initialization
export default function createCRMAgent(config: CRMAgentConfig): CRMAgent {
  return new CRMAgent(config);
}

// Export types
export type {
  Customer as CRMCustomer,
  Interaction as CRMInteraction,
  Task as CRMTask,
  CRMAgentConfig as CRMConfig
};