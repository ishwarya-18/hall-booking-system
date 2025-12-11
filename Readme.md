# BIT Hall Booking System

A web-based hall booking management system for Bannari Amman Institute of Technology (BIT). This application allows users to book college halls, check availability, and submit feedback.

## Features

- **User Authentication**: Secure login and signup with JWT-based authentication
- **Hall Booking**: Book available halls with specific time slots
- **Availability Calendar**: View hall availability across different dates
- **AI Assistant**: Natural language chatbot for booking assistance (powered by Google Gemini)
- **Feedback System**: Submit and view user feedback
- **Admin Dashboard**: Manage users, bookings, and view feedback

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Shadcn/UI (component library)
- React Router (navigation)
- React Query (data fetching)

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- Google Gemini API (AI chatbot)

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   └── lib/            # Utility functions
├── backend/
│   ├── server.js       # Express server
│   └── README.md       # Backend deployment guide
└── public/             # Static assets
```

## Available Halls

- Seminar Hall
- Conference Room
- Auditorium
- Meeting Room A
- Meeting Room B

## Time Slots

- 9:00 AM - 10:00 AM
- 10:00 AM - 11:00 AM
- 11:00 AM - 12:00 PM
- 12:00 PM - 1:00 PM
- 2:00 PM - 3:00 PM
- 3:00 PM - 4:00 PM
- 4:00 PM - 5:00 PM

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=<backend-api-url>
```

### Backend (backend/.env)
```
DATABASE_URL=<postgresql-connection-string>
JWT_SECRET=<your-jwt-secret>
PORT=5000
GEMINI_API_KEY=<google-gemini-api-key>
```

## Deployment

### Frontend
Deployed via Lovable platform at: https://hall-booking-system-a3k3.onrender.com

### Backend
Deployed on Render at: https://hall-booking-backend-q55e.onrender.com

See `backend/README.md` for detailed backend deployment instructions.

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user

### Bookings (requires auth)
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/availability` - Check hall availability

### Admin (requires admin role)
- `GET /admin/users` - List all users
- `DELETE /admin/users/:id` - Delete user

### Feedback
- `GET /feedback` - Get all feedback (admin only)
- `POST /feedback/submit` - Submit feedback

### AI Assistant
- `POST /api/ai-chat` - Chat with AI booking assistant

## Admin Access

- **Email**: ishwaryarajendran77@gmail.com
- **Password**: Admin@123

## Business Rules

- Users cannot cancel bookings for past dates
- Admin users can only view feedback, not submit it
- Each booking requires hall selection, date, time slots, and purpose

## License

This project is developed for Bannari Amman Institute of Technology.