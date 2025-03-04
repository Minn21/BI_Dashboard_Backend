const express = require('express');
const cors = require('cors');
const seedrandom = require('seedrandom');
const jwt = require('jsonwebtoken');
const { generateHotelData } = require('./hotelDataGenerator');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'your-secret-key'; // Replace with a strong, unique secret key

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost',
    'http://localhost:8000',
    'https://bi-dashboard-demo.vercel.app',
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Cache variables to store generated data and the last generation hour
let currentData = null;
let lastGeneratedHour = null;

// Function to get or generate hotel data
function getHotelData() {
  const now = new Date();
  const currentHour = Math.floor(now.getTime() / 36000);

  if (currentHour !== lastGeneratedHour) {
    const seed = currentHour.toString();
    const rng = seedrandom(seed);
    currentData = generateHotelData(rng);
    lastGeneratedHour = currentHour;
  }

  return currentData;
}

// Helper function for API responses
function createResponse(success, data = null, error = null) {
  return { success, data, error };
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json(createResponse(false, null, 'No token provided'));
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json(createResponse(false, null, 'Failed to authenticate token'));
    }
    req.user = decoded;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.json(createResponse(true, { message: 'Welcome to Hotel Management API' }));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json(createResponse(true, { token }));
  } else {
    res.status(401).json(createResponse(false, null, 'Invalid credentials'));
  }
});

app.get('/booking-arrivals', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.booking_arrivals));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/member-vs-general', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.member_vs_general_arrivals));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/today-status', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.today_arrivals_departures));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/occupancy-and-adr', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.occupancy_and_adr));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/guest-birthdays', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.guest_birthdays));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/guest-birthdays/today', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
  
      const todayBirthdays = data.guest_birthdays.filter(guest => {
        const birthday = new Date(guest.birthday);
        return birthday.getMonth() + 1 === todayMonth && birthday.getDate() === todayDay;
      });
  
      res.json(createResponse(true, todayBirthdays));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/age-groups', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.age_group_segmentation));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/canceled-bookings', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.canceled_bookings));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/frequent-units', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.most_frequent_units));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/total-income', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      res.json(createResponse(true, data.total_income));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/stats/summary', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      const summary = {
        total_current_guests: Object.values(data.age_group_segmentation).reduce((sum, val) => sum + val, 0),
        occupancy_rate: data.occupancy_and_adr.occupancy_rate,
        monthly_income: data.total_income.total_income_month,
        today_movement: data.today_arrivals_departures,
      };
      res.json(createResponse(true, summary));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });
  
  app.get('/units/most-booked', verifyToken, (req, res) => {
    try {
      const data = getHotelData();
      const mostBooked = data.most_frequent_units.reduce(
        (max, unit) => unit.booking_count > max.booking_count ? unit : max,
        { booking_count: 0 }
      );
  
      res.json(createResponse(true, {
        unit_id: mostBooked.unit_id,
        booking_count: mostBooked.booking_count
      }));
    } catch (error) {
      res.status(500).json(createResponse(false, null, error.message));
    }
  });

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;