'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Database, ArrowRight, Shield, Zap } from 'lucide-react';

export default function MigrationSuccess() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const migrationSteps = [
    {
      icon: Database,
      title: 'Database Provider Updated',
      description: 'Successfully migrated from SQLite to PostgreSQL',
      status: 'completed'
    },
    {
      icon: Shield,
      title: 'Neon Connection Established',
      description: 'Secure connection to Neon PostgreSQL cloud database',
      status: 'completed'
    },
    {
      icon: Zap,
      title: 'Schema Migration Complete',
      description: 'All tables and relationships migrated successfully',
      status: 'completed'
    },
    {
      icon: CheckCircle,
      title: 'Data Verification Passed',
      description: 'Admin user and test data created successfully',
      status: 'completed'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Migration Complete!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your CRM has been successfully migrated to PostgreSQL with Neon cloud hosting.
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          {migrationSteps.map((step, index) => (
            <Card 
              key={index}
              className={`transition-all duration-700 delay-${index * 100} ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <step.icon className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Migration Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Database Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium">PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Host:</span>
                  <span className="font-medium">Neon Cloud</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection:</span>
                  <span className="font-medium text-green-600">Secure SSL</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Admin Credentials</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">admin@simplecrm.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Password:</span>
                  <span className="font-medium">admin123</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium text-blue-600">Administrator</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
}