// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  SIGNUP: `${API_BASE_URL}/auth/signup`,
  
  // Bookings
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  AVAILABILITY: `${API_BASE_URL}/api/availability`,
  
  // Admin
  USERS: `${API_BASE_URL}/admin/users`,
  
  // Feedback
  FEEDBACK: `${API_BASE_URL}/feedback`,
  FEEDBACK_SUBMIT: `${API_BASE_URL}/feedback/submit`,
};

// Helper to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  console.log("Token:", token);

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
