'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { 
  Settings, 
  Users, 
  Key, 
  Webhook, 
  Download, 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  TestTube,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Shield
} from 'lucide-react';

interface SettingsData {
  [key: string]: any;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  _count: {
    apiKeys: number;
    sessions: number;
  };
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  type: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastTrigger?: string;
  createdAt: string;
}

interface ImportExport {
  id: string;
  type: string;
  status: string;
  fileType: string;
  fileName: string;
  records: number;
  processed: number;
  errors?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { user, token, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SettingsData>({});
  const [users, setUsers] = useState<User[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [importExports, setImportExports] = useState<ImportExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [newApiKey, setNewApiKey] = useState({ name: '', permissions: ['read'], expiresAt: '' });
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', type: 'api', events: [], secret: '' });
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
      fetchUsers();
      fetchApiKeys();
      fetchWebhooks();
      fetchImportExports();
    } else {
      fetchSettings();
    }
    setLoading(false);
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    }
  };

  const fetchImportExports = async () => {
    try {
      const response = await fetch('/api/import-export');
      if (response.ok) {
        const data = await response.json();
        setImportExports(data.imports);
      }
    } catch (error) {
      console.error('Error fetching import/export history:', error);
    }
  };

  const updateSettings = async (newSettings: SettingsData) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: newSettings }),
      });

      if (response.ok) {
        setSettings(newSettings);
        setMessage('Settings updated successfully!');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('Failed to update settings');
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setNewUser({ name: '', email: '', password: '', role: 'user' });
        fetchUsers();
        setMessage('User created successfully!');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage('Failed to create user');
    }
  };

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newApiKey),
      });

      if (response.ok) {
        setNewApiKey({ name: '', permissions: ['read'], expiresAt: '' });
        fetchApiKeys();
        setMessage('API key created successfully!');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      setMessage('Failed to create API key');
    }
  };

  const createWebhook = async () => {
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newWebhook),
      });

      if (response.ok) {
        setNewWebhook({ name: '', url: '', events: [], secret: '' });
        fetchWebhooks();
        setMessage('Webhook created successfully!');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      setMessage('Failed to create webhook');
    }
  };

  const handleExport = async (fileType: string) => {
    try {
      const formData = new FormData();
      formData.append('type', 'export');
      formData.append('fileType', fileType);

      const response = await fetch('/api/import-export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        fetchImportExports();
        setMessage(`Export started successfully!`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage('Failed to export data');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      const formData = new FormData();
      formData.append('type', 'import');
      formData.append('fileType', importFile.name.endsWith('.csv') ? 'csv' : 'json');
      formData.append('file', importFile);

      const response = await fetch('/api/import-export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setImportFile(null);
        fetchImportExports();
        setMessage('Import started successfully!');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setMessage('Failed to import data');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access settings. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your CRM system configuration and preferences
          </p>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Basic company settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={settings.company_name || ''}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_email">Company Email</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={settings.company_email || ''}
                      onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                    />
                  </div>
                  <Button onClick={() => updateSettings(settings)}>
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>SMTP settings for sending emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={settings.smtp_host || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={settings.smtp_port || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_user">SMTP Username</Label>
                    <Input
                      id="smtp_user"
                      value={settings.smtp_user || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_password">SMTP Password</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={settings.smtp_password || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                    />
                  </div>
                  <Button onClick={() => updateSettings(settings)}>
                    Save Email Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>Create and manage user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Input
                      placeholder="Name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={createUser} disabled={!newUser.name || !newUser.email || !newUser.password}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold">{user.name}</h3>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge 
                                  variant={
                                    user.role === 'admin' ? 'default' : 
                                    user.role === 'agent' ? 'destructive' : 
                                    'secondary'
                                  }
                                >
                                  {user.role}
                                </Badge>
                                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>API Keys: {user._count.apiKeys}</div>
                            <div>Sessions: {user._count.sessions}</div>
                            <div>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api-keys">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>Manage API keys for external integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Input
                      placeholder="Key name"
                      value={newApiKey.name}
                      onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    />
                    <Select value={newApiKey.permissions[0]} onValueChange={(value) => setNewApiKey({ ...newApiKey, permissions: [value] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="write">Write</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="datetime-local"
                      value={newApiKey.expiresAt}
                      onChange={(e) => setNewApiKey({ ...newApiKey, expiresAt: e.target.value })}
                    />
                    <Button onClick={createApiKey} disabled={!newApiKey.name}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Key
                    </Button>
                  </div>

                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{apiKey.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">{apiKey.key}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{apiKey.permissions.join(', ')}</Badge>
                              <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                                {apiKey.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webhooks">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>Configure webhooks for real-time data synchronization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 mb-6">
                    <Input
                      placeholder="Webhook name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    />
                    <Input
                      placeholder="https://your-webhook-url.com"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Select value={newWebhook.type} onValueChange={(value) => setNewWebhook({ ...newWebhook, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select webhook type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api">API Webhook</SelectItem>
                          <SelectItem value="continuous">Continuous Listener</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Secret (optional)"
                        value={newWebhook.secret}
                        onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Events (for API webhooks)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['customer.created', 'customer.updated', 'interaction.created', 'task.created'].map((event) => (
                          <div key={event} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={event}
                              checked={newWebhook.events.includes(event)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                                } else {
                                  setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(e => e !== event) });
                                }
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={event} className="text-sm">{event}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={createWebhook} disabled={!newWebhook.name || !newWebhook.url}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Webhook
                    </Button>
                  </div>

                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{webhook.name}</h3>
                            <p className="text-sm text-muted-foreground">{webhook.url}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={webhook.type === 'continuous' ? 'destructive' : 'outline'}>
                                {webhook.type === 'continuous' ? 'Continuous' : 'API'}
                              </Badge>
                              <Badge variant="outline">{webhook.events.join(', ')}</Badge>
                              <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                                {webhook.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Import Data
                    </CardTitle>
                    <CardDescription>Import customers from CSV or JSON files</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="import_file">Select File</Label>
                      <Input
                        id="import_file"
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button onClick={handleImport} disabled={!importFile}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export Data
                    </CardTitle>
                    <CardDescription>Export customers data in various formats</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={() => handleExport('csv')} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button onClick={() => handleExport('json')} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Export as JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Import/Export History</CardTitle>
                  <CardDescription>View and manage your data import/export history</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {importExports.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{item.fileName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.type === 'import' ? 'Import' : 'Export'} • {item.fileType.toUpperCase()}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                              <Badge variant="outline">
                                {item.processed}/{item.records} records
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {item.type === 'export' && item.status === 'completed' && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}