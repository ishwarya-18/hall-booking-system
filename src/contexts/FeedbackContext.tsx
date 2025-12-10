import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FeedbackItem {
  user_id: string;
  name: string;
  feedback: string;
  created_at?: string;
}

interface FeedbackContextType {
  feedbackList: FeedbackItem[];
  setFeedbackList: React.Dispatch<React.SetStateAction<FeedbackItem[]>>;
  addFeedback: (feedback: FeedbackItem) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  const addFeedback = (feedback: FeedbackItem) => {
    setFeedbackList((prev) => [feedback, ...prev]);
  };

  return (
    <FeedbackContext.Provider value={{ feedbackList, setFeedbackList, addFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
