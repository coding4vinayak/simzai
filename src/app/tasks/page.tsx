'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  FileText,
  Plus,
  User
} from 'lucide-react';

interface Task {
  id: string;
  type: string;
  status: string;
  runAt: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

interface TasksResponse {
  tasks: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTasks();
  }, [currentPage, statusFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data: TasksResponse = await response.json();
        setTasks(data.tasks);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTaskIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      email_followup: <Mail className="h-4 w-4" />,
      whatsapp_msg: <MessageSquare className="h-4 w-4" />,
      invoice_due: <FileText className="h-4 w-4" />,
    };
    return icons[type] || <CheckSquare className="h-4 w-4" />;
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email_followup: 'Email Follow-up',
      whatsapp_msg: 'WhatsApp Message',
      invoice_due: 'Invoice Due',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isOverdue = (runAt: string) => {
    return new Date(runAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage automation tasks and scheduled activities
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchTasks} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>
              Automation tasks scheduled for your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {statusFilter !== 'all' 
                    ? 'No tasks match your filters' 
                    : 'No tasks scheduled yet.'}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        isOverdue(task.runAt) && task.status === 'pending' 
                          ? 'border-red-200 bg-red-50' 
                          : 'hover:bg-muted/50'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          {getTaskIcon(task.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{getTaskTypeLabel(task.type)}</h3>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            {isOverdue(task.runAt) && task.status === 'pending' && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{task.customer.name}</span>
                            {task.customer.email && (
                              <>
                                <span>•</span>
                                <span>{task.customer.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Scheduled</span>
                          </div>
                          <div className="font-medium">{formatDate(task.runAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            Created {formatDate(task.createdAt)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {task.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                              >
                                <CheckSquare className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task.id, 'failed')}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {task.status === 'failed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
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