'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Shield, User, Key } from 'lucide-react';

interface InitStatus {
  hasUsers: boolean;
  userCount: number;
}

export default function InitPage() {
  const [status, setStatus] = useState<InitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [adminCreated, setAdminCreated] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/init-admin');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    setCreating(true);
    setMessage('');

    try {
      const response = await fetch('/api/init-admin', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Admin user created successfully!`);
        setAdminCreated(true);
        setStatus({ hasUsers: true, userCount: 1 });
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to create admin user');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold">Checking system status...</h2>
        </div>
      </div>
    );
  }

  if (status?.hasUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-4">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle>System Ready</CardTitle>
              <CardDescription>
                Your CRM system is already set up and ready to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminCreated && (
                <Alert>
                  <AlertDescription className="space-y-2">
                    <div className="font-semibold">Default Admin Credentials:</div>
                    <div className="bg-muted p-3 rounded-lg space-y-1">
                      <div><strong>Email:</strong> admin@simplecrm.com</div>
                      <div><strong>Password:</strong> admin123</div>
                    </div>
                    <div className="text-sm text-amber-600">
                      ⚠️ Please change the default password after first login!
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>Total Users: {status.userCount}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  <span>System Status: Configured</span>
                </div>
              </div>

              <Button asChild className="w-full">
                <a href="/login">Go to Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Initialize SimpleCRM</h1>
          <p className="text-muted-foreground">
            Set up your admin account to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Admin User</CardTitle>
            <CardDescription>
              No users found. Let's create your first administrator account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will create a default admin user with the following credentials:
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span><strong>Name:</strong> Default Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span><strong>Email:</strong> admin@simplecrm.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span><strong>Password:</strong> admin123</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Please store these credentials securely and change the password after first login.
              </AlertDescription>
            </Alert>

            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={createAdmin} 
              disabled={creating || adminCreated}
              className="w-full"
            >
              {creating ? 'Creating Admin...' : 'Create Admin User'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}