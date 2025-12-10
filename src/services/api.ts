import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface BookingData {
  hall: string;
  date: string;
  slots: string[];
  purpose: string;
}

interface FeedbackData {
  feedback: string;
}

class ApiService {
  // Auth
  async login(data: LoginData) {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    return response.json();
  }

  async signup(data: SignupData) {
    const response = await fetch(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    
    return response.json();
  }

  // Bookings
  async getBookings() {
    const response = await fetch(API_ENDPOINTS.BOOKINGS, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    
    return response.json();
  }

  async createBooking(data: BookingData) {
    const response = await fetch(API_ENDPOINTS.BOOKINGS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create booking');
    }
    
    return response.json();
  }

  async deleteBooking(id: string) {
    const response = await fetch(`${API_ENDPOINTS.BOOKINGS}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete booking');
    }
    
    return response.json();
  }

  async getAvailability(hall: string, date: string) {
    const response = await fetch(
      `${API_ENDPOINTS.AVAILABILITY}?hall=${encodeURIComponent(hall)}&date=${encodeURIComponent(date)}`,
      { headers: getAuthHeaders() }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }
    
    return response.json();
  }

  // Admin
  async getUsers() {
    const response = await fetch(API_ENDPOINTS.USERS, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return response.json();
  }

  async deleteUser(id: string) {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    return response.json();
  }

  // Feedback
  async getFeedback() {
    const response = await fetch(API_ENDPOINTS.FEEDBACK, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch feedback');
    }
    
    return response.json();
  }

  async submitFeedback(data: FeedbackData) {
    const response = await fetch(API_ENDPOINTS.FEEDBACK_SUBMIT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit feedback');
    }
    
    return response.json();
  }
}

export const apiService = new ApiService();
