const express = require('express');
const cors = require('cors');
const seedrandom = require('seedrandom');
const jwt = require('jsonwebtoken');
const { generateHotelData } = require('./hotelDataGenerator');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'your-secret-key';

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

// Cache and data tracking
let currentData = null;
let lastGeneratedHour = null;

function getHotelData() {
  const now = new Date();
  const currentHour = Math.floor(now.getTime() / 3600000); // Hourly interval
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

async function waitForChange(lastKnownHour, timeout = 25000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      if (lastGeneratedHour !== lastKnownHour) {
        resolve(true);
      } else if (Date.now() - startTime >= timeout) {
        resolve(false);
      } else {
        setTimeout(check, 1000);
      }
    };
    
    check();
  });
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

// Helper function for all endpoints
async function handleLongPolling(endpointDataFn, req, res) {
  try {
    const lastKnownHour = parseInt(req.query.lastCheck) || 0;
    const data = getHotelData();

    if (lastGeneratedHour !== lastKnownHour) {
      return res.json(createResponse(true, {
        data: endpointDataFn(data),
        currentHour: lastGeneratedHour
      }));
    }

    const changed = await waitForChange(lastKnownHour);
    const newData = getHotelData();

    res.json(createResponse(true, {
      data: endpointDataFn(newData),
      currentHour: lastGeneratedHour
    }));
  } catch (error) {
    res.status(500).json(createResponse(false, null, error.message));
  }
}

// Endpoints
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
app.get('/booking-arrivals', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.booking_arrivals, req, res);
});

app.get('/member-vs-general', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.member_vs_general_arrivals, req, res);
});

app.get('/today-status', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.today_arrivals_departures, req, res);
});

app.get('/occupancy-and-adr', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.occupancy_and_adr, req, res);
});

app.get('/guest-birthdays', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.guest_birthdays, req, res);
});

app.get('/guest-birthdays/today', verifyToken, async (req, res) => {
  await handleLongPolling((data) => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    return data.current.guest_birthdays.filter(guest => {
      const birthday = new Date(guest.birthday);
      return birthday.getMonth() + 1 === todayMonth && birthday.getDate() === todayDay;
    });
  }, req, res);
});

app.get('/age-groups', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.age_group_segmentation, req, res);
});

app.get('/canceled-bookings', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.canceled_bookings, req, res);
});

app.get('/frequent-units', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.most_frequent_units, req, res);
});

app.get('/total-income', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.total_income, req, res);
});

app.get('/bookings', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.current.bookings || [], req, res);
});

// Historical Data Endpoints
app.get('/historical-data', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.historical, req, res);
});

app.get('/yoy-comparison', verifyToken, async (req, res) => {
  await handleLongPolling((data) => data.yoy_comparison, req, res);
});

// Summary Endpoint
app.get('/stats/summary', verifyToken, async (req, res) => {
  await handleLongPolling((data) => ({
    total_current_guests: Object.values(data.current.age_group_segmentation).reduce((sum, val) => sum + val, 0),
    occupancy_rate: data.current.occupancy_and_adr.occupancy_rate,
    monthly_income: data.current.total_income.total_income_month,
    today_movement: data.current.today_arrivals_departures,
  }), req, res);
});

// Most Booked Unit Endpoint
app.get('/units/most-booked', verifyToken, async (req, res) => {
  await handleLongPolling((data) => {
    const mostBooked = data.current.most_frequent_units.reduce(
      (max, unit) => unit.booking_count > max.booking_count ? unit : max,
      { booking_count: 0 }
    );
    return {
      unit_id: mostBooked.unit_id,
      booking_count: mostBooked.booking_count
    };
  }, req, res);
});

// Vercel deployment handler
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;