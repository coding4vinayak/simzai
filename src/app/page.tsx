'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Phone, 
  Mail, 
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Star,
  Building,
  Package,
  FileText
} from 'lucide-react';

export default function CRMDashboard() {
  const { user, token, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    leadsCount: 0,
    prospectsCount: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentInteractions: 0,
    tasksDue: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent customers
      const customersResponse = await fetch('/api/customers?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setRecentCustomers(customersData.customers || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-blue-100 text-blue-800',
      prospect: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      churned: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredCustomers = recentCustomers.filter(customer => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'leads') return customer.status === 'lead';
    if (activeFilter === 'active') return customer.status === 'active';
    if (activeFilter === 'prospects') return customer.status === 'prospect';
    return true;
  }).filter(customer => 
    searchQuery === '' || 
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your leads, customers, and business relationships
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.leadsCount} new leads this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.prospectsCount} prospects in pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.monthlyRevenue.toLocaleString()} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Due</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.tasksDue}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentInteractions} recent interactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Sales Pipeline
              </CardTitle>
              <CardDescription>Customer journey through your sales funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Leads</span>
                  </div>
                  <Badge variant="secondary">{stats.leadsCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium">Prospects</span>
                  </div>
                  <Badge variant="secondary">{stats.prospectsCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <Badge variant="secondary">{stats.activeCustomers}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Churned</span>
                  </div>
                  <Badge variant="destructive">0</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add New Customer
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Email Campaign
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Add Service
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Customers with Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Customers
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Latest customer updates and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All ({filteredCustomers.length})</TabsTrigger>
                <TabsTrigger value="leads">Leads ({stats.leadsCount})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.activeCustomers})</TabsTrigger>
                <TabsTrigger value="prospects">Prospects ({stats.prospectsCount})</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Customer List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer: any) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{customer.name}</h4>
                        <p className="text-sm text-muted-foreground">{customer.company}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                          {customer.source && (
                            <Badge variant="outline" className="text-xs">
                              {customer.source}
                            </Badge>
                          )}
                        </div>
                        {customer.tags && customer.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {customer.tags.slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {customer.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{customer.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {customer.value && `$${customer.value}`}
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No customers found</p>
                  <p className="text-sm">
                    {activeFilter !== 'all' && `No ${activeFilter} customers found`}
                    {activeFilter === 'all' && searchQuery && `No customers matching "${searchQuery}"`}
                    {activeFilter === 'all' && !searchQuery && 'No customers yet'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}