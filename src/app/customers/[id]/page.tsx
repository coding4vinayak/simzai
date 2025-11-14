'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Globe, 
  DollarSign,
  Tag,
  MessageSquare,
  Calendar,
  FileText,
  Package,
  Save,
  Send,
  Plus,
  Edit,
  Clock
} from 'lucide-react';

export default function CustomerDetailPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !customer) return;

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(customer),
      });

      if (response.ok) {
        setMessage('Customer updated successfully!');
        setIsEditing(false);
        fetchCustomer(); // Refresh data
      } else {
        setMessage('Failed to update customer');
      }
    } catch (error) {
      setMessage('Error updating customer');
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Customer Not Found</h1>
          <p className="text-muted-foreground">The customer you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Back to Customers
          </Button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customer Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Customer Overview</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-2xl">
                      {customer.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{customer.name}</h3>
                    <p className="text-muted-foreground">{customer.company}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.website || 'No website'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.address || 'No address'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge className={getStatusColor(customer.status)}>
                    {customer.status}
                  </Badge>
                  {customer.priority && (
                    <Badge className={getPriorityColor(customer.priority)}>
                      {customer.priority} priority
                    </Badge>
                  )}
                </div>

                {customer.source && (
                  <div className="text-sm text-muted-foreground">
                    Source: {customer.source}
                  </div>
                )}

                {customer.value && (
                  <div className="text-sm">
                    <span className="font-semibold">Value:</span> ${customer.value}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="communications">Emails</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="goods">Goods</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Industry</Label>
                      <Input value={customer.industry || ''} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Company Size</Label>
                      <Input value={customer.size || ''} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Annual Revenue</Label>
                      <Input value={customer.revenue || ''} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Lead Source</Label>
                      <Input value={customer.source || ''} disabled={!isEditing} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tags & Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {customer.tags?.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        )) || <span className="text-muted-foreground">No tags</span>}
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea 
                        value={customer.notes || ''} 
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Add notes about this customer..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Phone Number</Label>
                      <Input value={customer.phone || ''} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Mobile Number</Label>
                      <Input value={customer.mobile || ''} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input value={customer.email || ''} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input value={customer.website || ''} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input value={customer.address || ''} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input value={customer.company || ''} disabled={!isEditing} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="communications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Email Communications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customer.emails?.length > 0 ? (
                        customer.emails.map((email: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{email.subject}</h4>
                                <p className="text-sm text-muted-foreground">
                                  From: {email.fromEmail} • To: {email.toEmail}
                                </p>
                              </div>
                              <Badge variant={email.status === 'sent' ? 'default' : 'secondary'}>
                                {email.status}
                              </Badge>
                            </div>
                            <p className="text-sm">{email.body}</p>
                            <div className="text-xs text-muted-foreground">
                              {new Date(email.sentAt).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No email communications yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customer.services?.length > 0 ? (
                        customer.services.map((service: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{service.name}</h4>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">${service.price}</div>
                                {service.recurring && (
                                  <Badge variant="outline">{service.frequency}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {service.startDate && `Started: ${new Date(service.startDate).toLocaleDateString()}`}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No services purchased yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goods" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Goods & Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customer.goods?.length > 0 ? (
                        customer.goods.map((good: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{good.name}</h4>
                                <p className="text-sm text-muted-foreground">{good.description}</p>
                                {good.sku && <p className="text-xs">SKU: {good.sku}</p>}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">${good.price}</div>
                                <div className="text-sm">Qty: {good.quantity}</div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {good.orderDate && `Ordered: ${new Date(good.orderDate).toLocaleDateString()}`}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No goods purchased yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}