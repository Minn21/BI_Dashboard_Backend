// hotelDataGenerator.js
const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];

function randomInt(min, max, rng) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

function generateHotelData(rng) {
    // booking_arrivals
    const current_year_arrivals = randomInt(500, 800, rng);
    const current_month_arrivals = randomInt(50, 120, rng);
    const percentage_current_month = (current_month_arrivals / current_year_arrivals) * 100;

    // member_vs_general_arrivals
    const member_arrivals = randomInt(0, current_month_arrivals, rng);
    const general_arrivals = current_month_arrivals - member_arrivals;

    // today_arrivals_departures
    const today_arrivals = randomInt(0, 17, rng);
    const today_departures = randomInt(0, 20, rng);

    // occupancy_and_adr
    const occupancy_rate = randomInt(50, 85, rng);
    const adr = randomInt(50, 200, rng);

    // guest_birthdays
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-12
    const todayDay = today.getDate();
    const guest_birthdays = [];
    const numGuests = randomInt(5, 8, rng);
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
    const canceled_bookings_count = randomInt(10, 30, rng);
    const canceled_percentage = (canceled_bookings_count / (canceled_bookings_count + current_month_arrivals)) * 100;

    // most_frequent_units
    const most_frequent_units = [];
    for (let i = 1; i <= 5; i++) {
        const unit_id = `U00${i}`;
        const booking_count = randomInt(10, 130, rng);
        most_frequent_units.push({ unit_id, booking_count });
    }

    // total_income
    const total_income_month = randomInt(10000, 50000, rng);
    const total_income_year = randomInt(total_income_month, total_income_month * 12, rng); // Fixed: removed unnecessary parseFloat

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

module.exports = { generateHotelData };