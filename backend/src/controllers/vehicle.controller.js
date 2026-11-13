import { success } from '../utils/api-response.js';
import { listActiveVehicleTypes } from '../services/vehicle.service.js';

export async function getVehicleTypes(req, res) {
  const items = await listActiveVehicleTypes(req.supabase);
  return success(res, { items });
}
