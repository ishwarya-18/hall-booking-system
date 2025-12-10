require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Check if email already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [name, email, phone, hashedPassword, 'user']
    );
    
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== BOOKING ROUTES ====================

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE user_id = $1 ORDER BY booking_date DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { hall, date, slots, purpose } = req.body;
    
    // Check for slot conflicts
    const conflicts = await pool.query(
      'SELECT * FROM bookings WHERE hall = $1 AND booking_date = $2 AND slots && $3',
      [hall, date, slots]
    );
    
    if (conflicts.rows.length > 0) {
      return res.status(400).json({ error: 'Some slots are already booked' });
    }
    
    // Create booking
    const result = await pool.query(
      'INSERT INTO bookings (user_id, hall, booking_date, slots, purpose) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, hall, date, slots, purpose]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

app.get('/api/availability', authenticateToken, async (req, res) => {
  try {
    const { hall, date } = req.query;
    
    const result = await pool.query(
      'SELECT slots FROM bookings WHERE hall = $1 AND booking_date = $2',
      [hall, date]
    );
    
    const bookedSlots = result.rows.flatMap(row => row.slots);
    res.json({ bookedSlots });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// ==================== ADMIN ROUTES ====================

app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Prevent deleting admin users
    await pool.query(
      'DELETE FROM users WHERE id = $1 AND role != $2',
      [req.params.id, 'admin']
    );
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== AI CHAT ROUTES ====================

const HALLS = ['Main Auditorium Hall', 'Vedhanayagam Hall', 'ECE Seminar Hall', 'SF Seminar Hall'];
const MORNING_SLOTS = ['8:30 - 9:00', '9:00 - 9:30', '9:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00', '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30'];
const AFTERNOON_SLOTS = ['1:00 - 1:30', '1:30 - 2:00', '2:00 - 2:30', '2:30 - 3:00', '3:00 - 3:30', '3:30 - 4:00', '4:00 - 4:30', 'After 4:30'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];
const FULL_DAY_SLOTS = ALL_SLOTS;

// Helper function to parse date with better "next monday" support
function parseDate(dateString) {
  const lower = dateString.toLowerCase();
  const today = new Date();
  
  // Handle "next monday"
  if (lower.includes('next monday')) {
    const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  }
  
  // Handle "tomorrow"
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Handle specific dates
  if (lower.includes('december 11') || lower.includes('dec 11') || lower.includes('12/11') || lower.includes('12-11')) {
    return '2025-12-11';
  }
  
  // Handle "today"
  if (lower.includes('today')) {
    return today.toISOString().split('T')[0];
  }
  
  return null;
}

// Helper function to parse time with support for "full slots", "morning slots", etc.
function parseTime(timeString) {
  const lower = timeString.toLowerCase();
  
  // Handle "full slots" or "all day"
  if (lower.includes('full slots') || lower.includes('all day') || lower.includes('full day')) {
    return FULL_DAY_SLOTS;
  }
  
  // Handle "morning slots"
  if (lower.includes('morning slots') || lower.includes('morning')) {
    return MORNING_SLOTS;
  }
  
  // Handle "afternoon slots"
  if (lower.includes('afternoon slots') || lower.includes('afternoon')) {
    return AFTERNOON_SLOTS;
  }
  
  // Handle specific times
  if (lower.includes('10.00') || lower.includes('10:00') || lower.includes('10 am') || lower.includes('10:00am')) {
    return ['10:00 - 10:30', '10:30 - 11:00'];
  }
  
  if (lower.includes('11.30') || lower.includes('11:30') || lower.includes('11:30am')) {
    return ['11:30 - 12:00'];
  }
  
  return [];
}

// Helper function to extract purpose
function extractPurpose(message) {
  const lower = message.toLowerCase();
  if (lower.includes('training')) return 'training';
  if (lower.includes('meeting')) return 'meeting';
  if (lower.includes('seminar')) return 'seminar';
  if (lower.includes('event')) return 'event';
  if (lower.includes('inauguration')) return 'inauguration';
  if (lower.includes('gd')) return 'Group Discussion';
  if (lower.includes('lunch')) return 'Lunch Meeting';
  if (lower.includes('workshop')) return 'Workshop';
  return 'General Purpose';
}

// Helper function to get day name from date string
function getDayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

app.post('/api/ai-chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userName = req.user.name;
    
    console.log('AI Chat request from:', userName, 'Message:', message);
    
    if (!message || message.trim().length === 0) {
      return res.json({
        response: `👋 Hello ${userName}! I'm your AI booking assistant. How can I help you today?`,
        action: null
      });
    }
    
    const lowerMsg = message.toLowerCase().trim();
    
    // ===== THANKS/GREETINGS =====
    if (lowerMsg.match(/^(thanks|thank you|thankyou|thx)/)) {
      return res.json({
        response: `You're welcome, ${userName}! 😊\n\nIs there anything else I can help you with today?`,
        action: null
      });
    }
    
    // ===== VIEW BOOKINGS =====
    if (lowerMsg.includes('my bookings') || lowerMsg.includes('show my bookings') || 
        lowerMsg.includes('view bookings') || lowerMsg.includes('are you booked') ||
        (lowerMsg.includes('show') && lowerMsg.includes('booking'))) {
      const bookingsResult = await pool.query(
        `SELECT hall, booking_date, slots, purpose 
         FROM bookings 
         WHERE user_id = $1 
         AND booking_date >= CURRENT_DATE
         ORDER BY booking_date, hall 
         LIMIT 10`,
        [req.user.userId]
      );
      
      const bookings = bookingsResult.rows;
      
      if (bookings.length === 0) {
        return res.json({
          response: `📋 **Your Bookings**\n\nYou have no upcoming bookings.`,
          action: 'view_bookings',
          bookings: []
        });
      }
      
      let response = `📋 **YOUR UPCOMING BOOKINGS**\n\n`;
      
      bookings.forEach((booking, index) => {
        const bookingDate = new Date(booking.booking_date);
        const formattedDate = bookingDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        response += `${index + 1}. **${booking.hall}**\n`;
        response += `   📅 Date: ${formattedDate}\n`;
        response += `   ⏰ Time: ${booking.slots.join(', ')}\n`;
        response += `   📝 Purpose: ${booking.purpose}\n\n`;
      });
      
      response += `Total: ${bookings.length} booking(s)`;
      
      return res.json({
        response: response,
        action: 'view_bookings',
        bookings: bookings
      });
    }
    
    // ===== CHECK AVAILABILITY =====
    if (lowerMsg.includes('check availability') || lowerMsg.includes('available') || 
        lowerMsg.includes('is available') || lowerMsg.includes('availability') ||
        lowerMsg.includes('check avail')) {
      
      // Extract hall name
      let hall = '';
      for (const hallOption of HALLS) {
        if (lowerMsg.includes(hallOption.toLowerCase())) {
          hall = hallOption;
          break;
        }
      }
      
      // If no hall found, check for partial matches
      if (!hall) {
        if (lowerMsg.includes('main auditorium') || lowerMsg.includes('main hall')) {
          hall = 'Main Auditorium Hall';
        } else if (lowerMsg.includes('vedhanayagam')) {
          hall = 'Vedhanayagam Hall';
        } else if (lowerMsg.includes('ece seminar')) {
          hall = 'ECE Seminar Hall';
        } else if (lowerMsg.includes('sf seminar')) {
          hall = 'SF Seminar Hall';
        }
      }
      
      // Extract date
      let date = parseDate(lowerMsg);
      
      if (hall && date) {
        // Check availability
        const result = await pool.query(
          'SELECT slots FROM bookings WHERE hall = $1 AND booking_date = $2',
          [hall, date]
        );
        
        const bookedSlots = result.rows.flatMap(row => row.slots);
        const availableSlots = ALL_SLOTS.filter(slot => !bookedSlots.includes(slot));
        
        const checkDate = new Date(date);
        const formattedDate = checkDate.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        let response = `📅 **Availability for ${hall} on ${formattedDate}**\n\n`;
        
        if (availableSlots.length > 0) {
          response += `✅ **AVAILABLE SLOTS:**\n`;
          // Group morning and afternoon slots
          const morningAvail = availableSlots.filter(slot => MORNING_SLOTS.includes(slot));
          const afternoonAvail = availableSlots.filter(slot => AFTERNOON_SLOTS.includes(slot));
          
          if (morningAvail.length > 0) {
            response += `🌅 **Morning Slots:**\n${morningAvail.map(s => `   • ${s}`).join('\n')}\n\n`;
          }
          if (afternoonAvail.length > 0) {
            response += `🌇 **Afternoon Slots:**\n${afternoonAvail.map(s => `   • ${s}`).join('\n')}\n`;
          }
        } else {
          response += `❌ **NO SLOTS AVAILABLE** (All booked)\n`;
        }
        
        if (bookedSlots.length > 0) {
          response += `\n📋 **Already booked:** ${bookedSlots.join(', ')}`;
        }
        
        response += `\n\nWould you like to book any of these slots?`;
        
        return res.json({
          response: response,
          action: 'availability_checked',
          hall: hall,
          date: date,
          availableSlots: availableSlots,
          bookedSlots: bookedSlots
        });
      } else {
        // Not enough info for availability check
        return res.json({
          response: `📅 **To check availability, I need to know:**\n\n• Which hall? (${HALLS.join(', ')})\n• Which date? (e.g., "December 11", "tomorrow", "next Monday")\n\n**Example:** "Check availability for Main Auditorium Hall tomorrow"`,
          action: 'need_info_for_availability'
        });
      }
    }
    
    // ===== PROCESS BOOKING REQUEST =====
    if (lowerMsg.includes('book') || lowerMsg.includes('booking') || 
        lowerMsg.includes('reserve') || lowerMsg.includes('schedule')) {
      
      // Check if it's a specific booking request
      let hall = '';
      let date = null;
      let timeSlots = [];
      let purpose = '';
      
      // Extract hall
      for (const hallOption of HALLS) {
        if (lowerMsg.includes(hallOption.toLowerCase())) {
          hall = hallOption;
          break;
        }
      }
      
      // If no hall found, check for partial matches
      if (!hall) {
        if (lowerMsg.includes('main auditorium') || lowerMsg.includes('main hall')) {
          hall = 'Main Auditorium Hall';
        } else if (lowerMsg.includes('vedhanayagam')) {
          hall = 'Vedhanayagam Hall';
        } else if (lowerMsg.includes('ece seminar')) {
          hall = 'ECE Seminar Hall';
        } else if (lowerMsg.includes('sf seminar')) {
          hall = 'SF Seminar Hall';
        }
      }
      
      // Extract date
      date = parseDate(lowerMsg);
      
      // Extract time
      timeSlots = parseTime(lowerMsg);
      
      // Extract purpose
      purpose = extractPurpose(lowerMsg);
      
      console.log('Parsed booking details:', { hall, date, timeSlots: timeSlots.length, purpose });
      
      // Check if we have all required information
      if (hall && date && timeSlots.length > 0 && purpose) {
        // Check for conflicts
        const conflicts = await pool.query(
          'SELECT * FROM bookings WHERE hall = $1 AND booking_date = $2 AND slots && $3',
          [hall, date, timeSlots]
        );
        
        if (conflicts.rows.length > 0) {
          const conflictSlots = conflicts.rows.flatMap(row => row.slots);
          console.log('Booking conflict:', conflictSlots);
          
          // Find available slots from the requested ones
          const availableRequestedSlots = timeSlots.filter(slot => !conflictSlots.includes(slot));
          
          let response = `❌ **BOOKING CONFLICT!**\n\nSome of your requested slots are already booked for ${hall}.\n\n`;
          response += `📋 **Already booked:** ${conflictSlots.join(', ')}\n\n`;
          
          if (availableRequestedSlots.length > 0) {
            response += `✅ **Still available from your request:** ${availableRequestedSlots.join(', ')}\n\n`;
            response += `Would you like to book only the available slots?`;
          } else {
            response += `All requested slots are booked. Please choose different slots or time.`;
          }
          
          return res.json({
            response: response,
            action: 'conflict',
            conflictSlots: conflictSlots,
            availableSlots: availableRequestedSlots
          });
        }
        
        // Create booking
        try {
          const result = await pool.query(
            'INSERT INTO bookings (user_id, hall, booking_date, slots, purpose) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.userId, hall, date, timeSlots, purpose]
          );
          
          const booking = result.rows[0];
          console.log('Booking created:', booking);
          
          const bookingDate = new Date(booking.booking_date);
          const formattedDate = bookingDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          // Format slots display based on what was booked
          let slotsDisplay = '';
          if (timeSlots.length === FULL_DAY_SLOTS.length) {
            slotsDisplay = 'Full day (all slots)';
          } else if (timeSlots.length === MORNING_SLOTS.length && timeSlots.every(slot => MORNING_SLOTS.includes(slot))) {
            slotsDisplay = 'All morning slots';
          } else if (timeSlots.length === AFTERNOON_SLOTS.length && timeSlots.every(slot => AFTERNOON_SLOTS.includes(slot))) {
            slotsDisplay = 'All afternoon slots';
          } else {
            slotsDisplay = booking.slots.join(', ');
          }
          
          let response = `✅ **BOOKING CONFIRMED!** 🎉\n\n`;
          response += `🏛️ **Hall:** ${booking.hall}\n`;
          response += `📅 **Date:** ${formattedDate}\n`;
          response += `⏰ **Time:** ${slotsDisplay}\n`;
          response += `📝 **Purpose:** ${booking.purpose}\n\n`;
          response += `Your booking has been successfully created!`;
          
          return res.json({
            response: response,
            action: 'booked',
            booking: booking
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          return res.json({
            response: `❌ **ERROR CREATING BOOKING**\n\nThere was an error processing your booking. Please try again or use the manual booking system.`,
            action: 'error'
          });
        }
      } else {
        // Not enough information, ask for clarification
        let response = `📝 **I need more information to book a hall:**\n\n`;
        
        if (!hall) {
          response += `• Which hall? Available halls:\n${HALLS.map(h => `   - ${h}`).join('\n')}\n`;
        }
        if (!date) response += `• What date? (e.g., "December 11, 2025", "tomorrow", "next Monday")\n`;
        if (timeSlots.length === 0) {
          response += `• What time? You can specify:\n`;
          response += `   - Specific time: "10:00 AM"\n`;
          response += `   - Time range: "10:00 AM to 11:30 AM"\n`;
          response += `   - Slot group: "morning slots", "afternoon slots"\n`;
          response += `   - Full day: "full slots" or "all day"\n`;
        }
        if (!purpose) response += `• What is the purpose? (e.g., "training", "meeting", "GD", "lunch")\n`;
        
        response += `\n**Examples:**\n`;
        response += `• "Book Main Auditorium Hall tomorrow at 10:00 AM for training"\n`;
        response += `• "Book SF Seminar Hall on next Monday at morning slots for GD"\n`;
        response += `• "Book ECE Seminar Hall on December 11 at full slots for workshop"`;
        
        return res.json({
          response: response,
          action: 'need_more_info',
          missingInfo: { hall: !hall, date: !date, time: timeSlots.length === 0, purpose: !purpose }
        });
      }
    }
    
    // ===== GREETINGS =====
    if (lowerMsg.match(/^(hi|hello|hey|greetings)/)) {
      return res.json({
        response: `👋 **Hello ${userName}!** I'm your AI booking assistant.\n\nI can help you:\n• Book halls 🏛️\n• Check availability 📅\n• View your bookings 📋\n\nWhat would you like to do?`,
        action: null
      });
    }
    
    // ===== WHAT CAN YOU DO =====
    if (lowerMsg.includes('what can you do') || lowerMsg.includes('help') || lowerMsg.includes('what help')) {
      return res.json({
        response: `🤖 **I can help you with:**\n\n• **Book a hall** - "Book Main Auditorium tomorrow at 10 AM for training"\n• **Check availability** - "Is Conference Room available on Friday?"\n• **View bookings** - "Show my bookings"\n• **Cancel booking** - Use the "My Bookings" page\n\nWhat would you like to do?`,
        action: null
      });
    }
    
    // ===== DEFAULT RESPONSE =====
    return res.json({
      response: `👋 **Hello ${userName}!** I'm your AI booking assistant.\n\nTry one of these:\n\n• "Book SF Seminar Hall on next Monday at 10:00 AM for GD"\n• "Check availability for Main Auditorium Hall tomorrow"\n• "Show my bookings"\n\nHow can I help you today?`,
      action: null
    });
    
  } catch (error) {
    console.error('AI Chat error:', error);
    return res.json({
      response: `❌ Sorry, I encountered an error. Please try again or use the manual booking system.\n\nYou can try:\n• "Book Main Auditorium Hall"\n• "Show my bookings"\n• "Check availability"`,
      action: 'error',
      error: true
    });
  }
});

// ==================== FEEDBACK ROUTES ====================

app.get('/feedback', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM feedback ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

app.post('/feedback/submit', authenticateToken, async (req, res) => {
  try {
    const { feedback } = req.body;
    
    const result = await pool.query(
      'INSERT INTO feedback (user_id, name, feedback) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, req.user.name, feedback]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hall Booking API is running', status: 'healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});