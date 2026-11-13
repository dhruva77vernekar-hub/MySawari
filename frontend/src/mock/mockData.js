// Belagavi mock locations and rides
export const MOCK_LOCATIONS = [
  { id: '1', name: 'KLE Technological University Campus', area: 'Udyambag, Belagavi', lat: 15.8281, lng: 74.4925 },
  { id: '2', name: 'Rani Chennamma Circle', area: 'Central Belagavi', lat: 15.8595, lng: 74.5089 },
  { id: '3', name: 'Belagavi Railway Station', area: 'Camp, Belagavi', lat: 15.8672, lng: 74.5126 },
  { id: '4', name: 'Bogarves Green Plaza', area: 'Khade Bazar, Belagavi', lat: 15.8542, lng: 74.5054 },
  { id: '5', name: 'VTU Main Campus', area: 'Santi Bastawad Road, Belagavi', lat: 15.7982, lng: 74.5381 }
];

export const VEHICLE_DATA = [
  {
    id: 1,
    code: 'cab',
    label: 'Cab',
    tagline: 'Comfort & AC · 4 Seats',
    tag: 'COMFORT',
    seats: 4,
    baseFare: 50,
    perKm: 14,
    perMin: 1.5,
    minFare: 80,
    etaMin: 4,
    color: '#3A4DFF'
  },
  {
    id: 2,
    code: 'bike',
    label: 'Bike Taxi',
    tagline: 'Fastest in Traffic · 1 Seat',
    tag: 'FASTEST',
    seats: 1,
    baseFare: 20,
    perKm: 6,
    perMin: 0.5,
    minFare: 30,
    etaMin: 2,
    color: '#FFC21A'
  },
  {
    id: 3,
    code: 'scooter',
    label: 'Scooter / Auto',
    tagline: 'Pocket-friendly · 2 Seats',
    tag: 'CHEAPEST',
    seats: 2,
    baseFare: 30,
    perKm: 9,
    perMin: 0.8,
    minFare: 45,
    etaMin: 3,
    color: '#45E0F2'
  }
];

export const MOCK_CAPTAINS = [
  {
    id: 'c1',
    name: 'Suresh Patil',
    rating: 4.88,
    trips: 1420,
    vehicleModel: 'Hero Splendor Plus',
    plateNumber: 'KA-22-EX-4912',
    phone: '+91 98450 12345',
    vehicleCode: 'bike'
  },
  {
    id: 'c2',
    name: 'Basavaraj Marathe',
    rating: 4.92,
    trips: 2840,
    vehicleModel: 'Maruti Suzuki Dzire',
    plateNumber: 'KA-22-M-8891',
    phone: '+91 94481 98765',
    vehicleCode: 'cab'
  },
  {
    id: 'c3',
    name: 'Praveen Kulkarni',
    rating: 4.75,
    trips: 980,
    vehicleModel: 'Bajaj RE Auto',
    plateNumber: 'KA-22-A-3210',
    phone: '+91 99002 44556',
    vehicleCode: 'scooter'
  }
];

export const MOCK_RIDE_HISTORY = [
  {
    id: 'ride-901',
    date: 'Today, 10:15 AM',
    pickup: 'KLE Tech Campus',
    drop: 'Rani Chennamma Circle',
    vehicle: 'Bike Taxi',
    vehicleCode: 'bike',
    fare: 35,
    status: 'completed',
    captain: 'Suresh Patil'
  },
  {
    id: 'ride-899',
    date: 'Yesterday, 6:40 PM',
    pickup: 'Bogarves Green Plaza',
    drop: 'Belagavi Railway Station',
    vehicle: 'Cab',
    vehicleCode: 'cab',
    fare: 98,
    status: 'completed',
    captain: 'Basavaraj Marathe'
  },
  {
    id: 'ride-876',
    date: '10 Nov 2026',
    pickup: 'VTU Campus',
    drop: 'KLE Tech Campus',
    vehicle: 'Scooter / Auto',
    vehicleCode: 'scooter',
    fare: 55,
    status: 'cancelled',
    captain: null
  }
];
