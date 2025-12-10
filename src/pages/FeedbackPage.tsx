import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFeedback } from '@/contexts/FeedbackContext';
import { apiService } from '@/services/api';
import { MessageSquare, User, Hash } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function FeedbackPage() {
  const { feedbackList, setFeedbackList } = useFeedback();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data = await apiService.getFeedback();
        if (Array.isArray(data)) {
          setFeedbackList(data.filter(item => item.user_id));
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      }
    };

    fetchFeedback();
  }, [setFeedbackList]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        <Card className="glass-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              User Feedback
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              View all feedback submitted by users
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {feedbackList.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No feedback available</p>
                <p className="text-sm">Feedback from users will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-semibold w-[100px]">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          User ID
                        </div>
                      </TableHead>
                      <TableHead className="text-primary-foreground font-semibold w-[150px]">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Name
                        </div>
                      </TableHead>
                      <TableHead className="text-primary-foreground font-semibold">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Feedback
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackList.map((item, idx) => (
                      <TableRow
                        key={idx}
                        className={`${idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/50 transition-colors`}
                      >
                        <TableCell className="font-mono text-sm">
                          <Badge variant="secondary">{item.user_id}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-md">
                          {item.feedback}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary">{feedbackList.length}</div>
              <p className="text-muted-foreground text-sm">Total Feedback</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-success">
                {new Set(feedbackList.map((f) => f.user_id)).size}
              </div>
              <p className="text-muted-foreground text-sm">Unique Users</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
