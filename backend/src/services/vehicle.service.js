import { AppError } from '../utils/app-error.js';

const DEFAULT_VEHICLES = [
  { id: '11111111-1111-1111-1111-111111111111', code: 'cab', display_name: 'Cab Sedan', capacity: 4, is_active: true },
  { id: '22222222-2222-2222-2222-222222222222', code: 'bike', display_name: 'Bike Taxi', capacity: 1, is_active: true },
  { id: '33333333-3333-3333-3333-333333333333', code: 'auto', display_name: 'Auto Rickshaw', capacity: 3, is_active: true },
  { id: '44444444-4444-4444-4444-444444444444', code: 'scooter', display_name: 'EV Scooter', capacity: 2, is_active: true },
  { id: '55555555-5555-5555-5555-555555555555', code: 'suv', display_name: 'SUV / XL', capacity: 6, is_active: true },
  { id: '66666666-6666-6666-6666-666666666666', code: 'shuttle', display_name: 'Campus Shuttle', capacity: 12, is_active: true }
];

export async function listActiveVehicleTypes(userClient) {
  if (!userClient || typeof userClient.from !== 'function') {
    return DEFAULT_VEHICLES;
  }

  try {
    const { data, error } = await userClient
      .from('vehicle_types')
      .select('id,code,display_name,capacity,is_active')
      .eq('is_active', true)
      .order('display_name');

    if (error || !data || data.length === 0) {
      return DEFAULT_VEHICLES;
    }
    return data;
  } catch {
    return DEFAULT_VEHICLES;
  }
}
