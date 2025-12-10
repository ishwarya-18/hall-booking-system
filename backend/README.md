# Hall Booking Backend

Express.js backend for the Hall Booking System.

## Deployment on Render

### 1. Create Admin User in Database

First, connect to your PostgreSQL database and run this SQL:

```sql
-- Create tables (if not already created)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    hall VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    slots TEXT[] NOT NULL,
    purpose TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user (password: Admin@123)
INSERT INTO users (name, email, phone, password, role) 
VALUES (
    'Admin', 
    'ishwaryarajendran77@gmail.com', 
    '0000000000', 
    '$2a$10$8K1p/a0dL1LXMIgoEDFrwOEDqVp7tB4rG5HbYpzVmLmJNkKvQnHlC', 
    'admin'
);
```

### 2. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `hall-booking-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Set Environment Variables

In Render, add these environment variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `JWT_SECRET` | `hall-booking-secret-key-2024` |

### 4. Deploy

Click **Create Web Service** and wait for deployment.

Your API will be available at: `https://hall-booking-backend.onrender.com`

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user

### Bookings (requires auth)
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/availability?hall=X&date=Y` - Check availability

### Admin (requires admin role)
- `GET /admin/users` - List all users
- `DELETE /admin/users/:id` - Delete user

### Feedback
- `GET /feedback` - Get all feedback (admin only)
- `POST /feedback/submit` - Submit feedback (requires auth)
