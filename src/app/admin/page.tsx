'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Database, 
  Activity, 
  Server, 
  Key, 
  Lock,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BackupJob {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  outputPath: string;
  error?: string;
}

interface DataIntegrityCheck {
  tableName: string;
  recordCount: number;
  checksum: string;
  lastChecked: string;
  status: 'valid' | 'invalid' | 'missing';
}

interface RedundancyStatus {
  lastBackup: string | null;
  lastIntegrityCheck: string | null;
  dataIntegrity: DataIntegrityCheck[];
  backupStatus: 'up_to_date' | 'outdated' | 'missing';
  storageHealth: 'healthy' | 'degraded' | 'critical';
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(true);
  const [redundancyStatus, setRedundancyStatus] = useState<RedundancyStatus | null>(null);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupFiles, setBackupFiles] = useState<string[]>([]);
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [rateLimit, setRateLimit] = useState(5);
  const [retentionDays, setRetentionDays] = useState(7);
  const [backupInterval, setBackupInterval] = useState<'hourly' | 'daily' | 'weekly'>('daily');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load redundancy status
      const redundancyRes = await fetch('/api/monitor/redundancy');
      if (redundancyRes.ok) {
        const redundancyData = await redundancyRes.json();
        setRedundancyStatus(redundancyData);
      }
      
      // Load backup jobs
      const backupRes = await fetch('/api/backup?action=jobs');
      if (backupRes.ok) {
        const backupData = await backupRes.json();
        setBackupJobs(backupData.jobs || []);
      }
      
      // Load backup files
      const filesRes = await fetch('/api/backup?action=list');
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setBackupFiles(filesData.backupFiles || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!newBackupName.trim()) {
      toast.error('Backup name is required');
      return;
    }

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBackupName,
          description: newBackupDescription,
          includeSettings: true,
          includeUsers: true,
          includeData: true,
        }),
      });

      if (response.ok) {
        toast.success('Backup created successfully');
        setNewBackupName('');
        setNewBackupDescription('');
        loadAdminData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  };

  const handleRunIntegrityCheck = async () => {
    try {
      const response = await fetch('/api/monitor/redundancy', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Integrity check started');
        loadAdminData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to run integrity check');
      }
    } catch (error) {
      console.error('Error running integrity check:', error);
      toast.error('Failed to run integrity check');
    }
  };

  const handleDownloadBackup = (filename: string) => {
    window.open(`/api/backup?action=download&name=${encodeURIComponent(filename)}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
      case 'valid':
      case 'up_to_date':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'running':
      case 'outdated':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'failed':
      case 'invalid':
      case 'missing':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage security settings, backups, and system health
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="backups">
              <Database className="h-4 w-4 mr-2" />
              Backups
            </TabsTrigger>
            <TabsTrigger value="redundancy">
              <Shield className="h-4 w-4 mr-2" />
              Redundancy
            </TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Rate Limiting Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Rate Limiting
                  </CardTitle>
                  <CardDescription>
                    Configure rate limits to protect against brute force attacks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rateLimit">Max Login Attempts</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={rateLimit}
                        onChange={(e) => setRateLimit(Number(e.target.value))}
                        min={1}
                        max={100}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Per 15 minute window
                      </p>
                    </div>
                    <Button>
                      Update Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Password Policy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Password Policy
                  </CardTitle>
                  <CardDescription>
                    Configure password strength requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Minimum Length</Label>
                      <div className="text-sm">8 characters</div>
                    </div>
                    <div>
                      <Label>Complexity</Label>
                      <div className="text-sm">Uppercase, lowercase, and digit required</div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Session Management
                </CardTitle>
                <CardDescription>
                  Overview of active sessions and session settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-sm text-muted-foreground">Active Sessions</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">7</div>
                      <div className="text-sm text-muted-foreground">Days Timeout</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">150</div>
                      <div className="text-sm text-muted-foreground">Blocked IPs</div>
                    </div>
                  </div>
                  <Button variant="outline">
                    View Active Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backups Tab */}
          <TabsContent value="backups" className="space-y-6">
            {/* Create Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Create New Backup
                </CardTitle>
                <CardDescription>
                  Manually create a backup of your database and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupName">Backup Name</Label>
                    <Input
                      id="backupName"
                      placeholder="E.g., weekly-backup"
                      value={newBackupName}
                      onChange={(e) => setNewBackupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backupDescription">Description (Optional)</Label>
                    <Input
                      id="backupDescription"
                      placeholder="Backup description"
                      value={newBackupDescription}
                      onChange={(e) => setNewBackupDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateBackup}>
                    <Database className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                  <Button variant="outline" onClick={loadAdminData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Backup Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Backup Jobs
                </CardTitle>
                <CardDescription>
                  Recent backup jobs and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backupJobs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No backup jobs found. Create one to get started.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {backupJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{job.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Started: {new Date(job.startedAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            {job.error && (
                              <div className="text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" /> Error
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Backup Files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Available Backups
                </CardTitle>
                <CardDescription>
                  Download or restore from existing backup files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backupFiles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No backup files available. Create one first.
                    </p>
                  ) : (
                    backupFiles.map((file) => (
                      <div key={file} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="font-mono text-sm">{file}</div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadBackup(file)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redundancy Tab */}
          <TabsContent value="redundancy" className="space-y-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Overview of system redundancy and health status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {redundancyStatus ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {redundancyStatus.lastBackup ? 
                          new Date(redundancyStatus.lastBackup).toLocaleDateString() : 
                          'Never'}
                      </div>
                      <div className="text-sm text-muted-foreground">Last Backup</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {redundancyStatus.lastIntegrityCheck ? 
                          new Date(redundancyStatus.lastIntegrityCheck).toLocaleDateString() : 
                          'Never'}
                      </div>
                      <div className="text-sm text-muted-foreground">Last Check</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${getStatusColor(redundancyStatus.backupStatus)}`}>
                        {redundancyStatus.backupStatus}
                      </div>
                      <div className="text-sm text-muted-foreground">Backup Status</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${getStatusColor(redundancyStatus.storageHealth)}`}>
                        {redundancyStatus.storageHealth}
                      </div>
                      <div className="text-sm text-muted-foreground">Storage Health</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No redundancy data available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Data Integrity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Data Integrity
                </CardTitle>
                <CardDescription>
                  Status of integrity checks across database tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={handleRunIntegrityCheck}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Integrity Check
                  </Button>
                </div>
                
                {redundancyStatus?.dataIntegrity ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Table</th>
                          <th className="text-left py-2">Records</th>
                          <th className="text-left py-2">Last Checked</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {redundancyStatus.dataIntegrity.map((check) => (
                          <tr key={check.tableName} className="border-b">
                            <td className="py-2">{check.tableName}</td>
                            <td className="py-2">{check.recordCount}</td>
                            <td className="py-2">{new Date(check.lastChecked).toLocaleString()}</td>
                            <td className="py-2">
                              <Badge className={getStatusColor(check.status)}>
                                {check.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No integrity check data available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Backup Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Backup Scheduling
                </CardTitle>
                <CardDescription>
                  Configure automated backup settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="interval">Interval</Label>
                    <select
                      id="interval"
                      value={backupInterval}
                      onChange={(e) => setBackupInterval(e.target.value as any)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="retention">Retention (days)</Label>
                    <Input
                      id="retention"
                      type="number"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(Number(e.target.value))}
                      min={1}
                      max={365}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">
                      Update Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}