'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Users, Database, RefreshCw } from 'lucide-react';

interface DatabaseStatus {
  userCount: number;
  hasUsers: boolean;
  hasAdminUser: boolean;
  adminUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
}

export default function DatabaseDiagnosticPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/check-db');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setError('Failed to check database status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    try {
      const response = await fetch('/api/init-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          userCount: prev.userCount + 1,
          hasUsers: true,
          hasAdminUser: true,
          adminUser: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            isActive: data.user.isActive,
            createdAt: data.user.createdAt,
          },
        }));
      } else {
        setError('Failed to create admin user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Checking database...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-4">
          <Card>
            <CardHeader className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <CardTitle>Database Error</CardTitle>
              <CardDescription>
                Unable to connect to the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button onClick={checkDatabaseStatus} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Database Diagnostic</h1>
          <p className="text-muted-foreground">
            Check the current state of your CRM database
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Status
              </CardTitle>
              <CardDescription>
                Current database connection state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Database Connected</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Total Users: {status.userCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.hasUsers ? 'default' : 'secondary'}>
                        {status.hasUsers ? 'Users Exist' : 'No Users'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.hasAdminUser ? 'default' : 'secondary'}>
                        {status.hasAdminUser ? 'Admin User' : 'No Admin'}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  No database status available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Information
              </CardTitle>
              <CardDescription>
                Current user setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status?.adminUser ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h3 className="font-semibold">Admin User Found</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {status.adminUser.name}</div>
                      <div><strong>Email:</strong> {status.adminUser.email}</div>
                      <div><strong>Role:</strong> {status.adminUser.role}</div>
                      <div><strong>Status:</strong> {status.adminUser.isActive ? 'Active' : 'Inactive'}</div>
                      <div><strong>Created:</strong> {new Date(status.adminUser.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild>
                      <a href="/login" className="flex-1">
                        Login as Admin
                      </a>
                    </Button>
                    <Button asChild>
                      <a href="/settings" className="flex-1">
                        Manage Users
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="p-6">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold">No Admin User Found</h3>
                    <p className="text-muted-foreground mb-4">
                      The database is empty or has no admin users.
                    </p>
                    <Button onClick={createAdminUser} className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Create Admin User
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Actions
              </CardTitle>
              <CardDescription>
                Database management actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={checkDatabaseStatus} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/init" className="flex items-center justify-center">
                  <Users className="h-4 w-4 mr-2" />
                  Go to Initialization
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/login" className="flex items-center justify-center">
                  <Users className="h-4 w-4 mr-2" />
                  Go to Login
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}