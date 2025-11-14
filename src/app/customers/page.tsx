'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building, 
  Calendar,
  MessageSquare,
  Edit,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  source?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  interactions: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
  _count: {
    interactions: number;
    tasks: number;
  };
}

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    tags: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchQuery, statusFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/customers?${params}`);
      if (response.ok) {
        const data: CustomersResponse = await response.json();
        setCustomers(data.customers.map(customer => ({
          ...customer,
          tags: customer.tags ? JSON.parse(customer.tags) : []
        })));
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCustomer,
          tags: newCustomer.tags ? newCustomer.tags.split(',').map(tag => tag.trim()) : [],
        }),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewCustomer({
          name: '',
          email: '',
          phone: '',
          company: '',
          source: '',
          tags: '',
        });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customers and leads
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a new customer or lead in your CRM
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={newCustomer.source}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="Website, Referral, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newCustomer.tags}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="VIP, Enterprise, Hot Lead"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer} disabled={!newCustomer.name}>
                  Create Customer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              A list of all customers and leads in your CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No customers match your filters' 
                    : 'No customers yet. Add your first customer to get started.'}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {customer.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{customer.name}</h3>
                            <Badge className={getStatusColor(customer.status)}>
                              {customer.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                            {customer.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.company && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {customer.company}
                              </div>
                            )}
                          </div>
                          {customer.tags && customer.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {customer.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-muted-foreground mr-4">
                          <div>{customer._count.interactions} interactions</div>
                          <div>{customer._count.tasks} tasks</div>
                          <div>Added {formatDate(customer.createdAt)}</div>
                        </div>
                        <div className="flex gap-1">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}