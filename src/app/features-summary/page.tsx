'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  User, 
  FileText, 
  Search, 
  Tag, 
  Phone, 
  MapPin, 
  Upload, 
  Settings, 
  ArrowRight,
  Star,
  Shield,
  Zap
} from 'lucide-react';

export default function FeaturesSummary() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: User,
      title: 'User Profile Settings',
      description: 'Complete profile management with personal information',
      features: ['Mobile number', 'Phone number', 'Address', 'Bio/Notes', 'Avatar upload', 'Account statistics'],
      status: 'completed',
      color: 'text-blue-600',
      path: '/profile'
    },
    {
      icon: FileText,
      title: 'Invoice Generation',
      description: 'Create and manage professional invoices',
      features: ['Auto-generated invoice numbers', 'Customer linking', 'Due date tracking', 'Status management', 'PDF support'],
      status: 'completed',
      color: 'text-green-600',
      path: '/invoices'
    },
    {
      icon: Tag,
      title: 'Customer Tags System',
      description: 'Organize customers with flexible tagging',
      features: ['Multiple tags per customer', 'Tag-based search', 'JSON tag storage', 'Easy filtering'],
      status: 'completed',
      color: 'text-purple-600',
      path: '/customers'
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Powerful customer search capabilities',
      features: ['Name search', 'Email search', 'Company search', 'Phone/Mobile search', 'Tag filtering', 'Status filtering'],
      status: 'completed',
      color: 'text-orange-600',
      path: '/customers'
    },
    {
      icon: Phone,
      title: 'Enhanced Contact Info',
      description: 'Comprehensive customer contact details',
      features: ['Phone number', 'Mobile number', 'Email address', 'Physical address', 'Company details'],
      status: 'completed',
      color: 'text-cyan-600',
      path: '/customers'
    },
    {
      icon: Shield,
      title: 'Agent Hierarchy (Coming Soon)',
      description: 'Multi-level agent management system',
      features: ['Agent can create users', 'Company management', 'User limits per agent', 'Hierarchical permissions'],
      status: 'pending',
      color: 'text-red-600',
      path: '#'
    },
    {
      icon: Zap,
      title: 'Agent Webhooks (Coming Soon)',
      description: 'Individual webhook capabilities for agents',
      features: ['Personal webhook endpoints', 'Lead import automation', 'Custom event triggers', 'Integration management'],
      status: 'pending',
      color: 'text-red-600',
      path: '#'
    }
  ];

  const completedFeatures = features.filter(f => f.status === 'completed').length;
  const totalFeatures = features.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6">
            <Star className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CRM Features Enhanced!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Your CRM now includes comprehensive profile management, advanced search, invoice generation, 
            and powerful tagging system. Agent hierarchy and individual webhooks coming soon!
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {completedFeatures}/{totalFeatures} Features Complete
            </Badge>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalFeatures }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < completedFeatures ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`transition-all duration-700 delay-${index * 100} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {feature.title}
                    <Badge 
                      variant={feature.status === 'completed' ? 'outline' : 'destructive'}
                      className="text-xs"
                    >
                      {feature.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
                {feature.status === 'completed' && (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      {item}
                    </div>
                  ))}
                </div>
                {feature.path !== '#' && (
                  <Button 
                    asChild 
                    className="w-full"
                    variant={feature.status === 'completed' ? 'default' : 'outline'}
                  >
                    <a href={feature.path}>
                      {feature.status === 'completed' ? (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Use Feature
                        </>
                      ) : (
                        <>
                          Coming Soon
                        </>
                      )}
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Profile Settings</h3>
              <p className="text-sm text-gray-600 mb-4">
                Update your personal information, avatar, and contact details
              </p>
              <Button asChild className="w-full">
                <a href="/profile">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </a>
              </Button>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Invoices</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create professional invoices with auto-generated numbers
              </p>
              <Button asChild className="w-full">
                <a href="/invoices">
                  <FileText className="w-4 h-4 mr-2" />
                  Invoices
                </a>
              </Button>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Customer Tags</h3>
              <p className="text-sm text-gray-600 mb-4">
                Organize customers with flexible tagging and search
              </p>
              <Button asChild className="w-full">
                <a href="/customers">
                  <Tag className="w-4 h-4 mr-2" />
                  Customers
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            asChild 
            size="lg"
            className="px-8 py-3"
          >
            <a href="/">
              <ArrowRight className="w-5 h-5 mr-2" />
              Go to Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}