// ============================================================
//  ServiConnect — In-Memory Data Store
//  Replace with MongoDB/PostgreSQL in production
// ============================================================

const bcrypt = require('bcryptjs');

// Seed some demo data so the app works out of the box
const hash = (pw) => bcrypt.hashSync(pw, 10);

const store = {
  customers: [
    {
      id: 'c1',
      firstName: 'Ravi',
      lastName: 'Kumar',
      email: 'ravi@example.com',
      phone: '9876543210',
      city: 'Hyderabad',
      passwordHash: hash('password123'),
      avatar: '👤',
      lat: 17.4447,
      lng: 78.3483, // Hyderabad Banjara Hills-ish
      recentJobs: [],
      createdAt: new Date('2025-01-15'),
      bookings: ['b1', 'b2'],
      rating: 4.8,
    }
  ],

  workers: [
    {
      id: 'w1',
      firstName: 'Suresh',
      lastName: 'Reddy',
      email: 'suresh@example.com',
      phone: '9123456789',
      city: 'Hyderabad',
      skills: ['Plumbing', 'Electrical'],
      experience: '5-10 years',
      passwordHash: hash('password123'),
      avatar: '👷',
      isAvailable: true,
      isVerified: true,
      rating: 4.9,
      totalJobs: 128,
      totalEarnings: 94200,
      jobsThisMonth: 18,
      earningsThisMonth: 13400,
      createdAt: new Date('2024-11-10'),
      completedJobs: ['b1', 'b2'],
      lat: 17.4447,
      lng: 78.3483,
    },
    {
      id: 'w2',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya@example.com',
      phone: '9988776655',
      city: 'Chennai',
      skills: ['Cleaning', 'Painting'],
      experience: '3-5 years',
      passwordHash: hash('password123'),
      avatar: '👩‍🔧',
      lat: 13.0827,
      lng: 80.2707, // Chennai center-ish
      recentJobs: [],
      isAvailable: false,
      isVerified: true,
      rating: 4.7,
      totalJobs: 74,
      totalEarnings: 52800,
      jobsThisMonth: 12,
      earningsThisMonth: 8800,
      createdAt: new Date('2025-02-01'),
      activeJobs: [],
      completedJobs: [],
      lat: 13.0827,
      lng: 80.2707
    }
  ],

  bookings: [
    {
      id: 'b1',
      customerId: 'c1',
      workerId: 'w1',
      service: 'Plumbing',
      description: 'Pipe burst in bathroom',
      status: 'completed',
      price: 850,
      rating: 5,
      review: 'Excellent and fast work!',
      address: '12, Banjara Hills, Hyderabad',
      createdAt: new Date('2025-03-01'),
      completedAt: new Date('2025-03-01'),
    },
    {
      id: 'b2',
      customerId: 'c1',
      workerId: 'w1',
      service: 'Electrical',
      description: 'Switch board repair',
      status: 'completed',
      price: 600,
      rating: 5,
      review: 'Very professional',
      address: '12, Banjara Hills, Hyderabad',
      createdAt: new Date('2025-03-05'),
      completedAt: new Date('2025-03-05'),
    }
  ],

  // Helper counters for new IDs
  _nextCustomerId: 2,
  _nextWorkerId: 3,
  _nextBookingId: 3,
};

store.newCustomerId = () => `c${store._nextCustomerId++}`;
store.newWorkerId  = () => `w${store._nextWorkerId++}`;
store.newBookingId = () => `b${store._nextBookingId++}`;

module.exports = store;
