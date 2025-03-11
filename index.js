const express = require('express');
const cors = require('cors');
const seedrandom = require('seedrandom');
const jwt = require('jsonwebtoken');
const { generateHotelData, generateGuest } = require('./hotelDataGenerator');

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

// Cache for hotel data
let currentData = null;
let lastGeneratedHour = null;

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

function createResponse(success, data = null, error = null) {
  return { success, data, error };
}

const verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];
  if (!token) return res.status(403).json(createResponse(false, null, 'No token provided'));
  if (token.startsWith('Bearer ')) token = token.slice(7);
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json(createResponse(false, null, 'Failed to authenticate token'));
    req.user = decoded;
    next();
  });
};

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

// Current Month Data Endpoints
app.get('/booking-arrivals', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.booking_arrivals));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/member-vs-general', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.member_vs_general_arrivals));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/today-status', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.today_arrivals_departures));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/occupancy-and-adr', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.occupancy_and_adr));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/guest-birthdays', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.guest_birthdays));
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

    const todayBirthdays = data.current.guest_birthdays.filter(guest => {
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
    res.json(createResponse(true, data.current.age_group_segmentation));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/canceled-bookings', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.canceled_bookings));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/frequent-units', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.most_frequent_units));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/total-income', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.total_income));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/bookings', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.bookings || []));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

// Historical Data Endpoint
app.get('/historical-data', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.historical));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

// Year-over-year comparison endpoint
app.get('/yoy-comparison', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.yoy_comparison));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

// Summary Endpoint
app.get('/stats/summary', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    const summary = {
      total_current_guests: Object.values(data.current.age_group_segmentation).reduce((sum, val) => sum + val, 0),
      occupancy_rate: data.current.occupancy_and_adr.occupancy_rate,
      monthly_income: data.current.total_income.total_income_month,
      today_movement: data.current.today_arrivals_departures,
    };
    res.json(createResponse(true, summary));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

// Most Booked Unit Endpoint
app.get('/units/most-booked', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    const mostBooked = data.current.most_frequent_units.reduce(
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;

app.get('/today-status', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.today_arrivals_departures));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/occupancy-and-adr', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.occupancy_and_adr));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/guest-birthdays', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.guest_birthdays));
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

    const todayBirthdays = data.current.guest_birthdays.filter(guest => {
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
    res.json(createResponse(true, data.current.age_group_segmentation));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/canceled-bookings', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.canceled_bookings));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/frequent-units', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.most_frequent_units));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

app.get('/total-income', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.current.total_income));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

// Historical Data Endpoint
app.get('/historical-data', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    res.json(createResponse(true, data.historical));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

// Summary Endpoint
app.get('/stats/summary', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    const summary = {
      total_current_guests: Object.values(data.current.age_group_segmentation).reduce((sum, val) => sum + val, 0),
      occupancy_rate: data.current.occupancy_and_adr.occupancy_rate,
      monthly_income: data.current.total_income.total_income_month,
      today_movement: data.current.today_arrivals_departures,
    };
    res.json(createResponse(true, summary));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
});

// Most Booked Unit Endpoint
app.get('/units/most-booked', verifyToken, (req, res) => {
  try {
    const data = getHotelData();
    const mostBooked = data.current.most_frequent_units.reduce(
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