import { useState } from 'react';
import { MessageSquarePlus, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFeedback } from '@/contexts/FeedbackContext';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export function FeedbackButton() {
  const { isAdmin } = useAuth();
  
  // Don't show feedback button for admin users
  if (isAdmin) {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { addFeedback } = useFeedback();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter feedback before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiService.submitFeedback({ feedback: feedback.trim() });

      addFeedback({
        user_id: '1',
        name: 'Current User',
        feedback: feedback.trim(),
      });

      toast({
        title: 'Thank you!',
        description: 'Your feedback has been submitted successfully.',
      });

      setFeedback('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit feedback.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-primary"
        size="lg"
      >
        <MessageSquarePlus className="h-5 w-5 mr-2" />
        Give Feedback
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary flex items-center gap-2">
              <MessageSquarePlus className="h-6 w-6" />
              We'd Love Your Feedback!
            </DialogTitle>
            <DialogDescription>
              Help us improve your experience by sharing your thoughts.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter your feedback here..."
            className="min-h-[150px] resize-none"
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
