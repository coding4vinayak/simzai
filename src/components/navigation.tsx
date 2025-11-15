'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Settings,
  BarChart3,
  LogOut,
  User
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Agents', href: '/agents', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CRM</span>
              </div>
              <span className="font-bold text-xl">SimpleCRM</span>
            </Link>
            
            {user && (
              <div className="hidden md:flex space-x-1">
                {navigation
                  .filter((item) => {
                    // Only show Settings if user is admin
                    if (item.name === 'Settings') {
                      return isAdmin;
                    }
                    return true;
                  })
                  .map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          size="sm"
                          className={cn(
                            'gap-2',
                            isActive && 'bg-secondary'
                          )}
                        >
                          {item.icon && (() => {
                            const DynamicIcon = item.icon;
                            return <DynamicIcon className="h-4 w-4" />;
                          })()}
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Welcome,</span>
                <span className="font-medium">{user.name}</span>
                {isAdmin && (
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                    Admin
                  </span>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}