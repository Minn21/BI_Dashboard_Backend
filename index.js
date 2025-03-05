const express = require('express');
const cors = require('cors');
const seedrandom = require('seedrandom');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
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

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, { cors: corsOptions });

// Utility functions from hotelDataGenerator.js (included here for completeness)
const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy','Kyar Zan'];

function randomInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFloat(min, max, rng) {
  return rng() * (max - min) + min;
}

// Function to generate a random birthday, with a chance of being today
function generateRandomBirthday(rng) {
  const today = new Date();
  const isToday = rng() < 0.05; // 5% chance of birthday being today
  if (isToday) {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  } else {
    const month = randomInt(1, 12, rng);
    const day = randomInt(1, 28, rng);
    return `2000-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}

// Function to generate a new guest
function generateNewGuest(rng) {
  const name = names[randomInt(0, names.length - 1, rng)];
  const age_group = ['child', 'adult', 'middle_age', 'elder'][randomInt(0, 3, rng)];
  const birthday = generateRandomBirthday(rng);
  return { name, age_group, birthday };
}

// Function to generate initial state
function generateInitialState(rng) {
  const totalRooms = 80;
  const occupancyRate = randomInt(50, 90, rng) / 100;
  const numGuests = Math.floor(totalRooms * occupancyRate);
  const currentGuests = [];

  for (let i = 0; i < numGuests; i++) {
    currentGuests.push(generateNewGuest(rng));
  }

  return {
    currentGuests,
    totalRooms,
    todayArrivals: 0,
    todayDepartures: 0,
  };
}

// Function to calculate updated data from state
function getUpdatedData(state) {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const age_group_segmentation = {
    child: 0,
    adult: 0,
    middle_age: 0,
    elder: 0
  };

  const guest_birthdays_today = [];

  state.currentGuests.forEach(guest => {
    age_group_segmentation[guest.age_group]++;
    const birthday = new Date(guest.birthday);
    if (birthday.getMonth() + 1 === todayMonth && birthday.getDate() === todayDay) {
      guest_birthdays_today.push(guest);
    }
  });

  const occupancy_rate = (state.currentGuests.length / state.totalRooms) * 100;

  return {
    occupancy_rate: occupancy_rate.toFixed(2),
    age_group_segmentation,
    guest_birthdays_today,
    today_arrivals: state.todayArrivals,
    today_departures: state.todayDepartures,
  };
}

// Initialize persistent state
let state;
const initialRng = seedrandom('initial_seed');
state = generateInitialState(initialRng);

// Simulate real-time events
setInterval(() => {
  const rng = seedrandom(Math.random().toString());
  if (rng() < 0.1) { // 10% chance of check-in
    const newGuest = generateNewGuest(rng);
    state.currentGuests.push(newGuest);
    state.todayArrivals++;
    io.emit('dataUpdated', getUpdatedData(state));
  }
  if (rng() < 0.1 && state.currentGuests.length > 0) { // 10% chance of check-out
    const index = randomInt(0, state.currentGuests.length - 1, rng);
    state.currentGuests.splice(index, 1);
    state.todayDepartures++;
    io.emit('dataUpdated', getUpdatedData(state));
  }
}, 1000); // Check every second

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('New client connected');
  const initialData = getUpdatedData(state);
  socket.emit('initialData', initialData);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Existing REST API setup (abridged for brevity)
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