import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Users, Trash2, Mail, Hash } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteUser(id);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast({
        title: 'User Deleted',
        description: 'The user has been removed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        <Card className="glass-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
              <Users className="h-6 w-6" />
              Admin Dashboard
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Manage registered users and their access
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-semibold">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          User ID
                        </div>
                      </TableHead>
                      <TableHead className="text-primary-foreground font-semibold">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Name
                        </div>
                      </TableHead>
                      <TableHead className="text-primary-foreground font-semibold">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email ID
                        </div>
                      </TableHead>
                      <TableHead className="text-primary-foreground font-semibold">
                        Role
                      </TableHead>
                      <TableHead className="text-primary-foreground font-semibold text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        className={`${idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/50 transition-colors`}
                      >
                        <TableCell className="font-mono text-sm">
                          {user.id}
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={user.role === 'admin'}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(user.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary">{users.length}</div>
              <p className="text-muted-foreground text-sm">Total Users</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-success">
                {users.filter((u) => u.role === 'admin').length}
              </div>
              <p className="text-muted-foreground text-sm">Admins</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-accent">
                {users.filter((u) => u.role === 'user').length}
              </div>
              <p className="text-muted-foreground text-sm">Regular Users</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
