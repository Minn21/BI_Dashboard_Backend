const express = require('express');
const cors = require('cors');
const seedrandom = require('seedrandom');

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

// Helper functions for random number generation
function randomInt(min, max, rng) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFloat(min, max, rng) {
    return rng() * (max - min) + min;
}

// Cache variables to store generated data and the last generation hour
let currentData = null;
let lastGeneratedHour = null;

// Function to get or generate hotel data
function getHotelData() {
    const now = new Date();
    // Convert current time to hours since epoch (in milliseconds, 3600000 ms = 1 hour)
    const currentHour = Math.floor(now.getTime() / 3600000);

    // Regenerate data only if the hour has changed
    if (currentHour !== lastGeneratedHour) {
        const seed = currentHour.toString();
        const rng = seedrandom(seed); // Seed RNG with the current hour
        currentData = generateHotelData(rng);
        lastGeneratedHour = currentHour;
    }

    return currentData;
}

// Function to generate random hotel data in the same structure as the JSON
function generateHotelData(rng) {
    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];

    // booking_arrivals
    const current_year_arrivals = randomInt(500, 2000, rng);
    const current_month_arrivals = randomInt(50, 200, rng);
    const percentage_current_month = ((current_month_arrivals / current_year_arrivals) * 100);

    // member_vs_general_arrivals
    const member_arrivals = randomInt(0, current_month_arrivals, rng);
    const general_arrivals = current_month_arrivals - member_arrivals;

    // today_arrivals_departures
    const today_arrivals = randomInt(0, 20, rng);
    const today_departures = randomInt(0, 20, rng);

    // occupancy_and_adr
    const occupancy_rate = randomInt(50, 90, rng);
    const adr = randomInt(50, 200, rng);

    // guest_birthdays
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate();
    const guest_birthdays = [];
    const numGuests = randomInt(5, 15, rng);
    for (let i = 0; i < numGuests; i++) {
        const name = names[randomInt(0, names.length - 1, rng)];
        const isToday = rng() < 0.2; // 20% chance of birthday being today
        let month, day;
        if (isToday) {
            month = todayMonth;
            day = todayDay;
        } else {
            month = randomInt(1, 12, rng);
            day = randomInt(1, 28, rng); // Up to 28 to avoid month-end issues
        }
        const year = 2000; // Fixed year, only month/day matter for filtering
        const birthday = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        guest_birthdays.push({ name, birthday });
    }

    // age_group_segmentation
    const age_group_segmentation = {
        child: randomInt(10, 50, rng),
        adult: randomInt(20, 100, rng),
        middle_age: randomInt(20, 100, rng),
        elder: randomInt(5, 30, rng)
    };

    // canceled_bookings
    const canceled_bookings_count = randomInt(10, 50, rng);
    const canceled_percentage = ((canceled_bookings_count / (canceled_bookings_count + current_month_arrivals)) * 100);

    // most_frequent_units
    const most_frequent_units = [];
    for (let i = 1; i <= 5; i++) {
        const unit_id = `U00${i}`;
        const booking_count = randomInt(10, 150, rng);
        most_frequent_units.push({ unit_id, booking_count });
    }

    // total_income
    const total_income_month = randomInt(10000, 50000, rng);
    const total_income_year = randomInt(parseFloat(total_income_month), parseFloat(total_income_month) * 12, rng);

    return {
        booking_arrivals: {
            current_month_arrivals,
            current_year_arrivals,
            percentage_current_month
        },
        member_vs_general_arrivals: {
            member_arrivals,
            general_arrivals
        },
        today_arrivals_departures: {
            today_arrivals,
            today_departures
        },
        occupancy_and_adr: {
            occupancy_rate,
            adr
        },
        guest_birthdays,
        age_group_segmentation,
        canceled_bookings: {
            canceled_bookings: canceled_bookings_count,
            canceled_percentage
        },
        most_frequent_units,
        total_income: {
            total_income_month,
            total_income_year
        }
    };
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