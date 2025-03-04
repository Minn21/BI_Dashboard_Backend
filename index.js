// index.js
const express = require('express');
const cors = require('cors');
const seedrandom = require('seedrandom');
const { generateHotelData } = require('./hotelDataGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

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
    // Convert current time to hours since epoch (in milliseconds, 3600000 ms = 1 hour)
    const currentHour = Math.floor(now.getTime() / 36000);

    // Regenerate data only if the hour has changed
    if (currentHour !== lastGeneratedHour) {
        const seed = currentHour.toString();
        const rng = seedrandom(seed); // Seed RNG with the current hour
        currentData = generateHotelData(rng);
        lastGeneratedHour = currentHour;
    }

    return currentData;
}

// Helper function for API responses
function createResponse(success, data = null, error = null) {
    return {
        success,
        data,
        error
    };
}

// Routes
app.get('/', (req, res) => {
    res.json(createResponse(true, { message: 'Welcome to Hotel Management API' }));
});

app.get('/booking-arrivals', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.booking_arrivals));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/member-vs-general', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.member_vs_general_arrivals));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/today-status', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.today_arrivals_departures));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/occupancy-and-adr', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.occupancy_and_adr));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/guest-birthdays', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.guest_birthdays));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/guest-birthdays/today', (req, res) => {
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

app.get('/age-groups', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.age_group_segmentation));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/canceled-bookings', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.canceled_bookings));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/frequent-units', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.most_frequent_units));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/total-income', (req, res) => {
    try {
        const data = getHotelData();
        res.json(createResponse(true, data.total_income));
    } catch (error) {
        res.status(500).json(createResponse(false, null, error.message));
    }
});

app.get('/stats/summary', (req, res) => {
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

app.get('/units/most-booked', (req, res) => {
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

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;