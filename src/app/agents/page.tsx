'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Bot,
  Users,
  Code,
  Settings,
  Plus,
  Copy,
  ExternalLink,
  BarChart3,
  Key,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function AgentDashboard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ name: '', permissions: ['read', 'write'], expiresAt: '' });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      // In a real app, this would call your API
      const mockAgents = [
        {
          id: '1',
          userId: 'user1',
          name: 'Data Analytics Agent',
          type: 'analytics',
          description: 'Analyzes customer data patterns',
          capabilities: JSON.stringify(['read_customers', 'read_interactions', 'generate_reports']),
          isActive: true,
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user2',
          name: 'Data Collection Agent', 
          type: 'data',
          description: 'Collects customer data from various sources',
          capabilities: JSON.stringify(['create_customers', 'create_interactions']),
          isActive: true,
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          userId: 'user3',
          name: 'Customer Form Agent',
          type: 'form',
          description: 'Handles customer form submissions',
          capabilities: JSON.stringify(['create_customers', 'create_interactions']),
          isActive: false,
          lastSeen: null,
          createdAt: new Date().toISOString(),
        }
      ];
      setAgents(mockAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newApiKey.name) return;

    try {
      // In a real app, this would call your API to create an API key
      console.log('Creating API key:', newApiKey);
      setNewApiKey({ name: '', permissions: ['read', 'write'], expiresAt: '' });
      setShowApiKeyModal(false);
      // Refresh agents after creating key
      fetchAgents();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const getAgentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      form: 'bg-blue-100 text-blue-800',
      ai: 'bg-purple-100 text-purple-800',
      analytics: 'bg-green-100 text-green-800',
      data: 'bg-orange-100 text-orange-800',
      custom: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getAgentTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      form: Users,
      ai: Bot,
      analytics: BarChart3,
      data: Code,
      custom: Settings,
    };
    return icons[type] || Users;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your external agents and API integrations
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Agent Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Agents
                  </div>
                  <Button onClick={() => setShowApiKeyModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.length > 0 ? (
                    agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            {(() => {
                              const IconComponent = getAgentTypeIcon(agent.type);
                              return <IconComponent className="h-6 w-6" />;
                            })()}
                          </div>
                          <div>
                            <h4 className="font-semibold">{agent.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {agent.description || `${agent.type} agent`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getAgentTypeColor(agent.type)}>
                                {agent.type}
                              </Badge>
                              {agent.capabilities && (() => {
                                try {
                                  const caps = JSON.parse(agent.capabilities);
                                  return (
                                    <Badge variant="outline" className="text-xs">
                                      {Array.isArray(caps) ? caps.length : 0} capabilities
                                    </Badge>
                                  );
                                } catch (e) {
                                  console.error('Error parsing capabilities:', e);
                                  return (
                                    <Badge variant="outline" className="text-xs">
                                      0 capabilities
                                    </Badge>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Last seen: {agent.lastSeen ? new Date(agent.lastSeen).toLocaleDateString() : 'Never'}
                          </div>
                          <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No agents created yet</p>
                      <p className="text-sm">Create your first agent to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Column - Quick Stats & SDK Documentation */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{agents.length}</div>
                    <p className="text-sm text-muted-foreground">Total Agents</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {agents.filter((a) => a.isActive).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Agents</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {agents.filter((a) => a.type === 'ai').length}
                    </div>
                    <p className="text-sm text-muted-foreground">AI Agents</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {agents.filter((a) => a.type === 'form').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Form Agents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SDK Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  SDK Documentation
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Docs
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Quick Start</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get your agents connected in minutes with our comprehensive SDK
                    </p>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <code className="bg-black text-green-600 p-2 rounded">
                          npm install z-ai-web-dev-sdk
                        </code>
                      </div>
                      <div className="text-sm">
                        <code className="bg-black text-green-600 p-2 rounded">
                          const agent = new CRMAgent('your-api-key');
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Selected Agent Details - as a separate section, not part of the main grid */}
      {selectedAgent && (
        <div className="container mx-auto p-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
              <CardDescription>{selectedAgent.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Agent Type</Label>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = getAgentTypeIcon(selectedAgent.type);
                          return <IconComponent className="h-5 w-5 mr-2" />;
                        })()}
                        <span className="font-medium">{selectedAgent.type}</span>
                        <Badge className={getAgentTypeColor(selectedAgent.type)}>
                          {selectedAgent.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgent.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Capabilities</h4>
                    {selectedAgent.capabilities ? (() => {
                      try {
                        const capabilities = JSON.parse(selectedAgent.capabilities);
                        if (Array.isArray(capabilities) && capabilities.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-2">
                              {capabilities.map((cap: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          );
                        }
                        return <p className="text-sm text-muted-foreground">No capabilities configured</p>;
                      } catch (e) {
                        console.error('Error parsing capabilities:', e);
                        return <p className="text-sm text-muted-foreground">Invalid capabilities format</p>;
                      }
                    })() : (
                      <p className="text-sm text-muted-foreground">No capabilities configured</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="api-keys" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">API Keys</h4>
                      <Button size="sm" onClick={() => setShowApiKeyModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Key
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">API keys will appear here once created</p>
                      {/* In a real app, this would fetch actual API keys for the agent */}
                      <div className="text-center py-8 text-muted-foreground">
                        <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No API keys created yet</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Recent Activity</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Agent activity and API usage will appear here
                    </p>
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activity recorded yet</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Configuration</h4>
                    <div className="space-y-2">
                      <div>
                        <Label>Agent Name</Label>
                        <Input value={selectedAgent.name} disabled />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={selectedAgent.type} disabled>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="form">Form</SelectItem>
                            <SelectItem value="ai">AI</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                            <SelectItem value="data">Data</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Key Creation Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create API Key</h3>
              <Button variant="ghost" onClick={() => setShowApiKeyModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKeyName">Key Name</Label>
                <Input
                  id="apiKeyName"
                  placeholder="e.g., 'Customer Management Key'"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="permissions">Permissions</Label>
                <Select 
                  value={newApiKey.permissions.join(',')} 
                  onValueChange={(value) => setNewApiKey({ ...newApiKey, permissions: value.split(',') })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="read,write">Read & Write</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expiresAt">Expires At (optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={newApiKey.expiresAt}
                  onChange={(e) => setNewApiKey({ ...newApiKey, expiresAt: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createApiKey}>
                  Create API Key
                </Button>
                <Button variant="outline" onClick={() => setShowApiKeyModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}