// hotelDataGenerator.js
const seedrandom = require('seedrandom');

// Expanded data for more realistic generation
const names = [
  'Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
  'Kevin', 'Liam', 'Maria', 'Nina', 'Oscar', 'Pam', 'Quinn', 'Robert', 'Sara', 'Tom',
  'Ursula', 'Victor', 'Wendy', 'Xander', 'Yasmine', 'Zach'
];

const countries = [
  'USA', 'UK', 'Canada', 'Germany', 'France', 'Japan', 'Australia', 'Brazil', 
  'Italy', 'Spain', 'China', 'India', 'Mexico', 'South Korea', 'Singapore'
];

const roomTypes = [
  { type: 'Standard', basePrice: 100 },
  { type: 'Deluxe', basePrice: 150 },
  { type: 'Suite', basePrice: 250 },
  { type: 'Executive', basePrice: 200 },
  { type: 'Family', basePrice: 180 },
  { type: 'Villa', basePrice: 350 }
];

const amenities = [
  'WiFi', 'Breakfast', 'Pool', 'Spa', 'Gym', 'Room Service', 
  'Airport Shuttle', 'Minibar', 'Ocean View', 'Balcony'
];

const paymentMethods = [
  'Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash'
];

function randomInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFloat(min, max, rng, decimals = 2) {
  const value = rng() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function randomElement(array, rng) {
  return array[randomInt(0, array.length - 1, rng)];
}

function randomDate(start, end, rng) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + (rng() * (endTime - startTime));
  return new Date(randomTime);
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function generateGuest(rng, includeDetails = false) {
  const firstName = randomElement(names, rng);
  const lastName = randomElement(names, rng);
  const name = `${firstName} ${lastName}`;
  
  // Age group determination
  const age = randomInt(1, 90, rng);
  let age_group;
  if (age < 18) age_group = 'child';
  else if (age < 35) age_group = 'adult';
  else if (age < 65) age_group = 'middle_age';
  else age_group = 'elder';
  
  // Basic birthday
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const month = randomInt(1, 12, rng);
  const day = randomInt(1, 28, rng);
  const birthday = `${birthYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  // Basic guest information
  const guest = { name, age_group, birthday };
  
  // Add detailed information if requested
  if (includeDetails) {
    const country = randomElement(countries, rng);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const phone = `+${randomInt(1, 99, rng)}-${randomInt(100, 999, rng)}-${randomInt(100, 999, rng)}-${randomInt(1000, 9999, rng)}`;
    const loyalty_member = rng() < 0.4; // 40% chance of being a loyalty member
    const loyalty_level = loyalty_member ? ['Bronze', 'Silver', 'Gold', 'Platinum'][randomInt(0, 3, rng)] : null;
    const vip = rng() < 0.1; // 10% chance of being a VIP
    const special_requests = rng() < 0.3 ? ['Late check-in', 'Extra pillows', 'High floor', 'Quiet room'][randomInt(0, 3, rng)] : null;
    
    Object.assign(guest, {
      country, email, phone, loyalty_member, loyalty_level, vip, special_requests
    });
  }
  
  return guest;
}

function generateBooking(month, year, rng, guestId) {
  const startDate = new Date(year, month - 1, randomInt(1, 28, rng));
  const stayLength = randomInt(1, 14, rng);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + stayLength);
  
  const roomType = randomElement(roomTypes, rng);
  const basePrice = roomType.basePrice;
  const seasonMultiplier = 1 + randomFloat(-0.2, 0.5, rng); // Season affects price
  const roomNumber = `${randomInt(1, 9, rng)}${randomInt(0, 9, rng)}${randomInt(0, 9, rng)}`;
  
  // Selected amenities
  const selectedAmenities = [];
  amenities.forEach(amenity => {
    if (rng() > 0.6) { // 40% chance of selecting each amenity
      selectedAmenities.push(amenity);
    }
  });
  
  // Calculate total price
  const nightlyRate = basePrice * seasonMultiplier;
  const totalPrice = nightlyRate * stayLength;
  
  // Booking source
  const sources = ['Direct', 'Booking.com', 'Expedia', 'TripAdvisor', 'Travel Agent', 'Corporate'];
  const bookingSource = randomElement(sources, rng);
  
  // Payment information
  const paymentMethod = randomElement(paymentMethods, rng);
  const depositPaid = rng() < 0.8; // 80% chance of deposit being paid
  
  return {
    booking_id: `BK-${year}${month}${guestId}`,
    guest_id: guestId,
    check_in_date: formatDate(startDate),
    check_out_date: formatDate(endDate),
    room_type: roomType.type,
    room_number: roomNumber,
    nights: stayLength,
    adults: randomInt(1, 4, rng),
    children: randomInt(0, 3, rng),
    nightly_rate: parseFloat(nightlyRate.toFixed(2)),
    total_price: parseFloat(totalPrice.toFixed(2)),
    booking_source: bookingSource,
    amenities: selectedAmenities,
    payment_method: paymentMethod,
    deposit_paid: depositPaid,
    booking_date: formatDate(new Date(startDate.getTime() - randomInt(1, 90, rng) * 24 * 60 * 60 * 1000)),
    status: rng() < 0.1 ? 'Canceled' : 'Confirmed' // 10% chance of cancellation
  };
}

function generateDailyRevenue(month, year, rng) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyRevenue = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    // Base revenue varies by day of week to simulate weekends having higher revenue
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const baseRevenue = isWeekend ? randomInt(8000, 15000, rng) : randomInt(5000, 10000, rng);
    
    // Seasonal variations
    const seasonalFactor = 1 + randomFloat(-0.2, 0.3, rng);
    
    // Categories of revenue
    const roomRevenue = baseRevenue * seasonalFactor * 0.7; // 70% from rooms
    const foodRevenue = baseRevenue * seasonalFactor * 0.15; // 15% from food
    const beverageRevenue = baseRevenue * seasonalFactor * 0.1; // 10% from beverages
    const otherRevenue = baseRevenue * seasonalFactor * 0.05; // 5% from other services
    
    dailyRevenue.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      total: parseFloat((roomRevenue + foodRevenue + beverageRevenue + otherRevenue).toFixed(2)),
      breakdown: {
        room: parseFloat(roomRevenue.toFixed(2)),
        food: parseFloat(foodRevenue.toFixed(2)),
        beverage: parseFloat(beverageRevenue.toFixed(2)),
        other: parseFloat(otherRevenue.toFixed(2))
      }
    });
  }
  
  return dailyRevenue;
}

function generateMonthlyData(targetMonth, targetYear, rng) {
  // Generate a more comprehensive set of booking arrivals data
  const current_year_arrivals = randomInt(500, 800, rng);
  const current_month_arrivals = randomInt(50, 120, rng);
  const percentage_current_month = parseFloat(((current_month_arrivals / current_year_arrivals) * 100).toFixed(2));
  
  // Generate daily arrivals for the month
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const daily_arrivals = [];
  let totalArrivals = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(targetYear, targetMonth - 1, day);
    const isWeekend = [0, 6].includes(date.getDay()); // Weekend check
    const arrivals = randomInt(isWeekend ? 3 : 1, isWeekend ? 10 : 7, rng);
    totalArrivals += arrivals;
    
    daily_arrivals.push({
      date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      arrivals
    });
  }
  
  // Adjust to match the expected monthly total
  const scaleFactor = current_month_arrivals / totalArrivals;
  daily_arrivals.forEach(day => {
    day.arrivals = Math.round(day.arrivals * scaleFactor);
  });
  
  // Enhanced member vs general arrivals
  const member_arrivals = randomInt(Math.floor(current_month_arrivals * 0.3), Math.floor(current_month_arrivals * 0.6), rng);
  const general_arrivals = current_month_arrivals - member_arrivals;
  
  // Detailed loyalty breakdown
  const bronze_members = randomInt(Math.floor(member_arrivals * 0.4), Math.floor(member_arrivals * 0.6), rng);
  const silver_members = randomInt(Math.floor(member_arrivals * 0.2), Math.floor(member_arrivals * 0.3), rng);
  const gold_members = randomInt(Math.floor(member_arrivals * 0.1), Math.floor(member_arrivals * 0.2), rng);
  const platinum_members = member_arrivals - bronze_members - silver_members - gold_members;
  
  // Today's arrivals and departures
  const today_arrivals = randomInt(0, 17, rng);
  const today_departures = randomInt(0, 20, rng);
  
  // Expanded arrivals and departures with hourly breakdown
  const arrival_hours = {};
  let remainingArrivals = today_arrivals;
  
  // Simulate a realistic check-in pattern (more arrivals in afternoon)
  for (let hour = 8; hour <= 22; hour++) {
    let hourWeight;
    if (hour < 12) hourWeight = 0.05; // Morning: low arrivals
    else if (hour < 15) hourWeight = 0.15; // Early afternoon: moderate arrivals
    else if (hour < 19) hourWeight = 0.2; // Late afternoon/early evening: peak arrivals
    else hourWeight = 0.1; // Evening: moderate arrivals
    
    const hourArrivals = Math.min(Math.round(today_arrivals * hourWeight), remainingArrivals);
    remainingArrivals -= hourArrivals;
    
    if (hourArrivals > 0 || hour >= 12) { // Only show hours with arrivals or after noon
      arrival_hours[`${hour}:00`] = hourArrivals;
    }
  }
  
  // Add any remaining arrivals to the busiest hour
  if (remainingArrivals > 0) {
    arrival_hours['15:00'] = (arrival_hours['15:00'] || 0) + remainingArrivals;
  }
  
  // Similar pattern for departures (most in late morning)
  const departure_hours = {};
  let remainingDepartures = today_departures;
  
  for (let hour = 7; hour <= 14; hour++) {
    let hourWeight;
    if (hour < 9) hourWeight = 0.05; // Early morning: few departures
    else if (hour < 11) hourWeight = 0.25; // Mid-morning: peak departures
    else if (hour < 12) hourWeight = 0.2; // Late morning: high departures
    else hourWeight = 0.1; // Afternoon: fewer departures
    
    const hourDepartures = Math.min(Math.round(today_departures * hourWeight), remainingDepartures);
    remainingDepartures -= hourDepartures;
    
    if (hourDepartures > 0) {
      departure_hours[`${hour}:00`] = hourDepartures;
    }
  }
  
  // Add remaining departures to noon
  if (remainingDepartures > 0) {
    departure_hours['12:00'] = (departure_hours['12:00'] || 0) + remainingDepartures;
  }
  
  // Enhanced occupancy and ADR data
  const occupancy_rate = randomInt(50, 85, rng);
  const adr = randomInt(120, 250, rng);
  
  // Add daily occupancy for the month
  const daily_occupancy = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(targetYear, targetMonth - 1, day);
    const isWeekend = [0, 6].includes(date.getDay());
    
    // Weekends tend to have higher occupancy
    const dayOccupancy = occupancy_rate + randomInt(isWeekend ? 0 : -10, isWeekend ? 15 : 5, rng);
    const finalOccupancy = Math.min(100, Math.max(30, dayOccupancy));
    
    // ADR also tends to be higher on weekends
    const dayAdr = adr + randomInt(isWeekend ? 0 : -20, isWeekend ? 30 : 10, rng);
    
    daily_occupancy.push({
      date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      occupancy: finalOccupancy,
      adr: dayAdr
    });
  }
  
  // Enhanced guest birthday data
  const guest_birthdays = [];
  const numGuests = randomInt(20, 30, rng);
  
  for (let i = 0; i < numGuests; i++) {
    const guest = generateGuest(rng, true);
    guest_birthdays.push(guest);
  }
  
  // Enhanced age group segmentation with more detail
  const age_group_segmentation = {
    child: randomInt(10, 50, rng),
    adult: randomInt(20, 100, rng),
    middle_age: randomInt(20, 100, rng),
    elder: randomInt(5, 30, rng)
  };
  
  // Detailed breakdown of children by age
  const child_age_groups = {
    'under_5': randomInt(0, Math.floor(age_group_segmentation.child * 0.3), rng),
    '5_to_12': randomInt(0, Math.floor(age_group_segmentation.child * 0.4), rng)
  };
  child_age_groups['13_to_17'] = age_group_segmentation.child - child_age_groups.under_5 - child_age_groups['5_to_12'];
  
  // Enhanced canceled bookings with reasons
  const canceled_bookings_count = randomInt(10, 30, rng);
  const canceled_percentage = parseFloat(((canceled_bookings_count / (canceled_bookings_count + current_month_arrivals)) * 100).toFixed(2));
  
  const cancellation_reasons = [
    { reason: 'Change of plans', count: randomInt(1, Math.floor(canceled_bookings_count * 0.4), rng) },
    { reason: 'Found better deal', count: randomInt(1, Math.floor(canceled_bookings_count * 0.2), rng) },
    { reason: 'Emergency', count: randomInt(1, Math.floor(canceled_bookings_count * 0.3), rng) }
  ];
  
  // Calculate the remaining cancellations and assign to "Other" category
  const assigned_cancellations = cancellation_reasons.reduce((sum, item) => sum + item.count, 0);
  cancellation_reasons.push({ reason: 'Other', count: canceled_bookings_count - assigned_cancellations });
  
  // Enhanced most frequent units with more detail
  const most_frequent_units = [];
  const totalUnits = 15;
  let totalBookings = 0;
  
  for (let i = 1; i <= totalUnits; i++) {
    const unit_id = `U${String(i).padStart(3, '0')}`;
    const booking_count = randomInt(5, 80, rng);
    totalBookings += booking_count;
    
    most_frequent_units.push({
      unit_id,
      room_type: randomElement(roomTypes, rng).type,
      booking_count,
      average_stay: randomFloat(1.5, 5, rng, 1),
      average_rate: randomInt(100, 300, rng),
      total_revenue: null, // Will calculate after
      occupancy_percentage: randomInt(40, 95, rng)
    });
  }
  
  // Calculate total revenue for each unit
  most_frequent_units.forEach(unit => {
    unit.total_revenue = Math.round(unit.booking_count * unit.average_stay * unit.average_rate);
  });
  
  // Sort units by booking count (descending)
  most_frequent_units.sort((a, b) => b.booking_count - a.booking_count);
  
  // Enhanced income data with breakdowns
  const total_income_month = randomInt(100000, 500000, rng);
  const total_income_year = randomInt(total_income_month * 8, total_income_month * 12, rng);
  
  // Revenue by source
  const revenue_sources = {
    room: parseFloat((total_income_month * randomFloat(0.65, 0.75, rng)).toFixed(2)),
    food_beverage: parseFloat((total_income_month * randomFloat(0.15, 0.2, rng)).toFixed(2)),
    spa: parseFloat((total_income_month * randomFloat(0.05, 0.1, rng)).toFixed(2)),
    events: parseFloat((total_income_month * randomFloat(0.03, 0.08, rng)).toFixed(2))
  };
  
  // Calculate "other" to make the total match
  const assigned_revenue = Object.values(revenue_sources).reduce((sum, val) => sum + val, 0);
  revenue_sources.other = parseFloat((total_income_month - assigned_revenue).toFixed(2));
  
  // Generate daily revenue breakdown
  const daily_revenue = generateDailyRevenue(targetMonth, targetYear, rng);
  
  // Return the enhanced data structure
  return {
    month: targetMonth,
    year: targetYear,
    booking_arrivals: {
      current_month_arrivals,
      current_year_arrivals,
      percentage_current_month,
      daily_arrivals
    },
    member_vs_general_arrivals: {
      member_arrivals,
      general_arrivals,
      member_breakdown: {
        bronze: bronze_members,
        silver: silver_members,
        gold: gold_members,
        platinum: platinum_members
      }
    },
    today_arrivals_departures: {
      today_arrivals,
      today_departures,
      arrival_hours,
      departure_hours
    },
    occupancy_and_adr: {
      occupancy_rate,
      adr,
      daily_occupancy
    },
    guest_birthdays,
    age_group_segmentation: {
      ...age_group_segmentation,
      child_age_groups
    },
    canceled_bookings: {
      canceled_bookings: canceled_bookings_count,
      canceled_percentage,
      cancellation_reasons
    },
    most_frequent_units,
    total_income: {
      total_income_month,
      total_income_year,
      revenue_sources,
      daily_revenue
    }
  };
}

function generateBookings(month, year, count, rng) {
  const bookings = [];
  for (let i = 1; i <= count; i++) {
    bookings.push(generateBooking(month, year, rng, i));
  }
  return bookings;
}

function generateHotelData(rng) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Generate current month data with provided RNG
  const currentMonthData = generateMonthlyData(currentMonth, currentYear, rng);
  
  // Add sample bookings for the current month
  const bookings = generateBookings(currentMonth, currentYear, 30, rng);
  currentMonthData.bookings = bookings;

  // Generate last 12 months data (expanded from 6 to 12)
  const historicalData = [];
  for (let i = 1; i <= 12; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const seed = `${year}-${month}`;
    const historicalRng = seedrandom(seed);
    const monthData = generateMonthlyData(month, year, historicalRng);
    
    // Add historical bookings (fewer for older months)
    if (i <= 3) { // Only for recent months
      const bookingCount = 20 - (i * 5); // Fewer bookings as we go back in time
      monthData.bookings = generateBookings(month, year, Math.max(5, bookingCount), historicalRng);
    }
    
    historicalData.push(monthData);
  }
  
  // Add year-over-year comparisons
  const yoyData = {
    occupancy: [],
    revenue: [],
    adr: []
  };
  
  // Get data from same month last year
  const lastYearMonth = historicalData.find(data => 
    data.month === currentMonth && data.year === currentYear - 1
  );
  
  if (lastYearMonth) {
    yoyData.occupancy = [
      { year: currentYear - 1, value: lastYearMonth.occupancy_and_adr.occupancy_rate },
      { year: currentYear, value: currentMonthData.occupancy_and_adr.occupancy_rate }
    ];
    
    yoyData.revenue = [
      { year: currentYear - 1, value: lastYearMonth.total_income.total_income_month },
      { year: currentYear, value: currentMonthData.total_income.total_income_month }
    ];
    
    yoyData.adr = [
      { year: currentYear - 1, value: lastYearMonth.occupancy_and_adr.adr },
      { year: currentYear, value: currentMonthData.occupancy_and_adr.adr }
    ];
  }

  return {
    current: currentMonthData,
    historical: historicalData,
    yoy_comparison: yoyData
  };
}

module.exports = { generateHotelData, generateGuest };